# -*- coding: utf-8 -*-
"""
02_train_model.py
==================
Prétraitement, gestion du déséquilibre des classes (SMOTE), entraînement
et comparaison de 3 modèles de scoring microcrédit :
    - Régression Logistique (baseline interprétable)
    - Random Forest
    - XGBoost

Sélection du meilleur modèle sur la base du F1-score et du ROC-AUC de la
classe minoritaire (1 = défaut), optimisation du seuil de décision, puis
sauvegarde du pipeline complet (prétraitement + modèle) + de l'explainer
SHAP pour l'application Streamlit.
"""

import json
import warnings

import joblib
import numpy as np
import pandas as pd
import shap
from imblearn.over_sampling import SMOTE
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, classification_report,
                              f1_score, precision_recall_curve, recall_score,
                              roc_auc_score)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")
RNG = 42

# ---------------------------------------------------------------------
# 1. Chargement des données
# ---------------------------------------------------------------------
df = pd.read_csv("data/credit_wa_dataset.csv")
TARGET = "defaut_credit"

drop_cols = ["id_client", TARGET]
X = df.drop(columns=drop_cols)
y = df[TARGET]

num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
cat_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()

print(f"Variables numériques ({len(num_cols)}): {num_cols}")
print(f"Variables catégorielles ({len(cat_cols)}): {cat_cols}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RNG, stratify=y
)

# ---------------------------------------------------------------------
# 2. Prétraitement (imputation NA historique client nouveau + encodage)
# ---------------------------------------------------------------------
numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])
categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore")),
])
preprocessor = ColumnTransformer(transformers=[
    ("num", numeric_transformer, num_cols),
    ("cat", categorical_transformer, cat_cols),
])

# Fit preprocessor & transform (nécessaire pour appliquer SMOTE en amont des modèles)
X_train_proc = preprocessor.fit_transform(X_train)
X_test_proc = preprocessor.transform(X_test)

feature_names = (
    num_cols +
    list(preprocessor.named_transformers_["cat"]["onehot"].get_feature_names_out(cat_cols))
)

# ---------------------------------------------------------------------
# 3. Rééquilibrage des classes avec SMOTE (train uniquement)
# ---------------------------------------------------------------------
print(f"\nDistribution avant SMOTE : {dict(y_train.value_counts())}")
smote = SMOTE(random_state=RNG)
X_train_res, y_train_res = smote.fit_resample(X_train_proc, y_train)
print(f"Distribution après SMOTE : {dict(pd.Series(y_train_res).value_counts())}")

# ---------------------------------------------------------------------
# 4. Entraînement et comparaison des 3 modèles
# ---------------------------------------------------------------------
models = {
    "Regression_Logistique": LogisticRegression(max_iter=2000, random_state=RNG),
    "Random_Forest": RandomForestClassifier(
        n_estimators=300, max_depth=10, min_samples_leaf=5, random_state=RNG, n_jobs=-1
    ),
    "XGBoost": XGBClassifier(
        n_estimators=300, max_depth=4, learning_rate=0.06,
        subsample=0.9, colsample_bytree=0.9, eval_metric="logloss",
        random_state=RNG, n_jobs=-1
    ),
}

def best_f1_threshold(y_true, proba):
    p, r, t = precision_recall_curve(y_true, proba)
    f1 = 2 * p * r / (p + r + 1e-9)
    idx = np.argmax(f1[:-1]) if len(t) > 0 else 0
    return (float(t[idx]) if len(t) > 0 else 0.5), float(f1[idx])

results = {}
fitted_models = {}
proba_cache = {}
for name, model in models.items():
    model.fit(X_train_res, y_train_res)
    proba = model.predict_proba(X_test_proc)[:, 1]
    proba_cache[name] = proba
    pred_05 = (proba >= 0.5).astype(int)
    opt_thr, opt_f1 = best_f1_threshold(y_test, proba)
    results[name] = {
        "accuracy_seuil_0.5": round(accuracy_score(y_test, pred_05), 4),
        "recall_classe1_seuil_0.5": round(recall_score(y_test, pred_05), 4),
        "f1_classe1_seuil_0.5": round(f1_score(y_test, pred_05), 4),
        "roc_auc": round(roc_auc_score(y_test, proba), 4),
        "seuil_optimal_f1": round(opt_thr, 3),
        "f1_classe1_seuil_optimal": round(opt_f1, 4),
    }
    fitted_models[name] = model
    print(f"\n=== {name} (seuil 0.5) ===")
    print(classification_report(y_test, pred_05, target_names=["Bon payeur", "Défaut"]))

print("\nComparatif des modèles :")
print(pd.DataFrame(results).T.to_string())

# Critère de sélection : le déséquilibre des classes et le coût métier (un défaut non
# détecté coûte plus cher qu'un bon dossier refusé à tort) imposent de choisir le
# modèle sur le F1-score de la classe "Défaut" au SEUIL OPTIMISÉ, pas sur l'accuracy
# globale (trompeuse à 88% de bons payeurs) ni sur le seuil 0.5 par défaut.
best_name = max(results, key=lambda k: results[k]["f1_classe1_seuil_optimal"])
best_model = fitted_models[best_name]
print(f"\n>>> Modèle retenu (meilleur F1 classe Défaut au seuil optimisé) : {best_name}")

# ---------------------------------------------------------------------
# 5. Optimisation du seuil de décision (coût métier : un faux négatif
#    - accorder un crédit à un mauvais payeur - coûte bien plus cher
#    qu'un faux positif - refuser à tort un bon payeur)
# ---------------------------------------------------------------------
proba_best = proba_cache[best_name]
best_threshold, _ = best_f1_threshold(y_test, proba_best)
print(f"Seuil optimal (max F1) : {best_threshold:.3f}")

# Seuils métier à 3 zones : vert / orange (examen manuel) / rouge
seuil_bas = round(max(best_threshold - 0.15, 0.10), 2)
seuil_haut = round(min(best_threshold + 0.10, 0.90), 2)
print(f"Zones de décision -> Vert: proba<{seuil_bas} | Orange: {seuil_bas}-{seuil_haut} | Rouge: >{seuil_haut}")

# ---------------------------------------------------------------------
# 6. Explicabilité SHAP (sur le modèle retenu)
# ---------------------------------------------------------------------
if best_name == "Regression_Logistique":
    explainer = shap.LinearExplainer(best_model, X_train_res)
else:
    explainer = shap.TreeExplainer(best_model)

# petit échantillon de fond pour un calcul SHAP rapide (contexte low-resource)
background_idx = np.random.RandomState(RNG).choice(X_train_res.shape[0], size=200, replace=False)
X_background = X_train_res[background_idx]

# ---------------------------------------------------------------------
# 7. Sauvegarde des artefacts pour l'application Streamlit
# ---------------------------------------------------------------------
joblib.dump(preprocessor, "models/preprocessor.pkl")
joblib.dump(best_model, "models/best_model.pkl")
joblib.dump(feature_names, "models/feature_names.pkl")
joblib.dump(num_cols, "models/num_cols.pkl")
joblib.dump(cat_cols, "models/cat_cols.pkl")
joblib.dump(X_background, "models/shap_background.pkl")

meta = {
    "best_model_name": best_name,
    "results": results,
    "best_threshold_f1": round(best_threshold, 3),
    "seuil_vert_max": seuil_bas,
    "seuil_rouge_min": seuil_haut,
    "n_train": int(len(X_train)),
    "n_test": int(len(X_test)),
    "taux_defaut_global": round(float(y.mean()), 4),
}
with open("models/metadata.json", "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)

print("\nArtefacts sauvegardés dans models/ :")
print(" - preprocessor.pkl, best_model.pkl, feature_names.pkl, shap_background.pkl, metadata.json")
print("\nTerminé.")

# -*- coding: utf-8 -*-
"""
02_train_model.py
==================
Prétraitement, gestion du déséquilibre des classes (SMOTE), optimisation
des hyperparamètres par recherche bayésienne (Optuna) et comparaison de
5 modèles + un stacking pour le scoring microcrédit SAMDE :
    - Régression Logistique (baseline interprétable)
    - Random Forest
    - XGBoost
    - LightGBM
    - CatBoost
    - Stacking (méta-modèle logistique sur les 5 modèles ci-dessus)

Historique des versions :
  V1 : hyperparamètres fixés "à dire d'expert", sans recherche ni référence.
  V2 : GridSearchCV/RandomizedSearchCV avec grilles justifiées en commentaire
       à partir de la littérature du credit scoring.
  V3 (ce fichier) : recherche bayésienne Optuna (TPE sampler, cf. Akiba et al.,
       2019, "Optuna: A Next-generation Hyperparameter Optimization
       Framework") sur un espace de recherche plus large que V2, avec DEUX
       objectifs distincts par modèle :
         (a) F1 de la classe "Défaut" (critère technique)
         (b) coût métier attendu FN/FP (critère financier), avec une
             hypothèse de perte en cas de défaut (LGD) explicitée et
             calée sur les paramètres déjà utilisés dans le générateur
             du dataset synthétique (cf. commentaire section 3.2).
       Ce fichier remplace un script intermédiaire qui contenait plusieurs
       bugs bloquants avant intégration (dict comprehension invalide,
       variables non définies, incohérence SMOTE entre la recherche et le
       ré-entraînement final, coûts métier posés au hasard) — corrigés
       ci-dessous, voir commentaires.
"""

import json
import os
import sys
import warnings

import joblib
import numpy as np
import optuna
import pandas as pd
import shap
from catboost import CatBoostClassifier
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from lightgbm import LGBMClassifier
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, f1_score,
                              precision_recall_curve, recall_score,
                              roc_auc_score)
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")
optuna.logging.set_verbosity(optuna.logging.WARNING)
RNG = 42
N_TRIALS = 6  # par objectif et par modèle ; compromis exploration/temps de calcul (hackathon, pas de GPU/CI gratuit)

# ---------------------------------------------------------------------
# 1. Chargement des données + split TRAIN / VALIDATION / TEST
# ---------------------------------------------------------------------
# Correction d'un problème signalé lors de la relecture externe du projet :
# la V3 précédente choisissait à la fois le SEUIL de décision ET le MODÈLE
# final en les évaluant sur le même jeu de test qui servait aussi à publier
# la performance finale. Ce jeu de test n'était donc plus un jeu de test
# indépendant (il avait été utilisé pour une décision de sélection), ce qui
# biaise optimistement les chiffres annoncés. Ce fichier introduit un
# troisième sous-ensemble :
#   - TRAIN (70%)      : entraînement des modèles, recherche Optuna (CV interne)
#   - VALIDATION (15%) : choix du seuil de décision ET choix du modèle final
#   - TEST (15%)       : jamais utilisé pour une décision - sert UNE SEULE FOIS,
#                        à la fin, pour publier une performance honnête.
# BASE B produite par scripts/01_generate_dataset.py : id_client + features
# modèle + cible uniquement (aucune colonne d'identité, aucune copie de la
# cible, aucun score pré-calculé -> pas de fuite possible ici).
df = pd.read_csv("data/dataset_entrainement.csv")
TARGET = "defaut_credit"
MONTANT_COL = "montant_credit_demande_fcfa"  # nécessaire au calcul du coût métier (section 3.2)
GARANTIE_COL = "garantie"

# Garde-fou anti-fuite : si un jour le CSV d'entrée reprenait des colonnes de
# sortie / d'identité, on s'arrête ici plutôt que de publier une AUC gonflée.
_COLONNES_INTERDITES = {
    "score_ia", "decision_scoring_cif", "proba_defaut_latent",
    "discipline_latent", "richesse_latent", "cible_defaut",
    "nom", "prenom", "email", "numero_cnib", "numero_compte", "contact_telephonique",
}
_fuite = _COLONNES_INTERDITES.intersection(df.columns)
assert not _fuite, f"Colonnes interdites (fuite / identité) dans le dataset : {sorted(_fuite)}"
assert {MONTANT_COL, GARANTIE_COL, TARGET, "id_client"}.issubset(df.columns)

X = df.drop(columns=["id_client", TARGET])
y = df[TARGET].values

num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
cat_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()

print(f"Variables numériques ({len(num_cols)}): {num_cols}")
print(f"Variables catégorielles ({len(cat_cols)}): {cat_cols}")

X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=RNG, stratify=y
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=RNG, stratify=y_temp
)
montant_train = X_train[MONTANT_COL].values
montant_val = X_val[MONTANT_COL].values
montant_test = X_test[MONTANT_COL].values
garantie_train = X_train[GARANTIE_COL].values
garantie_val = X_val[GARANTIE_COL].values
garantie_test = X_test[GARANTIE_COL].values

print(f"Tailles -> train: {len(X_train)} | validation: {len(X_val)} | test: {len(X_test)}")

# ---------------------------------------------------------------------
# 2. Prétraitement
# ---------------------------------------------------------------------
# Deuxième correction : le prétraitement (imputation, standardisation, one-hot)
# est maintenant imbriqué DANS chaque pipeline de modèle (make_pipeline,
# section 5), refit à chaque pli de CV sur sa seule portion d'entraînement,
# au lieu d'être ajusté une fois pour toutes sur tout X_train avant la
# validation croisée (ce qui laissait les statistiques de imputation/scaling
# "voir" les observations des plis de validation). make_preprocessor() crée
# une instance fraîche à chaque appel : nécessaire car les folds Optuna sont
# évalués en parallèle (n_jobs=-1) et un même objet ColumnTransformer partagé
# entre threads serait une source de race condition.
def make_preprocessor():
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])
    return ColumnTransformer(transformers=[
        ("num", numeric_transformer, num_cols),
        ("cat", categorical_transformer, cat_cols),
    ])

# On garde un préprocesseur "à plat" (fit UNIQUEMENT sur X_train, jamais sur
# val/test) uniquement pour disposer des noms de variables en sortie très tôt
# dans le script (logs). Le préprocesseur réellement sauvegardé pour la
# production sera celui du pipeline du modèle retenu (section 8-9), pour
# garantir une correspondance exacte avec ce que ce modèle a vu à l'entraînement.
_feature_name_probe = make_preprocessor().fit(X_train)
feature_names = (
    num_cols +
    list(_feature_name_probe.named_transformers_["cat"]["onehot"].get_feature_names_out(cat_cols))
)

print(f"\nDistribution avant SMOTE (train) : {dict(pd.Series(y_train).value_counts())}")

# ---------------------------------------------------------------------
# 3. Fonctions utilitaires : seuils F1 et seuil "coût métier"
# ---------------------------------------------------------------------
def best_f1_threshold(y_true, proba):
    p, r, t = precision_recall_curve(y_true, proba)
    f1 = 2 * p * r / (p + r + 1e-9)
    if len(t) == 0:
        return 0.5, float(f1[0])
    idx = np.argmax(f1[:-1])
    return float(t[idx]), float(f1[idx])

# --- 3.2 Coût métier : hypothèse LGD documentée (validée avec l'utilisateur) ---
# FN (défaut non détecté, crédit accordé à tort) : perte attendue = LGD x montant
# du crédit accordé. LGD ("Loss Given Default") = part du principal effectivement
# perdue par la coopérative en cas de défaut, net de tout recouvrement partiel.
# IMPORTANT : on réutilise ICI EXACTEMENT la table LGD_PAR_GARANTIE déjà codée en
# dur dans ai-service/main.py (utilisée pour l'affichage de la "perte attendue"
# par dossier côté agent) plutôt que de poser une deuxième hypothèse LGD flat
# (ex. 50 %) qui serait incohérente avec ce qui tourne déjà en production. Ces
# valeurs (0.35 à 0.65 selon le type de garantie) restent une hypothèse de
# travail à recalibrer avec les données réelles de recouvrement de la
# coopérative partenaire — mais au moins, une SEULE hypothèse LGD existe dans
# tout le projet, pas deux qui divergent silencieusement.
LGD_PAR_GARANTIE = {
    "Bien matériel": 0.35,
    "Aval d'un tiers": 0.45,
    "Caution solidaire": 0.40,
    "Aucune": 0.65,
}
LGD_DEFAUT = 0.55  # même valeur de repli que dans ai-service/main.py si garantie inconnue

# FP (bon dossier refusé à tort) : coût d'opportunité = marge d'intérêt non perçue,
# PAS la perte du principal (jamais décaissé). Le générateur du dataset synthétique
# (01_generate_dataset.py, ~ligne 152) calcule le remboursement total attendu comme
# montant x 1.12, soit une marge d'intérêt implicite de 12 % du montant sur la durée
# du prêt. On réutilise ce même taux pour rester cohérent avec les hypothèses déjà
# posées ailleurs dans le projet plutôt que d'en inventer un nouveau.
MARGE_INTERET = 0.12

def _lgd_vector(garantie_array):
    return np.array([LGD_PAR_GARANTIE.get(g, LGD_DEFAUT) for g in garantie_array])

def business_cost(y_true, proba, threshold, montant, garantie, marge=MARGE_INTERET):
    """Coût total attendu (FCFA) = somme des pertes FN (LGD par type de garantie) + coûts d'opportunité FP."""
    pred = (proba >= threshold).astype(int)
    fn_mask = (pred == 0) & (y_true == 1)
    fp_mask = (pred == 1) & (y_true == 0)
    lgd_vec = _lgd_vector(garantie[fn_mask])
    cout_fn = float(np.sum(montant[fn_mask] * lgd_vec))
    cout_fp = float(np.sum(montant[fp_mask] * marge))
    return cout_fn + cout_fp

def best_financial_threshold(y_true, proba, montant, garantie):
    thresholds = np.linspace(0.01, 0.99, 99)
    costs = [business_cost(y_true, proba, t, montant, garantie) for t in thresholds]
    best_idx = int(np.argmin(costs))
    return float(thresholds[best_idx]), float(costs[best_idx])

# ---------------------------------------------------------------------
# 4. Espaces de recherche Optuna (bornes justifiées par la littérature)
# ---------------------------------------------------------------------
# Logistic Regression : Lessmann et al. (2015) et Siddiqi (2017) tunent la
# régularisation sur une échelle log ; l1 inclus pour la parcimonie (scorecard).
# Random Forest : Brown & Mues (2012) — profondeur limitée pour contenir le
# sur-apprentissage sur la classe minoritaire.
# XGBoost : Chen & Guestrin (2016) + Xia et al. (2017, credit scoring) — arbres
# peu profonds, subsample/colsample < 1 pour réduire la variance.
# LightGBM : Ke et al. (2017) — mêmes bornes de profondeur/learning_rate que
# XGBoost ; class_weight="balanced" combiné à SMOTE (la doc officielle LightGBM
# sur données déséquilibrées recommande de tester les deux ensemble).
# CatBoost : Prokhorenkova et al. (2018) — depth généralement plus faible que
# les autres GBM (ordered boosting limite le risque d'overfit à profondeur
# égale), d'où une borne haute réduite par rapport à Random Forest.
SPACES = {
    "LogisticRegression": lambda t: {
        "penalty": t.suggest_categorical("penalty", ["l1", "l2"]),
        "C": t.suggest_float("C", 0.001, 100.0, log=True),
        "solver": "liblinear",
        "max_iter": 2000,
        "random_state": RNG,
    },
    "RandomForest": lambda t: {
        "n_estimators": t.suggest_int("n_estimators", 200, 400),
        "max_depth": t.suggest_int("max_depth", 4, 12),
        "min_samples_leaf": t.suggest_int("min_samples_leaf", 5, 20),
        "max_features": t.suggest_categorical("max_features", ["sqrt", "log2"]),
        "random_state": RNG,
        "n_jobs": -1,
    },
    "XGBoost": lambda t: {
        "n_estimators": t.suggest_int("n_estimators", 200, 500),
        "max_depth": t.suggest_int("max_depth", 3, 6),
        "learning_rate": t.suggest_float("learning_rate", 0.01, 0.2, log=True),
        "subsample": t.suggest_float("subsample", 0.6, 1.0),
        "colsample_bytree": t.suggest_float("colsample_bytree", 0.6, 1.0),
        "eval_metric": "logloss",
        "random_state": RNG,
        "n_jobs": -1,
    },
    "LightGBM": lambda t: {
        "n_estimators": t.suggest_int("n_estimators", 200, 500),
        "max_depth": t.suggest_int("max_depth", 3, 6),
        "learning_rate": t.suggest_float("learning_rate", 0.01, 0.2, log=True),
        "class_weight": "balanced",
        "random_state": RNG,
        "n_jobs": -1,
        "verbosity": -1,
    },
    "CatBoost": lambda t: {
        "iterations": t.suggest_int("iterations", 150, 350),
        "depth": t.suggest_int("depth", 3, 7),
        "learning_rate": t.suggest_float("learning_rate", 0.01, 0.1, log=True),
        "random_state": RNG,
        "verbose": 0,
    },
}
CLASSES = {
    "LogisticRegression": LogisticRegression,
    "RandomForest": RandomForestClassifier,
    "XGBoost": XGBClassifier,
    "LightGBM": LGBMClassifier,
    "CatBoost": CatBoostClassifier,
}
# Modèles pour lesquels un explainer SHAP natif (Linear/Tree) existe -> condition
# de déployabilité (cf. section 7 : la sélection finale doit rester explicable,
# cohérent avec l'exigence déjà posée en section 2.4 de la note de présentation).
SHAP_COMPATIBLE = {"LogisticRegression", "RandomForest", "XGBoost", "LightGBM", "CatBoost"}

# ---------------------------------------------------------------------
# 5. Recherche Optuna : deux objectifs (F1 / coût métier) par modèle
# ---------------------------------------------------------------------
# Correction du script d'origine : SMOTE est maintenant appliqué de façon
# identique (dans un pipeline imblearn, refit à chaque fold) dans LES DEUX
# objectifs, alors que la version reçue n'appliquait SMOTE que pour
# l'objectif F1 et entraînait l'objectif financier sur données brutes
# déséquilibrées -> les deux critères n'étaient pas comparables.
cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=RNG)

def make_pipeline(model_class, params):
    return ImbPipeline(steps=[
        ("prep", make_preprocessor()),
        ("smote", SMOTE(random_state=RNG)),
        ("clf", model_class(**params)),
    ])

def objective_f1(trial, model_class, space_fn):
    params = space_fn(trial)
    scores = []
    for tr_idx, val_idx in cv.split(X_train, y_train):
        pipe = make_pipeline(model_class, params)
        pipe.fit(X_train.iloc[tr_idx], y_train[tr_idx])
        proba = pipe.predict_proba(X_train.iloc[val_idx])[:, 1]
        thr, f1opt = best_f1_threshold(y_train[val_idx], proba)
        scores.append(f1opt)
    return float(np.mean(scores))

def objective_financial(trial, model_class, space_fn):
    params = space_fn(trial)
    losses = []
    for tr_idx, val_idx in cv.split(X_train, y_train):
        pipe = make_pipeline(model_class, params)
        pipe.fit(X_train.iloc[tr_idx], y_train[tr_idx])
        proba = pipe.predict_proba(X_train.iloc[val_idx])[:, 1]
        _, min_cost = best_financial_threshold(y_train[val_idx], proba, montant_train[val_idx], garantie_train[val_idx])
        losses.append(min_cost)
    return float(np.mean(losses))

print(f"\n=== Recherche Optuna (TPE, {N_TRIALS} essais x 2 objectifs x 5 modèles, 3-fold CV) ===")
best_params_f1, best_params_fin = {}, {}
for name, model_class in CLASSES.items():
    space_fn = SPACES[name]

    study_f1 = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=RNG))
    study_f1.optimize(lambda t: objective_f1(t, model_class, space_fn), n_trials=N_TRIALS)
    best_params_f1[name] = space_fn(optuna.trial.FixedTrial(study_f1.best_params))
    print(f"{name} [objectif F1]       : {study_f1.best_params}  (F1 CV = {study_f1.best_value:.4f})")

    study_fin = optuna.create_study(direction="minimize", sampler=optuna.samplers.TPESampler(seed=RNG))
    study_fin.optimize(lambda t: objective_financial(t, model_class, space_fn), n_trials=N_TRIALS)
    best_params_fin[name] = space_fn(optuna.trial.FixedTrial(study_fin.best_params))
    print(f"{name} [objectif Financier]: {study_fin.best_params}  (coût CV = {study_fin.best_value:,.0f} FCFA)")

# ---------------------------------------------------------------------
# 6. Ré-entraînement final sur TRAIN entier (préprocesseur + SMOTE imbriqués)
# ---------------------------------------------------------------------
variants = {}
for name, model_class in CLASSES.items():
    variants[f"{name} (F1)"] = make_pipeline(model_class, best_params_f1[name])
    variants[f"{name} (Financier)"] = make_pipeline(model_class, best_params_fin[name])

# Stacking : combine les 5 variantes optimisées sur le critère F1 (cohérent avec
# l'intention du script reçu), méta-modèle = régression logistique. Chaque
# estimateur de base reste un pipeline préprocesseur+SMOTE+modèle ; StackingClassifier
# génère ses features de méta-niveau par validation croisée interne, donc tout le
# pipeline (y compris SMOTE) est lui aussi ré-appliqué à chaque fold interne.
stack_estimators = [(name, make_pipeline(CLASSES[name], best_params_f1[name])) for name in CLASSES]
variants["Stacking"] = StackingClassifier(
    estimators=stack_estimators,
    final_estimator=LogisticRegression(max_iter=2000, random_state=RNG),
    n_jobs=-1,
)

print("\n=== Entraînement final (sur TRAIN) + évaluation sur VALIDATION (choix du modèle et du seuil) ===")
report_val = {}
fitted = {}
for name, model in variants.items():
    model.fit(X_train, y_train)  # entraînement sur TRAIN uniquement (préprocesseur + SMOTE inclus dans le pipeline)
    proba = model.predict_proba(X_val)[:, 1]
    fitted[name] = model

    thr_f1, f1_opt = best_f1_threshold(y_val, proba)
    thr_fin, cout_opt = best_financial_threshold(y_val, proba, montant_val, garantie_val)
    cout_seuil05 = business_cost(y_val, proba, 0.5, montant_val, garantie_val)
    pred_05 = (proba >= 0.5).astype(int)

    report_val[name] = {
        "AUC-ROC": round(roc_auc_score(y_val, proba), 4),
        "Gini": round(2 * roc_auc_score(y_val, proba) - 1, 4),
        "Accuracy@0.5": round(accuracy_score(y_val, pred_05), 4),
        "Recall_classe1@0.5": round(recall_score(y_val, pred_05), 4),
        "Seuil_F1_optimal": round(thr_f1, 3),
        "F1_classe1@Seuil_F1": round(f1_opt, 4),
        "Seuil_Financier_optimal": round(thr_fin, 3),
        "Cout_total_FCFA@Seuil_Financier": int(cout_opt),
        "Gain_vs_seuil_0.5_FCFA": int(cout_seuil05 - cout_opt),
        "Recall_Defaut@Seuil_Financier": round(recall_score(y_val, (proba >= thr_fin).astype(int)), 4),
    }

results_val_df = pd.DataFrame(report_val).T
print(results_val_df.to_string())

# ---------------------------------------------------------------------
# 7. Sélection du modèle déployé (sur VALIDATION, jamais sur TEST)
# ---------------------------------------------------------------------
# Critère : coût métier minimal au seuil financier optimal (opérationnalise
# directement "un faux négatif coûte plus cher qu'un faux positif", déjà
# affirmé en section 2.4/4 de la note de présentation), SOUS CONTRAINTE d'un
# explainer SHAP natif disponible (Linear/Tree). Le Stacking est exclu du choix
# de déploiement pour cette raison : c'est un méta-modèle combinant 5 sorties,
# sans explication SHAP par variable native et cohérente avec les scorecards
# affichées aux agents. Il reste calculé et documenté ci-dessus à titre de
# référence/benchmark. Modèle ET seuil sont choisis ici, sur VALIDATION -
# TEST n'a encore jamais été regardé à ce stade du script.
eligible = {k: v for k, v in report_val.items() if k.split(" (")[0] in SHAP_COMPATIBLE and "Stacking" not in k}
best_name = min(eligible, key=lambda k: eligible[k]["Cout_total_FCFA@Seuil_Financier"])
best_model = fitted[best_name]
best_model_family = best_name.split(" (")[0]
print(f"\n>>> Modèle retenu pour le déploiement (choisi sur VALIDATION) : {best_name}")
print(f">>> (Stacking exclu du choix : non compatible avec l'explicabilité SHAP par dossier)")

# ai-service/main.py lit meta["seuil_vert_max"] / meta["seuil_rouge_min"] pour ses 3 zones
# de décision (ACCORD_FAVORABLE / A_EXAMINER / RISQUE_ELEVE) — on les recalcule ici à
# partir du seuil optimal choisi sur VALIDATION, avec la même marge de part et
# d'autre que la V2 (zone orange = examen manuel), pour rester synchronisé avec l'API.
seuil_deploye = report_val[best_name]["Seuil_Financier_optimal"]
seuil_vert_max = round(max(seuil_deploye - 0.15, 0.10), 2)
seuil_rouge_min = round(min(seuil_deploye + 0.10, 0.90), 2)
print(f">>> Zones de décision -> Vert: proba<{seuil_vert_max} | Orange: {seuil_vert_max}-{seuil_rouge_min} | Rouge: >{seuil_rouge_min}")

# ---------------------------------------------------------------------
# 7bis. Évaluation finale, honnête, sur TEST (une seule fois, modèle et
# seuil déjà figés à l'étape précédente - TEST n'intervient dans AUCUNE
# décision de sélection).
# ---------------------------------------------------------------------
proba_test = best_model.predict_proba(X_test)[:, 1]
pred_test_05 = (proba_test >= 0.5).astype(int)
pred_test_deploye = (proba_test >= seuil_deploye).astype(int)
cout_test_deploye = business_cost(y_test, proba_test, seuil_deploye, montant_test, garantie_test)
cout_test_05 = business_cost(y_test, proba_test, 0.5, montant_test, garantie_test)
report_test_final = {
    "AUC-ROC": round(roc_auc_score(y_test, proba_test), 4),
    "Gini": round(2 * roc_auc_score(y_test, proba_test) - 1, 4),
    "Accuracy@0.5": round(accuracy_score(y_test, pred_test_05), 4),
    "Recall_classe1@0.5": round(recall_score(y_test, pred_test_05), 4),
    "Seuil_deploye": seuil_deploye,
    "F1_classe1@Seuil_deploye": round(f1_score(y_test, pred_test_deploye), 4),
    "Recall_Defaut@Seuil_deploye": round(recall_score(y_test, pred_test_deploye), 4),
    "Cout_total_FCFA@Seuil_deploye": int(cout_test_deploye),
    "Gain_vs_seuil_0.5_FCFA": int(cout_test_05 - cout_test_deploye),
}
print(f"\n=== Performance finale HONNÊTE sur TEST (jamais vu avant, {len(X_test)} dossiers) - modèle : {best_name} ===")
for k, v in report_test_final.items():
    print(f"  {k}: {v}")

# ---------------------------------------------------------------------
# 8. Explicabilité SHAP (sur le modèle retenu)
# ---------------------------------------------------------------------
# best_prep est le préprocesseur réellement imbriqué dans le pipeline du
# modèle retenu (fit sur TRAIN uniquement, à l'intérieur de best_model) -
# on l'utilise tel quel plutôt qu'un préprocesseur "à plat" recréé séparément,
# pour garantir une correspondance exacte avec ce que best_clf a vu à
# l'entraînement (même instance fit, pas une copie supposée identique).
best_prep = best_model.named_steps["prep"]
best_clf = best_model.named_steps["clf"]

X_train_bg = best_prep.transform(X_train)
if hasattr(X_train_bg, "toarray"):
    X_train_bg = X_train_bg.toarray()
background_idx = np.random.RandomState(RNG).choice(X_train_bg.shape[0], size=200, replace=False)
X_background = X_train_bg[background_idx]

if best_model_family == "LogisticRegression":
    explainer = shap.LinearExplainer(best_clf, X_background)
else:
    explainer = shap.TreeExplainer(best_clf)

# ---------------------------------------------------------------------
# 9. Sauvegarde des artefacts + synchronisation ai-service/models/
# ---------------------------------------------------------------------
# Correction d'un problème critique signalé lors de la relecture externe :
# ce script sauvegardait uniquement dans models/ (racine du repo), jamais
# dans ai-service/models/ - le dossier que ai-service/main.py charge
# réellement au démarrage de l'API. Résultat : l'API continuait de servir
# l'ancien modèle (Régression Logistique, seuils 0,39/0,64) alors que ce
# script annonçait Random Forest. Les deux chemins de sauvegarde sont donc
# désormais synchronisés explicitement dans le même script, pour qu'il soit
# structurellement impossible que les deux répertoires divergent à nouveau.
import sklearn as _sklearn
ARTIFACT_DIRS = ["models", "ai-service/models"]
for out_dir in ARTIFACT_DIRS:
    os.makedirs(out_dir, exist_ok=True)
    joblib.dump(best_prep, f"{out_dir}/preprocessor.pkl")
    joblib.dump(best_clf, f"{out_dir}/best_model.pkl")
    joblib.dump(feature_names, f"{out_dir}/feature_names.pkl")
    joblib.dump(num_cols, f"{out_dir}/num_cols.pkl")
    joblib.dump(cat_cols, f"{out_dir}/cat_cols.pkl")
    joblib.dump(X_background, f"{out_dir}/shap_background.pkl")

def _clean(d):
    return {k: {kk: vv for kk, vv in v.items()} for k, v in d.items()}

meta = {
    "best_model_name": best_name,
    "best_model_family": best_model_family,
    "hyperparameter_search_method": f"Optuna TPESampler, {N_TRIALS} essais x 2 objectifs (F1 / coût métier) x 3 folds CV, sur TRAIN uniquement",
    "hyperparameters_f1_objective": _clean(best_params_f1),
    "hyperparameters_financial_objective": _clean(best_params_fin),
    "business_cost_assumptions": {
        "LGD_par_garantie": LGD_PAR_GARANTIE,
        "LGD_defaut_si_garantie_inconnue": LGD_DEFAUT,
        "marge_interet_faux_positif": MARGE_INTERET,
        "note": "Table LGD identique à ai-service/main.py (LGD_PAR_GARANTIE) — à recalibrer avec les données réelles de recouvrement de la coopérative partenaire.",
    },
    "results_comparatif_validation": report_val,
    "results_test_final_honnete": report_test_final,
    "seuil_deploye": seuil_deploye,
    "seuil_vert_max": seuil_vert_max,
    "seuil_rouge_min": seuil_rouge_min,
    "n_train": int(len(X_train)),
    "n_val": int(len(X_val)),
    "n_test": int(len(X_test)),
    "taux_defaut_global": round(float(y.mean()), 4),
    "environnement_entrainement": {
        "python_version": sys.version.split()[0],
        "scikit_learn": _sklearn.__version__,
        "numpy": np.__version__,
        "pandas": pd.__version__,
        "joblib": joblib.__version__,
        "shap": shap.__version__,
        "optuna": optuna.__version__,
        "note": "ai-service/requirements.txt doit épingler exactement ces versions pour éviter un InconsistentVersionWarning au chargement des .pkl.",
    },
}
for out_dir in ARTIFACT_DIRS:
    with open(f"{out_dir}/metadata.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

print(f"\nArtefacts sauvegardés et synchronisés dans : {', '.join(ARTIFACT_DIRS)}")
print("Terminé.")

import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

print("1. Chargement des données d'entraînement...")
df = pd.read_csv('../data/credit_wa_dataset.csv')

# Pour que ça marche directement avec notre API actuelle, on ne sélectionne
# que les 4 variables que nous avons définies dans main.py.
# (Bien sûr, plus tard vous pourrez ajouter le Mobile Money, le statut_bic, etc.)
features = ['age', 'revenu_mensuel_fcfa', 'charges_mensuelles_fcfa', 'anciennete_activite_annees']
target = 'defaut_credit'

X = df[features]
y = df[target]

print("2. Séparation en données d'apprentissage et de test...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("3. Entraînement de l'Intelligence Artificielle (XGBoost)...")
model = xgb.XGBClassifier(
    n_estimators=100, 
    max_depth=4, 
    learning_rate=0.1, 
    random_state=42,
    eval_metric='logloss'
)
model.fit(X_train, y_train)

# Petite vérification de la précision
y_pred = model.predict(X_test)
precision = accuracy_score(y_test, y_pred)
print(f"-> Précision sur les données de test : {precision * 100:.2f}%")

print("4. Sauvegarde du modèle...")
model.save_model('modele_xgboost.json')
print("Terminé ! Le fichier 'modele_xgboost.json' est prêt.")

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import xgboost as xgb
import pandas as pd
import os
from contextlib import asynccontextmanager

# Variable globale pour stocker le modèle en mémoire
model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    model_path = "modele_xgboost.json" # Modèle entraîné par l'équipe Data
    
    if os.path.exists(model_path):
        model = xgb.XGBClassifier()
        model.load_model(model_path)
        print("Modèle XGBoost chargé avec succès !")
    else:
        print("ATTENTION: Fichier modèle introuvable. L'API est démarrée mais en mode test.")
    yield

app = FastAPI(title="API Scoring Microcrédit - Moteur IA", lifespan=lifespan)

# Format des données attendues en entrée de l'API
class ClientData(BaseModel):
    age: int
    revenu_mensuel_fcfa: float
    charges_mensuelles_fcfa: float
    anciennete_activite_annees: float
    # Vous pourrez ajouter les autres variables ici plus tard

    # Vous pourrez ajouter les autres variables ici plus tard

@app.post("/api/score")
def calculer_score(data: ClientData):
    # En attendant le modèle final, on renvoie un score par défaut pour tester l'intégration avec Spring Boot
    if model is None:
        return {"score_risque": 45.0, "statut": "MODE_TEST_SANS_MODELE"}

    try:
        # On formate les données entrantes pour le modèle XGBoost
        df = pd.DataFrame([data.dict()])
        
        # Récupération de la probabilité de défaut (entre 0 et 1)
        # On convertit ensuite ça en score de risque sur 100
        probabilite_defaut = model.predict_proba(df)[0][1]
        score = float(round(probabilite_defaut * 100, 2))
        
        return {"score_risque": score, "statut": "SUCCES"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

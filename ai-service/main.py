"""
API Scoring Microcrédit — Moteur IA
Hackathon National d'Innovation CIF — Projet DigiCoop-WA+ (Thématique 02)

Ce service expose le même modèle (Régression Logistique + préprocesseur +
explicabilité SHAP + scorecard) que le prototype de recherche Samdé
(voir `models/`, entraîné par `scripts/02_train_model.py`), packagé ici
pour être appelé en production par le backend Spring Boot.

"""

import json
import os
from contextlib import asynccontextmanager
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# Variables globales, chargées une fois au démarrage du service
preprocessor = None
model = None
feature_names: List[str] = []
num_cols: List[str] = []
cat_cols: List[str] = []
background = None
explainer = None
meta = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global preprocessor, model, feature_names, num_cols, cat_cols, background, explainer, meta
    try:
        preprocessor = joblib.load(os.path.join(MODELS_DIR, "preprocessor.pkl"))
        model = joblib.load(os.path.join(MODELS_DIR, "best_model.pkl"))
        feature_names = joblib.load(os.path.join(MODELS_DIR, "feature_names.pkl"))
        num_cols = joblib.load(os.path.join(MODELS_DIR, "num_cols.pkl"))
        cat_cols = joblib.load(os.path.join(MODELS_DIR, "cat_cols.pkl"))
        background = joblib.load(os.path.join(MODELS_DIR, "shap_background.pkl"))
        with open(os.path.join(MODELS_DIR, "metadata.json"), encoding="utf-8") as f:
            meta = json.load(f)

        if "Logistique" in meta.get("best_model_name", ""):
            explainer = shap.LinearExplainer(model, background)
        else:
            explainer = shap.TreeExplainer(model)

        print(f"Modèle chargé avec succès : {meta.get('best_model_name')}")
    except Exception as e:
        print(f"ATTENTION : impossible de charger les artefacts du modèle ({e}). "
              f"L'API démarre en mode dégradé.")
    yield


app = FastAPI(title="API Scoring Microcrédit - Moteur IA", lifespan=lifespan)

# Seuils de décision par défaut si les métadonnées ne sont pas chargées
SEUIL_VERT_DEFAUT = 0.39
SEUIL_ROUGE_DEFAUT = 0.64

# Perte en cas de défaut (LGD) selon la garantie proposée par le client
LGD_PAR_GARANTIE = {
    "Bien matériel": 0.35,
    "Aval d'un tiers": 0.45,
    "Caution solidaire": 0.40,
    "Aucune": 0.65,
}


class ClientData(BaseModel):
    # --- Profil socio-démographique ---
    age: int
    sexe: str
    zone: str
    situation_matrimoniale: str
    niveau_education: str
    nombre_personnes_a_charge: int = 0

    # --- Activité économique ---
    secteur_activite: str
    anciennete_activite_annees: float
    revenu_mensuel_fcfa: float
    charges_mensuelles_fcfa: float

    # --- Relation avec la coopérative ---
    anciennete_cooperative_mois: int = 0
    membre_groupe_solidaire: bool = False
    epargne_solde_moyen_fcfa: float = 0
    regularite_epargne: str = "Aucune épargne"

    # --- Historique de crédit interne ---
    nombre_credits_anterieurs: int = 0
    taux_remboursement_historique_pct: Optional[float] = None
    jours_retard_moyen_historique: Optional[float] = None

    # --- Mobile Money ---
    possede_mobile_money: bool = False
    frequence_transactions_mm_mois: int = 0

    # --- Bureau d'Information sur le Crédit (BIC, dispositif régional UEMOA) ---
    interroge_bic: bool = False
    statut_bic: str = "Non consulté"
    nombre_prets_actifs_autres_institutions: int = 0
    encours_credit_autres_institutions_fcfa: float = 0

    # --- Demande de crédit ---
    objet_credit: str
    montant_credit_demande_fcfa: float
    duree_credit_mois: int
    garantie: str

    # Ratio d'endettement : si non fourni, calculé côté service (comme dans
    # le prototype Streamlit) à partir des charges + mensualités estimées.
    ratio_endettement: Optional[float] = None


class FacteurExplicatif(BaseModel):
    variable: str
    contribution: float
    sens: str  # "AUGMENTE_RISQUE" ou "REDUIT_RISQUE"


class ScoringResponse(BaseModel):
    statut: str
    score_risque: float          # probabilité de défaut en %, 0-100 (compat. historique)
    proba_defaut: float          # probabilité de défaut brute, 0-1
    zone_decision: str           # ACCORD_FAVORABLE | A_EXAMINER | RISQUE_ELEVE
    score_credit: Optional[int] = None       # score scorecard 300-900
    perte_attendue_fcfa: Optional[float] = None  # Expected Loss = PD x LGD x EAD
    lgd_utilise: Optional[float] = None
    ratio_endettement: Optional[float] = None
    explication: List[FacteurExplicatif] = []


def _calculer_ratio_endettement(data: ClientData) -> float:
    mensualite_estimee = data.montant_credit_demande_fcfa * 1.12 / max(data.duree_credit_mois, 1)
    mensualite_externe_estimee = data.encours_credit_autres_institutions_fcfa * 0.09
    return round(
        (data.charges_mensuelles_fcfa + mensualite_estimee + mensualite_externe_estimee)
        / max(data.revenu_mensuel_fcfa, 1),
        2,
    )


def _zone_decision(proba_defaut: float) -> str:
    seuil_vert = meta.get("seuil_vert_max", SEUIL_VERT_DEFAUT)
    seuil_rouge = meta.get("seuil_rouge_min", SEUIL_ROUGE_DEFAUT)
    if proba_defaut < seuil_vert:
        return "ACCORD_FAVORABLE"
    if proba_defaut < seuil_rouge:
        return "A_EXAMINER"
    return "RISQUE_ELEVE"


def _score_credit(proba_defaut: float) -> int:
    """Score à points (300-900), convention scorecard bancaire standard."""
    pdo, base, odds = 20, 600, 1.0
    facteur = pdo / np.log(2)
    offset = base - facteur * np.log(odds)
    p_safe = min(max(proba_defaut, 1e-6), 1 - 1e-6)
    return int(np.clip(offset + facteur * np.log((1 - p_safe) / p_safe), 300, 900))


@app.get("/health")
def health():
    return {"status": "ok", "modele_charge": model is not None,
            "modele": meta.get("best_model_name")}


@app.post("/api/score", response_model=ScoringResponse)
def calculer_score(data: ClientData):
    if model is None or preprocessor is None:
        # Mode dégradé : le modèle n'a pas pu être chargé (ex. artefacts absents du déploiement)
        return ScoringResponse(
            statut="MODE_TEST_SANS_MODELE",
            score_risque=45.0,
            proba_defaut=0.45,
            zone_decision="A_EXAMINER",
        )

    try:
        row = data.dict()

        # Conversions attendues par le préprocesseur entraîné (booléens -> 0/1)
        row["membre_groupe_solidaire"] = int(data.membre_groupe_solidaire)
        row["possede_mobile_money"] = int(data.possede_mobile_money)
        row["interroge_bic"] = int(data.interroge_bic)

        # Nouveau client sans historique : on impute comme le prototype (NaN)
        if data.nombre_credits_anterieurs == 0:
            row["taux_remboursement_historique_pct"] = np.nan
            row["jours_retard_moyen_historique"] = np.nan
        else:
            row["taux_remboursement_historique_pct"] = data.taux_remboursement_historique_pct
            row["jours_retard_moyen_historique"] = data.jours_retard_moyen_historique

        ratio_endettement = data.ratio_endettement
        if ratio_endettement is None:
            ratio_endettement = _calculer_ratio_endettement(data)
        row["ratio_endettement"] = ratio_endettement

        X_input = pd.DataFrame([row])[num_cols + cat_cols]
        X_proc = preprocessor.transform(X_input)
        if hasattr(X_proc, "toarray"):
            X_proc = X_proc.toarray()

        proba_defaut = float(model.predict_proba(X_proc)[0, 1])
        zone = _zone_decision(proba_defaut)
        score_credit = _score_credit(proba_defaut)

        lgd = LGD_PAR_GARANTIE.get(data.garantie, 0.55)
        ead = data.montant_credit_demande_fcfa
        perte_attendue = proba_defaut * lgd * ead

        # --- Explicabilité SHAP : facteurs les plus influents pour ce dossier ---
        explication: List[FacteurExplicatif] = []
        try:
            shap_values = explainer.shap_values(X_proc)
            sv = shap_values[0] if isinstance(shap_values, list) else shap_values[0]
            sv = np.array(sv).flatten()
            contrib = pd.Series(sv, index=feature_names).sort_values(key=np.abs, ascending=False).head(6)
            explication = [
                FacteurExplicatif(
                    variable=nom,
                    contribution=round(float(val), 4),
                    sens="AUGMENTE_RISQUE" if val > 0 else "REDUIT_RISQUE",
                )
                for nom, val in contrib.items()
            ]
        except Exception as e:
            print(f"Explication SHAP indisponible pour ce dossier : {e}")

        return ScoringResponse(
            statut="SUCCES",
            score_risque=float(round(proba_defaut * 100, 2)),
            proba_defaut=round(proba_defaut, 4),
            zone_decision=zone,
            score_credit=score_credit,
            perte_attendue_fcfa=round(perte_attendue, 0),
            lgd_utilise=lgd,
            ratio_endettement=ratio_endettement,
            explication=explication,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

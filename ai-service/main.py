"""
API Scoring Microcrédit — Moteur IA
Hackathon National d'Innovation CIF — Projet DigiCoop-WA+ (Thématique 02)

Expose le modèle entraîné par scripts/02_train_model.py sur
data/dataset_entrainement.csv (71 variables : cf. scripts/01_generate_dataset.py,
liste COLONNES_MODELE).

Le client (backend Spring) envoie les 65 variables BRUTES ; le service calcule
lui-même les 6 variables DÉRIVÉES avec exactement les mêmes formules que le
générateur du dataset :
  - indice_vulnerabilite_zone
  - future_echeance_credit_fcfa   (annuité réelle)
  - ratio_endettement
  - ratio_reste_a_vivre_absolu_fcfa
  - ratio_couverture_echeance_epargne
  - ratio_montant_demande_sur_max_anterieur
"""

import json
import logging
import os
from contextlib import asynccontextmanager
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sklearn.linear_model import LogisticRegression

logger = logging.getLogger("scoring_api")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

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

        # Explainer choisi sur le TYPE réel du modèle (pas sur un nom de texte).
        if isinstance(model, LogisticRegression):
            explainer = shap.LinearExplainer(model, background)
        else:
            explainer = shap.TreeExplainer(model)

        print(f"Modèle chargé : {meta.get('best_model_name')} "
              f"({len(num_cols)} num + {len(cat_cols)} cat)")
    except Exception as e:
        print(f"ATTENTION : artefacts du modèle non chargés ({e}). API en mode dégradé.")
    yield


app = FastAPI(title="API Scoring Microcrédit - Moteur IA", lifespan=lifespan)

SEUIL_VERT_DEFAUT = 0.39
SEUIL_ROUGE_DEFAUT = 0.64

# LGD par garantie (identique à la table du générateur / metadata.json).
LGD_PAR_GARANTIE = {
    "Bien matériel": 0.35,
    "Aval d'un tiers": 0.45,
    "Caution solidaire": 0.40,
    "Aucune": 0.65,
}

# Bases de l'indice de vulnérabilité géographique (cf. 01_generate_dataset.py).
BASE_VULN_ZONE = {"Urbaine": 0.20, "Semi-urbaine": 0.38, "Rurale": 0.55}
SECTEURS_AGRI = {"Agriculture", "Élevage"}
SOUS_SECTEUR_NA = "Non applicable"
SECT_SALARIE_FORMEL = "Salarié secteur formel"
BIC_NON_CONSULTE = "Non consulté"
BIC_PRET_EN_COURS = "Prêt en cours ailleurs"
BIC_INCIDENT = "Incident de paiement signalé ailleurs"


class ClientData(BaseModel):
    # --- Profil socio-démographique ---
    age: int = Field(30, ge=18, le=100)
    sexe: str = "Femme"
    zone: str = "Semi-urbaine"
    situation_matrimoniale: str = "Marié(e)"
    niveau_education: str = "Primaire"
    nombre_personnes_a_charge: int = Field(0, ge=0, le=30)

    # --- Activité économique ---
    secteur_activite: str
    sous_secteur_activite: str = SOUS_SECTEUR_NA
    saisonnalite_activite: int = Field(0, ge=0, le=1)
    anciennete_activite_annees: float = Field(..., ge=0, le=80)
    revenu_mensuel_fcfa: float = Field(..., gt=0)
    charges_mensuelles_fcfa: float = Field(0, ge=0)

    # --- Relation avec la coopérative ---
    anciennete_cooperative_mois: int = Field(0, ge=0)
    membre_groupe_solidaire: int = Field(0, ge=0, le=1)
    epargne_solde_moyen_fcfa: float = Field(0, ge=0)
    regularite_epargne: str = "Aucune épargne"

    # --- Historique de crédit interne (agrégats dérivés du détail des crédits passés) ---
    nombre_credits_anterieurs: int = Field(0, ge=0)
    taux_remboursement_historique_pct: Optional[float] = Field(None, ge=0, le=100)
    jours_retard_moyen_historique: Optional[float] = Field(None, ge=0)
    montant_total_emprunte_passe: float = Field(0, ge=0)
    delai_utilisation_credit_apres_deblocage_jours: Optional[float] = Field(None, ge=0)
    nombre_credits_soldes: int = Field(0, ge=0)
    part_credits_soldes_pct: Optional[float] = Field(None, ge=0, le=100)
    a_deja_defaut_interne: int = Field(0, ge=0, le=1)
    taux_remboursement_dernier_credit_pct: Optional[float] = Field(None, ge=0, le=100)
    jours_retard_max_historique: Optional[float] = Field(None, ge=0)
    nombre_incidents_paiement_total: int = Field(0, ge=0)
    nombre_reechelonnements_total: int = Field(0, ge=0)
    anciennete_dernier_credit_mois: Optional[float] = Field(None, ge=0)
    montant_max_credit_anterieur_fcfa: float = Field(0, ge=0)

    # --- Agrégats de transactions (vue consolidée CIF) ---
    total_transactions: int = Field(0, ge=0)
    volume_depots_fcfa: float = Field(0, ge=0)
    volume_retraits_fcfa: float = Field(0, ge=0)
    tx_mobile_money: int = Field(0, ge=0)

    # --- Mobile Money ---
    possede_mobile_money: int = Field(0, ge=0, le=1)
    frequence_transactions_mm_mois: int = Field(0, ge=0)
    mm_anciennete_compte_mois: Optional[float] = Field(None, ge=0)
    mm_anciennete_sim_mois: Optional[float] = Field(None, ge=0)
    mm_nombre_mois_actifs_12m: Optional[float] = Field(None, ge=0, le=12)
    mm_volume_transactions_mensuel_fcfa: float = Field(0, ge=0)
    mm_flux_entrants_mensuel_fcfa: float = Field(0, ge=0)
    mm_flux_sortants_mensuel_fcfa: float = Field(0, ge=0)
    mm_montant_remboursements_mm_fcfa: float = Field(0, ge=0)
    mm_solde_moyen_fcfa: float = Field(0, ge=0)
    mm_solde_minimum_fcfa: float = Field(0, ge=0)
    mm_evolution_solde_pct: Optional[float] = None
    mm_volatilite_flux_pct: Optional[float] = Field(None, ge=0)
    mm_ratio_depenses_credit_appel_data_pct: Optional[float] = Field(None, ge=0)

    # --- Comptes bancaires classiques ---
    nombre_comptes_bancaires: int = Field(0, ge=0)
    type_compte_principal: str = "Aucun"
    solde_compte_bancaire_fcfa: float = Field(0, ge=0)
    flux_depots_bancaires_mensuel_fcfa: float = Field(0, ge=0)
    flux_retraits_bancaires_mensuel_fcfa: float = Field(0, ge=0)
    nombre_rejets_prelevements_cheques_12m: int = Field(0, ge=0)

    # --- Bureau d'Information sur le Crédit (BIC) ---
    interroge_bic: int = Field(0, ge=0, le=1)
    statut_bic: str = BIC_NON_CONSULTE
    nombre_prets_actifs_autres_institutions: int = Field(0, ge=0)
    encours_credit_autres_institutions_fcfa: float = Field(0, ge=0)
    bic_nombre_credits_soldes_ailleurs: Optional[float] = Field(None, ge=0)
    bic_anciennete_dernier_incident_mois: Optional[float] = Field(None, ge=0)

    # --- Demande de crédit ---
    categorie_credit: str
    objet_credit: Optional[str] = None          # descriptif : NON utilisé par le modèle
    montant_credit_demande_fcfa: float = Field(..., gt=0)
    duree_credit_mois: int = Field(..., ge=1, le=60)
    taux_interet_nominal_annuel_pct: float = Field(14.0, gt=0, le=60)
    garantie: str


class FacteurExplicatif(BaseModel):
    variable: str
    contribution: float
    sens: str  # "AUGMENTE_RISQUE" | "REDUIT_RISQUE"


class ScoringResponse(BaseModel):
    statut: str
    score_risque: float          # proba de défaut en %, 0-100 (compat. historique)
    proba_defaut: float          # proba de défaut brute, 0-1
    zone_decision: str           # ACCORD_FAVORABLE | A_EXAMINER | RISQUE_ELEVE
    score_credit: Optional[int] = None   # score de solvabilité 0-100 (100 = meilleur)
    perte_attendue_fcfa: Optional[float] = None
    lgd_utilise: Optional[float] = None
    ratio_endettement: Optional[float] = None
    ratio_reste_a_vivre_absolu_fcfa: Optional[float] = None
    future_echeance_credit_fcfa: Optional[float] = None
    note_decision: Optional[str] = None   # règle métier ayant modifié la zone, le cas échéant
    explication: List[FacteurExplicatif] = []


# --- Variables optionnelles imputées par NaN (médiane du préprocesseur) -----
_NUMERIC_NULLABLE = (
    "taux_remboursement_historique_pct", "jours_retard_moyen_historique",
    "delai_utilisation_credit_apres_deblocage_jours",
    "part_credits_soldes_pct", "taux_remboursement_dernier_credit_pct",
    "jours_retard_max_historique", "anciennete_dernier_credit_mois",
    "mm_anciennete_compte_mois", "mm_anciennete_sim_mois", "mm_nombre_mois_actifs_12m",
    "mm_evolution_solde_pct", "mm_volatilite_flux_pct", "mm_ratio_depenses_credit_appel_data_pct",
    "bic_nombre_credits_soldes_ailleurs",
)
_MM_MONTANTS_ZERO = (
    "mm_volume_transactions_mensuel_fcfa", "mm_flux_entrants_mensuel_fcfa",
    "mm_flux_sortants_mensuel_fcfa", "mm_montant_remboursements_mm_fcfa",
    "mm_solde_moyen_fcfa", "mm_solde_minimum_fcfa",
)


def _echeance_annuite(montant: float, taux_annuel_pct: float, duree_mois: int) -> float:
    i = (taux_annuel_pct / 100.0) / 12.0
    n = max(int(duree_mois), 1)
    if i <= 0:
        return montant / n
    return montant * i / (1.0 - (1.0 + i) ** (-n))


def _preparer_row(data: ClientData) -> dict:
    """Applique les mêmes règles de cohérence 'valeur absente' que le générateur
    du dataset, puis calcule les 6 variables dérivées. Renvoie un dict des 71
    colonnes attendues par le préprocesseur."""
    row = data.model_dump()
    row.pop("objet_credit", None)

    # 1a. Aucun historique (primo-emprunteur) -> NaN sur les variables d'historique
    #     conditionnelles, 0 sur les compteurs (comme le générateur).
    if data.nombre_credits_anterieurs == 0:
        for k in ("taux_remboursement_historique_pct", "jours_retard_moyen_historique",
                  "delai_utilisation_credit_apres_deblocage_jours",
                  "part_credits_soldes_pct", "taux_remboursement_dernier_credit_pct",
                  "jours_retard_max_historique", "anciennete_dernier_credit_mois"):
            row[k] = np.nan
        for k in ("nombre_credits_soldes", "a_deja_defaut_interne",
                  "nombre_incidents_paiement_total", "nombre_reechelonnements_total"):
            row[k] = 0
        row["montant_max_credit_anterieur_fcfa"] = 0.0
        row["montant_total_emprunte_passe"] = 0.0

    # 1b. Pas de Mobile Money -> NaN sur les indicateurs, 0 sur les montants
    if int(data.possede_mobile_money) == 0:
        for k in ("mm_anciennete_compte_mois", "mm_anciennete_sim_mois",
                  "mm_nombre_mois_actifs_12m", "mm_evolution_solde_pct",
                  "mm_volatilite_flux_pct", "mm_ratio_depenses_credit_appel_data_pct"):
            row[k] = np.nan
        for k in _MM_MONTANTS_ZERO:
            row[k] = 0.0
        row["frequence_transactions_mm_mois"] = 0
        row["tx_mobile_money"] = 0

    # 1c. Pas de compte bancaire
    if data.nombre_comptes_bancaires == 0:
        row["type_compte_principal"] = "Aucun"
        for k in ("solde_compte_bancaire_fcfa", "flux_depots_bancaires_mensuel_fcfa",
                  "flux_retraits_bancaires_mensuel_fcfa"):
            row[k] = 0.0
        row["nombre_rejets_prelevements_cheques_12m"] = 0

    # 1d. BIC non consulté
    if int(data.interroge_bic) == 0:
        row["statut_bic"] = BIC_NON_CONSULTE
        row["bic_nombre_credits_soldes_ailleurs"] = np.nan

    # 1e. Engagements externes uniquement si "Prêt en cours ailleurs"
    if row["statut_bic"] != BIC_PRET_EN_COURS:
        row["nombre_prets_actifs_autres_institutions"] = 0
        row["encours_credit_autres_institutions_fcfa"] = 0.0

    # 1f. Ancienneté du dernier incident BIC : 999 = aucun (comme le générateur)
    if row["statut_bic"] == BIC_INCIDENT and data.bic_anciennete_dernier_incident_mois is not None:
        row["bic_anciennete_dernier_incident_mois"] = float(data.bic_anciennete_dernier_incident_mois)
    else:
        row["bic_anciennete_dernier_incident_mois"] = 999.0

    # 1g. Sous-secteur : seulement pour "Salarié secteur formel"
    if data.secteur_activite != SECT_SALARIE_FORMEL:
        row["sous_secteur_activite"] = SOUS_SECTEUR_NA

    # 1h. Ce qui reste à None -> NaN (imputation médiane du préprocesseur)
    for k in _NUMERIC_NULLABLE:
        if row.get(k) is None:
            row[k] = np.nan

    # 2. Variables dérivées (formules identiques à 01_generate_dataset.py)
    row["indice_vulnerabilite_zone"] = round(
        min(1.0, max(0.0,
            BASE_VULN_ZONE.get(data.zone, 0.38)
            + (0.10 if data.secteur_activite in SECTEURS_AGRI else 0.0))),
        3,
    )

    echeance = _echeance_annuite(
        data.montant_credit_demande_fcfa, data.taux_interet_nominal_annuel_pct, data.duree_credit_mois
    )
    mensualite_externe = row["encours_credit_autres_institutions_fcfa"] * 0.09
    revenu = max(data.revenu_mensuel_fcfa, 1.0)

    row["future_echeance_credit_fcfa"] = round(echeance, -2)
    row["ratio_endettement"] = round(
        (data.charges_mensuelles_fcfa + echeance + mensualite_externe) / revenu, 2
    )
    row["ratio_reste_a_vivre_absolu_fcfa"] = round(
        data.revenu_mensuel_fcfa - data.charges_mensuelles_fcfa - echeance, -2
    )
    row["ratio_couverture_echeance_epargne"] = (
        round(data.epargne_solde_moyen_fcfa / echeance, 2) if echeance > 0 else np.nan
    )
    # Montant demandé rapporté au plus gros crédit CIF déjà obtenu (NaN si primo).
    mx = data.montant_max_credit_anterieur_fcfa
    row["ratio_montant_demande_sur_max_anterieur"] = (
        round(data.montant_credit_demande_fcfa / max(mx, 1.0), 2)
        if (data.nombre_credits_anterieurs > 0 and mx and mx > 0) else np.nan
    )

    return row


def _zone_decision(proba_defaut: float) -> str:
    seuil_vert = meta.get("seuil_vert_max", SEUIL_VERT_DEFAUT)
    seuil_rouge = meta.get("seuil_rouge_min", SEUIL_ROUGE_DEFAUT)
    if proba_defaut < seuil_vert:
        return "ACCORD_FAVORABLE"
    if proba_defaut < seuil_rouge:
        return "A_EXAMINER"
    return "RISQUE_ELEVE"


def _score_credit(proba_defaut: float) -> int:
    """Score de solvabilité sur 100 : 100 = risque nul, 0 = défaut quasi certain.
    Simple complément de la probabilité de défaut (score = (1 - PD) x 100)."""
    return int(np.clip(round((1.0 - proba_defaut) * 100), 0, 100))


@app.get("/health")
def health():
    return {
        "status": "ok",
        "modele_charge": model is not None,
        "modele": meta.get("best_model_name"),
        "n_features": len(num_cols) + len(cat_cols),
    }


@app.post("/api/score", response_model=ScoringResponse)
def calculer_score(data: ClientData):
    if model is None or preprocessor is None:
        raise HTTPException(
            status_code=503,
            detail="Moteur de scoring indisponible (modèle non chargé) - aucune évaluation ne peut être produite.",
        )

    try:
        row = _preparer_row(data)

        # Tolérance au décalage de version modèle <-> code : si le modèle chargé
        # attend une colonne que le payload ne fournit plus (ou pas encore),
        # on l'impute (NaN -> médiane/mode du préprocesseur) au lieu de rejeter
        # tout le dossier. Le repli "estimation locale" ne doit jamais se
        # déclencher juste parce qu'une variable a été ajoutée/retirée.
        manquantes = [c for c in (num_cols + cat_cols) if c not in row]
        if manquantes:
            logger.warning(
                "Colonnes attendues par le modèle absentes du payload (imputées) : %s", manquantes)
            for c in manquantes:
                row[c] = np.nan

        X_input = pd.DataFrame([row])[num_cols + cat_cols]
        X_proc = preprocessor.transform(X_input)
        if hasattr(X_proc, "toarray"):
            X_proc = X_proc.toarray()

        proba_defaut = float(model.predict_proba(X_proc)[0, 1])
        zone = _zone_decision(proba_defaut)
        score_credit = _score_credit(proba_defaut)

        # --- Garde-fous métier : la capacité de remboursement prime sur le modèle.
        #     Un dossier que le client ne peut physiquement pas honorer ne doit
        #     jamais ressortir en accord automatique, quel que soit le score IA.
        rav = row.get("ratio_reste_a_vivre_absolu_fcfa")
        endettement = row.get("ratio_endettement")
        note_decision = None
        if rav is not None and rav < 0:
            zone = "RISQUE_ELEVE"
            note_decision = "Reste à vivre négatif après échéance : le client ne peut pas honorer la mensualité."
        elif endettement is not None and endettement > 1.0:
            zone = "RISQUE_ELEVE"
            note_decision = "Taux d'endettement supérieur à 100 % : charges + échéances dépassent le revenu."
        elif endettement is not None and endettement > 0.66 and zone == "ACCORD_FAVORABLE":
            zone = "A_EXAMINER"
            note_decision = "Taux d'endettement élevé (> 66 %) : décision laissée au comité de crédit."
        if note_decision:
            logger.info("Garde-fou métier appliqué (zone -> %s) : %s", zone, note_decision)

        lgd = LGD_PAR_GARANTIE.get(data.garantie, 0.55)
        perte_attendue = proba_defaut * lgd * data.montant_credit_demande_fcfa

        # --- Explicabilité SHAP ---
        explication: List[FacteurExplicatif] = []
        try:
            shap_values = explainer.shap_values(X_proc)
            if isinstance(shap_values, list):
                sv = np.array(shap_values[-1][0]).flatten()      # classe "défaut"
            else:
                arr = np.array(shap_values)
                sv = arr[0]
                if sv.ndim > 1:                                   # (n_features, n_classes)
                    sv = sv[:, -1]
                sv = sv.flatten()
            contrib = pd.Series(sv, index=feature_names).sort_values(key=np.abs, ascending=False).head(6)
            explication = [
                FacteurExplicatif(
                    variable=str(nom),
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
            ratio_endettement=row["ratio_endettement"],
            ratio_reste_a_vivre_absolu_fcfa=row["ratio_reste_a_vivre_absolu_fcfa"],
            future_echeance_credit_fcfa=row["future_echeance_credit_fcfa"],
            note_decision=note_decision,
            explication=explication,
        )

    except HTTPException:
        raise
    except Exception:
        logger.exception("Erreur lors du calcul du score de crédit")
        raise HTTPException(status_code=500, detail="Erreur interne du moteur de scoring.")

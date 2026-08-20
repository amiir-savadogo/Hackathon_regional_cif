# -*- coding: utf-8 -*-
"""
Samdé — Application de scoring microcrédit
Hackathon National d'Innovation CIF — Projet DigiCoop-WA+ (Thématique 02)

Application légère (fonctionne hors-ligne une fois lancée, sans appel API
externe) destinée à un agent de crédit d'une Coopérative financière.
"""

import json
import os

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
import streamlit as st

st.set_page_config(page_title="CréditSûr WA — Scoring Microcrédit", layout="wide")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


@st.cache_resource
def load_artifacts():
    preprocessor = joblib.load(os.path.join(MODELS_DIR, "preprocessor.pkl"))
    model = joblib.load(os.path.join(MODELS_DIR, "best_model.pkl"))
    feature_names = joblib.load(os.path.join(MODELS_DIR, "feature_names.pkl"))
    num_cols = joblib.load(os.path.join(MODELS_DIR, "num_cols.pkl"))
    cat_cols = joblib.load(os.path.join(MODELS_DIR, "cat_cols.pkl"))
    background = joblib.load(os.path.join(MODELS_DIR, "shap_background.pkl"))
    with open(os.path.join(MODELS_DIR, "metadata.json"), encoding="utf-8") as f:
        meta = json.load(f)
    return preprocessor, model, feature_names, num_cols, cat_cols, background, meta


try:
    preprocessor, model, feature_names, num_cols, cat_cols, background, meta = load_artifacts()
except FileNotFoundError:
    st.error(
        "Modèle introuvable. Veuillez d'abord exécuter "
        "`python scripts/01_generate_dataset.py` puis `python scripts/02_train_model.py`."
    )
    st.stop()

SEUIL_VERT = meta["seuil_vert_max"]
SEUIL_ROUGE = meta["seuil_rouge_min"]

# -----------------------------------------------------------------------
# Explainer SHAP (mis en cache pour rester léger même sur machine modeste)
# -----------------------------------------------------------------------
@st.cache_resource
def get_explainer(_model, _background, model_name):
    if "Logistique" in model_name:
        return shap.LinearExplainer(_model, _background)
    return shap.TreeExplainer(_model)


explainer = get_explainer(model, background, meta["best_model_name"])

# -----------------------------------------------------------------------
# En-tête
# -----------------------------------------------------------------------
col_logo, col_title = st.columns([1, 6])
with col_title:
    st.title("CréditSûr WA")
    st.caption(
        "Système de scoring automatisé du risque de microcrédit — "
        "conçu pour les Coopératives financières d'Afrique de l'Ouest · Hackathon CIF DigiCoop-WA+"
    )

with st.expander("ℹ️ À propos de ce prototype", expanded=False):
    st.markdown(
        f"""
- **Modèle retenu :** {meta['best_model_name'].replace('_', ' ')}
  (comparé à Random Forest et XGBoost — voir `notebooks/`)
- **Jeu de données :** simulation calibrée sur des ordres de grandeur réalistes
  de la microfinance en zone UEMOA (taux de défaut de base ≈ {meta['taux_defaut_global']:.1%}),
  à recalibrer avec des données réelles de la coopérative lors du pilote.
- **Fonctionnement hors-ligne :** aucune donnée client n'est envoyée sur internet ;
  le modèle tourne localement, adapté aux contraintes de connectivité limitée.
- **Décision à 3 zones** (pas de simple oui/non) : le dossier reste toujours
  sous la responsabilité finale de l'agent de crédit / comité de crédit.
        """
    )

st.divider()

# -----------------------------------------------------------------------
# Formulaire de saisie
# -----------------------------------------------------------------------
st.subheader("📋 Dossier du demandeur")

c1, c2, c3 = st.columns(3)

with c1:
    st.markdown("**Profil du demandeur**")
    age = st.number_input("Âge", 18, 75, 35)
    sexe = st.selectbox("Sexe", ["Femme", "Homme"])
    zone = st.selectbox("Zone", ["Urbaine", "Semi-urbaine", "Rurale"])
    situation_matrimoniale = st.selectbox(
        "Situation matrimoniale", ["Marié(e)", "Célibataire", "Veuf(ve)", "Divorcé(e)"]
    )
    niveau_education = st.selectbox("Niveau d'éducation", ["Aucun", "Primaire", "Secondaire", "Supérieur"])
    nombre_personnes_a_charge = st.number_input("Personnes à charge", 0, 15, 3)

with c2:
    st.markdown("**Activité économique**")
    secteur_activite = st.selectbox(
        "Secteur d'activité",
        ["Commerce informel", "Agriculture", "Elevage", "Artisanat",
         "Restauration/Transformation", "Transport", "Salarié secteur formel",
         "Fonctionnaire", "Autre service"],
    )
    anciennete_activite_annees = st.number_input("Ancienneté dans l'activité (années)", 0.0, 45.0, 4.0, step=0.5)
    revenu_mensuel_fcfa = st.number_input("Revenu mensuel estimé (FCFA)", 10000, 2000000, 100000, step=5000)
    charges_mensuelles_fcfa = st.number_input("Charges mensuelles (FCFA)", 0, 1500000, 60000, step=5000)
    possede_mobile_money = st.selectbox("Utilise le Mobile Money", ["Oui", "Non"]) == "Oui"
    frequence_transactions_mm_mois = st.number_input(
        "Transactions Mobile Money / mois", 0, 60, 8 if possede_mobile_money else 0
    )

with c3:
    st.markdown("**Relation avec la coopérative**")
    anciennete_cooperative_mois = st.number_input("Ancienneté à la coopérative (mois)", 0, 240, 24)
    membre_groupe_solidaire = st.selectbox("Membre d'un groupe solidaire", ["Oui", "Non"]) == "Oui"
    epargne_solde_moyen_fcfa = st.number_input("Solde d'épargne moyen (FCFA)", 0, 5000000, 30000, step=5000)
    regularite_epargne = st.selectbox("Régularité de l'épargne", ["Régulière", "Irrégulière", "Aucune épargne"])
    nombre_credits_anterieurs = st.number_input("Nombre de crédits antérieurs", 0, 15, 1)

    if nombre_credits_anterieurs > 0:
        taux_remboursement_historique_pct = st.slider("Taux de remboursement historique (%)", 0, 100, 85)
        jours_retard_moyen_historique = st.number_input("Jours de retard moyen (historique)", 0, 200, 5)
    else:
        taux_remboursement_historique_pct = np.nan
        jours_retard_moyen_historique = np.nan
        st.caption("Nouveau client — pas d'historique de remboursement (variables imputées).")

st.markdown("**Bureau d'Information sur le Crédit (BIC — centrale des risques UEMOA)**")
c8, c9, c10 = st.columns(3)
with c8:
    interroge_bic = st.selectbox("BIC consulté pour ce dossier", ["Oui", "Non"]) == "Oui"
with c9:
    if interroge_bic:
        statut_bic = st.selectbox(
            "Situation constatée auprès des autres institutions",
            ["Jamais emprunté ailleurs", "Bon payeur ailleurs (solde sans incident)",
             "Pret en cours ailleurs", "Incident de paiement signale ailleurs"],
        )
    else:
        statut_bic = "Non consulté"
        st.caption("BIC non consulté pour ce dossier.")
with c10:
    if interroge_bic and statut_bic == "Pret en cours ailleurs":
        nombre_prets_actifs_autres_institutions = st.number_input("Nombre de prêts actifs ailleurs", 1, 5, 1)
        encours_credit_autres_institutions_fcfa = st.number_input(
            "Encours total ailleurs (FCFA)", 0, 3000000, 100000, step=10000
        )
    else:
        nombre_prets_actifs_autres_institutions = 0
        encours_credit_autres_institutions_fcfa = 0

st.markdown("**Demande de crédit**")
c4, c5, c6, c7 = st.columns(4)
with c4:
    objet_credit = st.selectbox(
        "Objet du crédit",
        ["Fonds de commerce", "Intrants agricoles", "Equipement/Matériel", "Elevage",
         "Habitat/Réparation", "Santé", "Education", "Evénement social"],
    )
with c5:
    montant_credit_demande_fcfa = st.number_input("Montant demandé (FCFA)", 10000, 5000000, 250000, step=10000)
with c6:
    duree_credit_mois = st.selectbox("Durée (mois)", [3, 6, 9, 12, 18, 24, 36], index=3)
with c7:
    garantie = st.selectbox("Garantie proposée", ["Caution solidaire", "Bien matériel", "Aval d'un tiers", "Aucune"])

mensualite_estimee = montant_credit_demande_fcfa * 1.12 / duree_credit_mois
mensualite_externe_estimee = encours_credit_autres_institutions_fcfa * 0.09
ratio_endettement = round(
    (charges_mensuelles_fcfa + mensualite_estimee + mensualite_externe_estimee) / max(revenu_mensuel_fcfa, 1), 2
)
st.caption(
    f"Mensualité estimée : **{mensualite_estimee:,.0f} FCFA** "
    f"(+ {mensualite_externe_estimee:,.0f} FCFA d'engagements externes via le BIC) · "
    f"Ratio d'endettement calculé : **{ratio_endettement:.2f}**"
)

st.divider()
lancer = st.button("🔍 Évaluer le dossier", type="primary", use_container_width=True)

# -----------------------------------------------------------------------
# Prédiction + explicabilité
# -----------------------------------------------------------------------
if lancer:
    row = {
        "age": age, "sexe": sexe, "zone": zone,
        "situation_matrimoniale": situation_matrimoniale, "niveau_education": niveau_education,
        "nombre_personnes_a_charge": nombre_personnes_a_charge, "secteur_activite": secteur_activite,
        "anciennete_activite_annees": anciennete_activite_annees, "revenu_mensuel_fcfa": revenu_mensuel_fcfa,
        "charges_mensuelles_fcfa": charges_mensuelles_fcfa,
        "anciennete_cooperative_mois": anciennete_cooperative_mois,
        "membre_groupe_solidaire": int(membre_groupe_solidaire),
        "epargne_solde_moyen_fcfa": epargne_solde_moyen_fcfa, "regularite_epargne": regularite_epargne,
        "nombre_credits_anterieurs": nombre_credits_anterieurs,
        "taux_remboursement_historique_pct": taux_remboursement_historique_pct,
        "jours_retard_moyen_historique": jours_retard_moyen_historique,
        "possede_mobile_money": int(possede_mobile_money),
        "frequence_transactions_mm_mois": frequence_transactions_mm_mois,
        "interroge_bic": int(interroge_bic),
        "statut_bic": statut_bic,
        "nombre_prets_actifs_autres_institutions": nombre_prets_actifs_autres_institutions,
        "encours_credit_autres_institutions_fcfa": encours_credit_autres_institutions_fcfa,
        "objet_credit": objet_credit, "montant_credit_demande_fcfa": montant_credit_demande_fcfa,
        "duree_credit_mois": duree_credit_mois, "garantie": garantie,
        "ratio_endettement": ratio_endettement,
    }
    X_input = pd.DataFrame([row])[num_cols + cat_cols]
    X_proc = preprocessor.transform(X_input)
    if hasattr(X_proc, "toarray"):
        X_proc = X_proc.toarray()

    proba_defaut = float(model.predict_proba(X_proc)[0, 1])

    if proba_defaut < SEUIL_VERT:
        zone_decision, couleur, msg = "ACCORD FAVORABLE", "🟢", "Profil de risque faible."
    elif proba_defaut < SEUIL_ROUGE:
        zone_decision, couleur, msg = "À EXAMINER (comité de crédit)", "🟠", "Profil intermédiaire — analyse complémentaire recommandée."
    else:
        zone_decision, couleur, msg = "RISQUE ÉLEVÉ", "🔴", "Probabilité de défaut élevée au regard du seuil calibré."

    # --- Score de crédit à points (convention scorecard bancaire standard) ---
    # score = offset + facteur * ln((1-p)/p), calé pour qu'un doublement des odds
    # de bon payeur ajoute "pdo" points. Échelle 300 (risque max) - 900 (risque min).
    PDO, BASE, ODDS = 20, 600, 1.0
    facteur = PDO / np.log(2)
    offset = BASE - facteur * np.log(ODDS)
    p_safe = min(max(proba_defaut, 1e-6), 1 - 1e-6)
    score_credit = int(np.clip(offset + facteur * np.log((1 - p_safe) / p_safe), 300, 900))

    # --- Perte attendue : EL = PD x LGD x EAD ---
    # LGD (perte en cas de défaut) dépend de la garantie proposée : un bien matériel
    # ou un aval permettent une récupération partielle, une caution solidaire aussi
    # (mobilisation du groupe), l'absence de garantie ne laisse presque rien à récupérer.
    LGD_PAR_GARANTIE = {
        "Bien matériel": 0.35,
        "Aval d'un tiers": 0.45,
        "Caution solidaire": 0.40,
        "Aucune": 0.65,
    }
    lgd = LGD_PAR_GARANTIE.get(garantie, 0.55)
    ead = montant_credit_demande_fcfa  # exposition au moment de l'octroi
    perte_attendue_fcfa = proba_defaut * lgd * ead

    r1, r2 = st.columns([1, 2])
    with r1:
        st.metric("Probabilité de défaut estimée", f"{proba_defaut:.1%}")
        st.markdown(f"### {couleur} {zone_decision}")
        st.caption(msg)
    with r2:
        st.progress(min(proba_defaut, 1.0))
        st.caption(
            f"0% (sûr) ─── seuil vert {SEUIL_VERT:.0%} ─── seuil rouge {SEUIL_ROUGE:.0%} ─── 100% (risqué)"
        )

    r3, r4 = st.columns(2)
    with r3:
        st.metric("Score de crédit (300-900)", f"{score_credit}")
        st.caption("Échelle scorecard standard : plus le score est élevé, plus le profil est sûr.")
    with r4:
        st.metric("Perte attendue estimée (EL)", f"{perte_attendue_fcfa:,.0f} FCFA")
        st.caption(
            f"EL = Probabilité de défaut × Perte en cas de défaut ({lgd:.0%}, selon la garantie « {garantie} ») "
            f"× Montant exposé ({ead:,.0f} FCFA)."
        )

    st.divider()
    st.subheader("🔎 Pourquoi ce score ? (explicabilité SHAP)")
    st.caption(
        "Facteurs ayant le plus poussé la décision vers un risque plus élevé (rouge) "
        "ou plus faible (vert) pour CE dossier précis."
    )

    try:
        shap_values = explainer.shap_values(X_proc)
        sv = shap_values[0] if isinstance(shap_values, list) else shap_values[0]
        sv = np.array(sv).flatten()

        contrib = pd.Series(sv, index=feature_names).sort_values(key=np.abs, ascending=False).head(8)
        fig, ax = plt.subplots(figsize=(7, 4))
        colors = ["#d62728" if v > 0 else "#2ca02c" for v in contrib.values[::-1]]
        ax.barh(contrib.index[::-1], contrib.values[::-1], color=colors)
        ax.set_xlabel("Contribution au score de risque (rouge = augmente le risque, vert = le réduit)")
        ax.set_title("Principaux facteurs explicatifs du dossier")
        st.pyplot(fig)
    except Exception as e:
        st.info("Explication SHAP indisponible pour cette configuration (mode dégradé).")

    st.divider()
    st.caption(
        "⚠️ Ce score est une aide à la décision automatisée ; la décision finale d'octroi "
        "reste de la responsabilité du comité de crédit de la coopérative, conformément à ses procédures internes."
    )

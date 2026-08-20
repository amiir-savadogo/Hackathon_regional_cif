# -*- coding: utf-8 -*-
"""
01_generate_dataset.py
=======================
Génération d'un jeu de données SYNTHÉTIQUE de demandes de microcrédit,
calibré pour ressembler à la clientèle réelle d'une Coopérative financière
(institution de microfinance) d'Afrique de l'Ouest membre de la CIF.

Pourquoi un dataset synthétique ?
----------------------------------
Aucune donnée réelle de coopérative n'est accessible publiquement (secret
bancaire). Contrairement aux projets qui réutilisent le jeu "German Credit"
(Allemagne, 1994) ou "Home Credit Default Risk" (Kaggle, variables type
carte bancaire / bureau de crédit occidental), nous construisons ici un
générateur PARAMÉTRABLE dont les variables et les lois de distribution
s'appuient sur des ordres de grandeur documentés du secteur de la
microfinance en zone UEMOA (taille des prêts, taux d'impayés ~5-15%,
importance du cautionnement solidaire, poids du secteur informel, faible
bancarisation mais forte pénétration du Mobile Money).

Ce script sert de "simulateur de contexte" : il pourra être ré-étalonné
avec de vraies statistiques d'une Coopérative financière lors du
déploiement pilote, sans changer l'architecture du modèle en aval.
"""

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)
N = 4000  # nombre de dossiers simulés

# ---------------------------------------------------------------------
# 1. Variables socio-démographiques
# ---------------------------------------------------------------------
age = RNG.integers(19, 66, N)
sexe = RNG.choice(["Homme", "Femme"], N, p=[0.42, 0.58])  # forte présence féminine en microfinance
zone = RNG.choice(["Urbaine", "Rurale", "Semi-urbaine"], N, p=[0.38, 0.37, 0.25])
situation_matrimoniale = RNG.choice(
    ["Marié(e)", "Célibataire", "Veuf(ve)", "Divorcé(e)"], N, p=[0.62, 0.24, 0.09, 0.05]
)
niveau_education = RNG.choice(
    ["Aucun", "Primaire", "Secondaire", "Supérieur"], N, p=[0.30, 0.32, 0.28, 0.10]
)
nombre_personnes_a_charge = RNG.poisson(3.2, N).clip(0, 12)

# ---------------------------------------------------------------------
# 2. Activité économique
# ---------------------------------------------------------------------
secteur_activite = RNG.choice(
    ["Commerce informel", "Agriculture", "Elevage", "Artisanat",
     "Restauration/Transformation", "Transport", "Salarié secteur formel",
     "Fonctionnaire", "Autre service"],
    N, p=[0.30, 0.16, 0.08, 0.10, 0.12, 0.06, 0.08, 0.05, 0.05]
)
secteur_formel = np.isin(secteur_activite, ["Salarié secteur formel", "Fonctionnaire"])
anciennete_activite_annees = np.clip(RNG.gamma(3.0, 2.1, N), 0, 40).round(1)

revenu_mensuel = np.where(
    secteur_formel,
    RNG.normal(140000, 45000, N),
    RNG.lognormal(mean=11.3, sigma=0.55, size=N)  # revenus informels + volatils, asymétriques
).clip(20000, 900000).round(-3)

charges_mensuelles = (revenu_mensuel * RNG.uniform(0.35, 0.85, N)).round(-3)

# ---------------------------------------------------------------------
# 3. Relation avec la coopérative financière (historique interne)
# ---------------------------------------------------------------------
anciennete_cooperative_mois = RNG.integers(1, 181, N)
membre_groupe_solidaire = RNG.choice([1, 0], N, p=[0.47, 0.53])

epargne_solde_moyen = np.clip(
    revenu_mensuel * RNG.uniform(0.02, 0.9, N) * (anciennete_cooperative_mois / 60).clip(0.15, 3),
    1000, None
).round(-2)

regularite_epargne = RNG.choice(
    ["Régulière", "Irrégulière", "Aucune épargne"], N, p=[0.45, 0.35, 0.20]
)

nombre_credits_anterieurs = RNG.poisson(1.4, N).clip(0, 10)
# taux de remboursement historique corrélé (bruité) au nombre de crédits déjà bien remboursés
taux_remboursement_historique = np.where(
    nombre_credits_anterieurs == 0,
    np.nan,  # pas d'historique -> nouveau client
    np.clip(RNG.beta(6, 1.6, N) * 100, 0, 100)
).round(1)
jours_retard_moyen_historique = np.where(
    nombre_credits_anterieurs == 0,
    np.nan,
    np.clip(RNG.exponential(6, N), 0, 180)
).round(0)

# ---------------------------------------------------------------------
# 3bis. Bureau d'Information sur le Crédit (BIC) — dispositif régional UEMOA
#       (BCEAO comme interface, alimenté mensuellement par les banques,
#       autres établissements financiers et SFD/institutions de microfinance)
# ---------------------------------------------------------------------
# En pratique la consultation du BIC est de plus en plus systématique côté SFD,
# mais pas encore garantie à 100% (couverture progressive, zones rurales moins
# connectées) : on simule une consultation dans ~85% des dossiers.
interroge_bic = RNG.choice([1, 0], N, p=[0.85, 0.15])

statut_bic = np.where(
    interroge_bic == 0, "Non consulté",
    RNG.choice(
        ["Jamais emprunté ailleurs", "Bon payeur ailleurs (solde sans incident)",
         "Pret en cours ailleurs", "Incident de paiement signale ailleurs"],
        N, p=[0.42, 0.30, 0.20, 0.08]
    )
)

nombre_prets_actifs_autres_institutions = np.where(
    statut_bic == "Pret en cours ailleurs", RNG.choice([1, 2, 3], N, p=[0.65, 0.25, 0.10]), 0
)
encours_credit_autres_institutions_fcfa = np.where(
    statut_bic == "Pret en cours ailleurs",
    np.clip(RNG.lognormal(mean=12.0, sigma=0.6, size=N), 20000, 2000000),
    0
).round(-3)
# mensualité approximative des engagements externes déjà en cours (proxy simplifié)
mensualite_externe_estimee = (encours_credit_autres_institutions_fcfa * 0.09).round(-2)

# ---------------------------------------------------------------------
# 4. Mobile Money (proxy de flux de trésorerie, très pertinent en zone UEMOA)
# ---------------------------------------------------------------------
possede_mobile_money = RNG.choice([1, 0], N, p=[0.78, 0.22])
frequence_transactions_mm_mois = np.where(
    possede_mobile_money == 1,
    RNG.poisson(9, N).clip(0, 60),
    0
)

# ---------------------------------------------------------------------
# 5. Caractéristiques de la demande de crédit
# ---------------------------------------------------------------------
objet_credit = RNG.choice(
    ["Fonds de commerce", "Intrants agricoles", "Equipement/Matériel",
     "Elevage", "Habitat/Réparation", "Santé", "Education", "Evénement social"],
    N, p=[0.28, 0.16, 0.14, 0.08, 0.12, 0.08, 0.08, 0.06]
)
montant_credit_demande = np.clip(
    revenu_mensuel * RNG.uniform(0.8, 5.5, N), 30000, 3000000
).round(-3)
duree_credit_mois = RNG.choice([3, 6, 9, 12, 18, 24, 36], N,
                                p=[0.12, 0.22, 0.15, 0.25, 0.13, 0.09, 0.04])
garantie = RNG.choice(
    ["Caution solidaire", "Bien matériel", "Aval d'un tiers", "Aucune"],
    N, p=[0.38, 0.24, 0.16, 0.22]
)

mensualite_estimee = (montant_credit_demande * 1.12 / duree_credit_mois).round(-2)
ratio_endettement = (
    (charges_mensuelles + mensualite_estimee + mensualite_externe_estimee) / revenu_mensuel
).round(2)

# ---------------------------------------------------------------------
# 6. Génération de la cible : DEFAUT (1 = impayé sévère / défaut, 0 = bon payeur)
#    Score latent construit à partir de règles métier réalistes + bruit
# ---------------------------------------------------------------------
z = (
    -3.60
    + 1.55 * (ratio_endettement > 0.55)
    + 1.10 * (ratio_endettement > 0.80)
    + 0.9 * (regularite_epargne == "Aucune épargne")
    - 0.55 * (regularite_epargne == "Régulière")
    - 0.55 * membre_groupe_solidaire
    - 0.45 * (garantie != "Aucune")
    + 0.5 * (garantie == "Aucune")
    - 0.012 * anciennete_cooperative_mois.clip(0, 60)
    + 0.55 * (nombre_credits_anterieurs == 0)
    + np.where(nombre_credits_anterieurs > 0,
               -0.028 * np.nan_to_num(taux_remboursement_historique - 70), 0)
    + np.where(nombre_credits_anterieurs > 0,
               0.02 * np.nan_to_num(jours_retard_moyen_historique), 0)
    - 0.12 * possede_mobile_money
    - 0.01 * np.clip(frequence_transactions_mm_mois, 0, 30)
    + 0.35 * (secteur_activite == "Commerce informel")
    - 0.5 * secteur_formel
    + 0.25 * (nombre_personnes_a_charge > 5)
    # --- Signal du Bureau d'Information sur le Crédit (BIC / centrale des risques UEMOA) ---
    + 1.05 * (statut_bic == "Incident de paiement signale ailleurs")
    - 0.40 * (statut_bic == "Bon payeur ailleurs (solde sans incident)")
    + 0.30 * (nombre_prets_actifs_autres_institutions >= 2)
    + 0.15 * (statut_bic == "Pret en cours ailleurs")
    + RNG.normal(0, 0.65, N)  # bruit idiosyncratique
)
proba_defaut = 1 / (1 + np.exp(-z))
defaut_credit = RNG.binomial(1, proba_defaut)

# ---------------------------------------------------------------------
# 7. Assemblage du DataFrame final
# ---------------------------------------------------------------------
df = pd.DataFrame({
    "id_client": [f"SMD-{i:05d}" for i in range(1, N + 1)],
    "age": age,
    "sexe": sexe,
    "zone": zone,
    "situation_matrimoniale": situation_matrimoniale,
    "niveau_education": niveau_education,
    "nombre_personnes_a_charge": nombre_personnes_a_charge,
    "secteur_activite": secteur_activite,
    "anciennete_activite_annees": anciennete_activite_annees,
    "revenu_mensuel_fcfa": revenu_mensuel.astype(int),
    "charges_mensuelles_fcfa": charges_mensuelles.astype(int),
    "anciennete_cooperative_mois": anciennete_cooperative_mois,
    "membre_groupe_solidaire": membre_groupe_solidaire,
    "epargne_solde_moyen_fcfa": epargne_solde_moyen.astype(int),
    "regularite_epargne": regularite_epargne,
    "nombre_credits_anterieurs": nombre_credits_anterieurs,
    "taux_remboursement_historique_pct": taux_remboursement_historique,
    "jours_retard_moyen_historique": jours_retard_moyen_historique,
    "possede_mobile_money": possede_mobile_money,
    "frequence_transactions_mm_mois": frequence_transactions_mm_mois,
    "interroge_bic": interroge_bic,
    "statut_bic": statut_bic,
    "nombre_prets_actifs_autres_institutions": nombre_prets_actifs_autres_institutions,
    "encours_credit_autres_institutions_fcfa": encours_credit_autres_institutions_fcfa.astype(int),
    "objet_credit": objet_credit,
    "montant_credit_demande_fcfa": montant_credit_demande.astype(int),
    "duree_credit_mois": duree_credit_mois,
    "garantie": garantie,
    "ratio_endettement": ratio_endettement,
    "defaut_credit": defaut_credit,
})

out_path = "data/samde_dataset.csv"
df.to_csv(out_path, index=False, encoding="utf-8-sig")

print(f"Dataset généré : {df.shape[0]} lignes x {df.shape[1]} colonnes -> {out_path}")
print("Taux de défaut global : {:.2%}".format(df['defaut_credit'].mean()))
print(df.head(3).to_string())

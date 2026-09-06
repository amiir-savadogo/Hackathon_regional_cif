# -*- coding: utf-8 -*-
"""
01_generate_dataset.py
======================
Génération SYNTHÉTIQUE, à partir d'UNE simulation commune, de :

  1. data/dataset_entrainement.csv   -- BASE B : id_client + variables du modèle
                                        + cible `defaut_credit`. C'est le SEUL
                                        fichier lu par scripts/02_train_model.py.
  2. data/societaires.json           -- BASE A : les sociétaires "connus de la
     (+ copies frontend & backend)      banque" (identité, compte, activité,
                                        revenus, ancienneté). Affichés dans l'app
                                        quand un agent sélectionne un client.
  3. data/societaires_complet.json   -- BASE A enrichie des agrégats comportementaux
                                        (historique interne, transactions, Mobile
                                        Money, comptes bancaires) : source de
                                        pré-remplissage du wizard d'instruction.
  4. data/base_complete.csv          -- Table complète (features + identité + cible
                                        + facteurs latents) : AUDIT uniquement,
                                        jamais utilisée à l'entraînement.

Base A et Base B décrivent LES MÊMES personnes simulées : un sociétaire de A,
complété par la saisie du wizard, produit une ligne cohérente avec ce que le
modèle a appris sur B (même vocabulaire, mêmes lois).

Corrections par rapport à la première version :
  - séparation explicite COLONNES_MODELE / COLONNES_IDENTITE / COLONNES_SORTIE
    (plus de fuite de cible, plus d'explosion one-hot sur les identifiants) ;
  - 2 facteurs latents (discipline financière, patrimoine) qui font co-varier
    épargne / Mobile Money / historique / incidents de façon réaliste ;
  - suppression du triple comptage capacité de remboursement
    (ratio_endettement + seuils RAV empilés) ;
  - vocabulaire canonique unique (scripts/vocabulaire_cif.py), accents alignés
    sur les menus du frontend ;
  - nombre de crédits antérieurs conditionné à l'ancienneté ; plafonds Mobile
    Money par âge ; garde-fous.
"""

import json
import os
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

from vocabulaire_cif import (
    SEXES, ZONES, SITUATIONS_MATRIMONIALES, NIVEAUX_EDUCATION,
    SECTEURS_ACTIVITE, SECTEURS_ACTIVITE_PROBAS, SECTEURS_FORMELS,
    SOUS_SECTEURS_FORMELS, SOUS_SECTEURS_FORMELS_PROBAS, SOUS_SECTEUR_NON_APPLICABLE,
    ACTIVITE_PAR_SECTEUR,
    SECT_COMMERCE_INFORMEL, SECT_AGRICULTURE, SECT_ELEVAGE, SECT_ARTISANAT,
    SECT_RESTAURATION, SECT_TRANSPORT, SECT_SALARIE_FORMEL, SECT_FONCTIONNAIRE,
    SECT_AUTRE_SERVICE,
    STATUTS_COMPTE, STATUTS_COMPTE_PROBAS, TYPES_COMPTE, TYPES_COMPTE_PROBAS,
    TYPES_LOGEMENT, TYPES_LOGEMENT_PROBAS,
    REGULARITES_EPARGNE, GARANTIES, GARANTIES_PROBAS,
    BIC_NON_CONSULTE, BIC_JAMAIS, BIC_BON_PAYEUR, BIC_PRET_EN_COURS, BIC_INCIDENT,
    STATUTS_BIC_SI_CONSULTE, STATUTS_BIC_SI_CONSULTE_PROBAS,
    TYPE_COMPTE_BANCAIRE_AUCUN, TYPES_COMPTE_BANCAIRE, TYPES_COMPTE_BANCAIRE_PROBAS,
)
from catalogue_types_credit import (
    CATALOGUE, CATEGORIES, categories_par_secteur, DUREES_STANDARD,
    CAT_AGRICOLE, CAT_ELEVAGE, CAT_CONSOMMATION, CAT_SOCIAL, CAT_SALARIE, CAT_GROUPE,
)

RNG = np.random.default_rng(42)
N = 4000                       # dossiers simulés (BASE B)
N_CLIENTS_BANQUE = 1000        # sous-ensemble exposé dans l'app (BASE A)
DATE_JOUR = datetime(2026, 9, 1)

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PRENOMS_FEMMES = ["Aminata", "Fatimata", "Mariam", "Aicha", "Salimata", "Rasmata",
                  "Kadidiatou", "Safiatou", "Alimata", "Fanta", "Bintou", "Awa"]
PRENOMS_HOMMES = ["Amadou", "Ibrahim", "Abdoul", "Ousmane", "Boureima", "Souleymane",
                  "Moussa", "Yacouba", "Issouf", "Harouna", "Seydou", "Mamadou"]
NOMS_FAMILLE = ["Ouedraogo", "Sawadogo", "Zongo", "Kabore", "Compaore", "Traore",
                "Diallo", "Cisse", "Sankara", "Bamba", "Sanogo", "Kone"]
LOCALITES = [
    ("Burkina Faso", "Centre", "Ouagadougou", "Gounghin", "Ouaga 1 - Siège Principal"),
    ("Burkina Faso", "Centre", "Ouagadougou", "Karpala", "Ouaga 2 - Gounghin / Tampouy"),
    ("Burkina Faso", "Hauts-Bassins", "Bobo-Dioulasso", "Accart-Ville", "Bobo-Dioulasso - Marché Central"),
    ("Burkina Faso", "Centre-Ouest", "Koudougou", "Secteur 1 (Centre)", "Koudougou - Agence Centre"),
    ("Burkina Faso", "Nord", "Ouahigouya", "Secteur 2", "Ouahigouya - Grand Marché"),
]
PREFIXES_TEL = ["+226 70", "+226 76", "+226 07", "+226 64", "+226 55", "+226 78"]

# --- Offsets de risque (log-odds), utilisés uniquement pour la cible ---------
OFFSET_SECTEUR = {
    SECT_FONCTIONNAIRE: -0.85,
    SECT_SALARIE_FORMEL: 0.00,          # affiné par le sous-secteur ci-dessous
    SECT_AUTRE_SERVICE: -0.10,
    SECT_COMMERCE_INFORMEL: 0.35,
    SECT_AGRICULTURE: 0.20,
    SECT_ELEVAGE: 0.15,
    SECT_ARTISANAT: 0.10,
    SECT_RESTAURATION: 0.15,
    SECT_TRANSPORT: 0.20,
}
OFFSET_SOUS_SECTEUR_FORMEL = {
    "Banque/Finance": -0.75, "Télécom/Services": -0.65, "Mines": -0.60,
    "BTP": -0.30, "Autre secteur formel": -0.45, SOUS_SECTEUR_NON_APPLICABLE: 0.0,
}
OFFSET_CATEGORIE_CREDIT = {
    CAT_SOCIAL: 0.30, CAT_CONSOMMATION: 0.15, CAT_SALARIE: -0.20,
    CAT_GROUPE: -0.15, CAT_AGRICOLE: 0.05, CAT_ELEVAGE: 0.05,
}

# ===========================================================================
# 0. Facteurs latents (NON observables -> jamais dans le modèle ; ils rendent
#    les variables financières corrélées entre elles, comme dans la réalité).
# ===========================================================================
discipline = RNG.normal(0, 1, N)   # rigueur financière (épargne, ponctualité, incidents)
richesse = RNG.normal(0, 1, N)     # patrimoine au-delà du revenu courant

# ===========================================================================
# 1. Socio-démographie
# ===========================================================================
age = RNG.integers(19, 66, N)
sexe = RNG.choice(SEXES, N, p=[0.58, 0.42])          # forte présence féminine en microfinance
zone = RNG.choice(ZONES, N, p=[0.38, 0.25, 0.37])
situation_matrimoniale = RNG.choice(SITUATIONS_MATRIMONIALES, N, p=[0.62, 0.24, 0.09, 0.05])
niveau_education = RNG.choice(NIVEAUX_EDUCATION, N, p=[0.30, 0.32, 0.28, 0.10])
nombre_personnes_a_charge = RNG.poisson(3.2, N).clip(0, 12)

# ===========================================================================
# 2. Identité / KYC (BASE A uniquement)
# ===========================================================================
numero_compte = np.array([f"CPT-{i:04d}" for i in range(1, N + 1)])
nom = RNG.choice(NOMS_FAMILLE, N)
prenom = np.array([RNG.choice(PRENOMS_FEMMES if sexe[i] == "Femme" else PRENOMS_HOMMES)
                   for i in range(N)])
date_naissance = np.array([
    f"{DATE_JOUR.year - int(age[i]):04d}-{int(RNG.integers(1, 13)):02d}-{int(RNG.integers(1, 28)):02d}"
    for i in range(N)
])
numero_cnib = np.array([f"B{int(RNG.integers(10_000_000, 100_000_000))}" for _ in range(N)])
date_expiration_cnib = np.array([
    (DATE_JOUR + timedelta(days=int(RNG.integers(180, 3650)))).strftime("%Y-%m-%d")
    for _ in range(N)
])
contact_telephonique = np.array([
    f"{PREFIXES_TEL[int(RNG.integers(0, len(PREFIXES_TEL)))]} "
    f"{int(RNG.integers(10, 100)):02d} {int(RNG.integers(10, 100)):02d} {int(RNG.integers(10, 100)):02d}"
    for _ in range(N)
])
_domaines = ["gmail.com", "yahoo.fr", "cif-client.bf", "hotmail.com"]
email = np.array([
    f"{prenom[i].lower()}.{nom[i].lower()}{int(RNG.integers(1, 99))}@{_domaines[int(RNG.integers(0, len(_domaines)))]}"
    for i in range(N)
])
_idx_loc = RNG.integers(0, len(LOCALITES), N)
pays = np.array([LOCALITES[k][0] for k in _idx_loc])
region = np.array([LOCALITES[k][1] for k in _idx_loc])
ville = np.array([LOCALITES[k][2] for k in _idx_loc])
quartier = np.array([LOCALITES[k][3] for k in _idx_loc])
agence_cif = np.array([LOCALITES[k][4] for k in _idx_loc])
adresse_complete = np.array([
    f"{quartier[i]}, Secteur {int(RNG.integers(1, 30))}, Rue {int(RNG.integers(10, 99))}"
    for i in range(N)
])
type_logement = RNG.choice(TYPES_LOGEMENT, N, p=TYPES_LOGEMENT_PROBAS)
type_compte = RNG.choice(TYPES_COMPTE, N, p=TYPES_COMPTE_PROBAS)
statut_compte = RNG.choice(STATUTS_COMPTE, N, p=STATUTS_COMPTE_PROBAS)
parts_sociales_fcfa = RNG.choice([10000, 20000, 25000, 50000], N, p=[0.45, 0.35, 0.12, 0.08])

# ===========================================================================
# 3. Activité économique
# ===========================================================================
secteur_activite = RNG.choice(SECTEURS_ACTIVITE, N, p=SECTEURS_ACTIVITE_PROBAS)
secteur_formel = np.isin(secteur_activite, SECTEURS_FORMELS)
activite = np.array([ACTIVITE_PAR_SECTEUR[s] for s in secteur_activite])

sous_secteur_activite = np.where(
    secteur_activite == SECT_SALARIE_FORMEL,
    RNG.choice(SOUS_SECTEURS_FORMELS, N, p=SOUS_SECTEURS_FORMELS_PROBAS),
    SOUS_SECTEUR_NON_APPLICABLE,
)

anciennete_activite_annees = np.minimum(
    np.clip(RNG.gamma(3.0, 2.1, N), 0, 40),
    np.clip(age - 16, 1, None),
).round(1)

proba_saisonnalite = np.select(
    [
        np.isin(secteur_activite, [SECT_AGRICULTURE, SECT_ELEVAGE]),
        (secteur_activite == SECT_SALARIE_FORMEL) & (sous_secteur_activite == "BTP"),
        secteur_activite == SECT_RESTAURATION,
    ],
    [0.80, 0.35, 0.20],
    default=0.05,
)
saisonnalite_activite = RNG.binomial(1, proba_saisonnalite)

# Vulnérabilité géographique : portée par la zone + surcroît agricole + bruit
# intra-zone -> porte une info propre, pas un simple doublon de `zone`.
base_vuln = np.select([zone == "Urbaine", zone == "Semi-urbaine", zone == "Rurale"],
                      [0.20, 0.38, 0.55])
indice_vulnerabilite_zone = np.clip(
    base_vuln
    + 0.10 * np.isin(secteur_activite, [SECT_AGRICULTURE, SECT_ELEVAGE])
    + RNG.normal(0, 0.13, N),
    0, 1,
).round(3)

# Revenu : décalé par le patrimoine latent ; informel = lognormal (asymétrique).
mult_richesse = np.clip(1.0 + 0.15 * richesse, 0.55, 1.8)
revenu_mensuel = np.where(
    secteur_formel,
    RNG.normal(150000, 45000, N),
    RNG.lognormal(11.3, 0.55, N),
) * mult_richesse
revenu_mensuel = np.clip(revenu_mensuel, 20000, 1_200_000).round(-3)
charges_mensuelles = (revenu_mensuel * RNG.uniform(0.35, 0.85, N)).round(-3)

# ===========================================================================
# 4. Relation avec la coopérative (historique interne)
# ===========================================================================
anciennete_cooperative_mois = RNG.integers(1, 181, N)
membre_groupe_solidaire = RNG.choice([1, 0], N, p=[0.47, 0.53])
date_creation = np.array([
    (DATE_JOUR - timedelta(days=int(anciennete_cooperative_mois[i]) * 30)).strftime("%Y-%m-%d")
    for i in range(N)
])

facteur_anc = np.clip(anciennete_cooperative_mois / 60.0, 0.15, 3.0)
taux_epargne = np.clip(0.22 + 0.16 * discipline + 0.08 * richesse, 0.01, 1.4)
epargne_solde_moyen = np.clip(revenu_mensuel * taux_epargne * facteur_anc, 1000, None).round(-2)

seuil_ep = discipline + RNG.normal(0, 0.5, N)
regularite_epargne = np.select(
    [seuil_ep > 0.13, seuil_ep > -0.85],
    ["Régulière", "Irrégulière"],
    default="Aucune épargne",
)

# Nombre de crédits antérieurs CONDITIONNÉ à l'ancienneté (plus de "6 mois
# d'ancienneté, 5 crédits déjà remboursés").
lam_credits = np.clip(0.15 + 0.02 * anciennete_cooperative_mois, 0.15, 4.0)
nombre_credits_anterieurs = RNG.poisson(lam_credits).clip(0, 10)
a_historique = nombre_credits_anterieurs > 0

taux_remboursement_historique = np.where(
    a_historique,
    np.clip(89.0 + 6.5 * discipline + RNG.normal(0, 4.0, N), 35, 100),
    np.nan,
).round(1)
jours_retard_moyen_historique = np.where(
    a_historique,
    np.clip(RNG.exponential(np.exp(1.5 - 0.55 * discipline)), 0, 180),
    np.nan,
).round(0)
montant_total_emprunte_passe = np.where(
    a_historique,
    (nombre_credits_anterieurs * revenu_mensuel * RNG.uniform(1.2, 3.5, N)).round(-4),
    0.0,
)
# Délai d'utilisation du crédit après déblocage : proxy de détournement d'objet
# (observable seulement pour un client ayant déjà un crédit précédent).
delai_utilisation_credit_apres_deblocage_jours = np.where(
    a_historique,
    np.clip(RNG.exponential(6.0, N) - 3.0 * discipline, 0, 90),
    np.nan,
).round(0)

# ===========================================================================
# 5. Bureau d'Information sur le Crédit (BIC / centrale des risques UEMOA)
# ===========================================================================
interroge_bic = RNG.choice([1, 0], N, p=[0.85, 0.15])
statut_bic = np.where(
    interroge_bic == 1,
    RNG.choice(STATUTS_BIC_SI_CONSULTE, N, p=STATUTS_BIC_SI_CONSULTE_PROBAS),
    BIC_NON_CONSULTE,
)
nombre_prets_actifs_autres_institutions = np.where(
    statut_bic == BIC_PRET_EN_COURS, RNG.choice([1, 2, 3], N, p=[0.65, 0.25, 0.10]), 0
)
encours_credit_autres_institutions_fcfa = np.where(
    statut_bic == BIC_PRET_EN_COURS,
    np.clip(RNG.lognormal(12.0, 0.6, N), 20000, 2_000_000),
    0.0,
).round(-3)
mensualite_externe_estimee = (encours_credit_autres_institutions_fcfa * 0.09).round(-2)

lam_soldes = np.where(statut_bic == BIC_JAMAIS, 0.05, 1.1)
bic_nombre_credits_soldes_ailleurs = np.where(
    interroge_bic == 1, RNG.poisson(lam_soldes).astype(float), np.nan
)
# 999 = "aucun incident recensé" (plutôt que NaN : évite qu'une imputation par
# la médiane transforme un dossier propre en "incident récent").
bic_anciennete_dernier_incident_mois = np.where(
    statut_bic == BIC_INCIDENT, RNG.integers(1, 36, N).astype(float), 999.0
)

# ===========================================================================
# 6. Mobile Money (données alternatives : proxy de revenu et de discipline
#    pour la clientèle peu bancarisée)
# ===========================================================================
possede_mobile_money = RNG.choice([1, 0], N, p=[0.80, 0.20])
mm = possede_mobile_money == 1

plafond_mm = np.clip((age - 15) * 12, 6, 156)   # Mobile Money ~ depuis 2013 au BF
mm_anciennete_compte_mois = np.where(mm, np.minimum(RNG.integers(1, 97, N), plafond_mm).astype(float), np.nan)
mm_anciennete_sim_mois = np.where(
    mm, np.clip(np.nan_to_num(mm_anciennete_compte_mois) + RNG.integers(0, 25, N), 1, 180), np.nan
)
frequence_transactions_mm_mois = np.where(mm, RNG.poisson(9, N).clip(0, 60), 0)
mm_nombre_mois_actifs_12m = np.where(
    mm, np.clip(np.round(6 + 4 * discipline + RNG.normal(0, 1.5, N)), 1, 12), np.nan
)

mult_flux = np.clip(0.8 + 0.20 * richesse + 0.10 * discipline, 0.2, 2.2)
mm_flux_entrants_mensuel_fcfa = np.where(mm, np.clip(revenu_mensuel * mult_flux, 5000, None).round(-2), 0.0)
mm_flux_sortants_mensuel_fcfa = np.where(mm, (mm_flux_entrants_mensuel_fcfa * RNG.uniform(0.6, 1.05, N)).round(-2), 0.0)
mm_volume_transactions_mensuel_fcfa = np.where(
    mm, np.clip(mm_flux_entrants_mensuel_fcfa * RNG.uniform(0.8, 2.2, N), 5000, None).round(-2), 0.0
)

mm_utilise_credit_mm = mm & (RNG.random(N) < 0.55)
mm_montant_remboursements_mm_fcfa = np.where(
    mm_utilise_credit_mm, np.clip(RNG.lognormal(9.0, 0.6, N), 1000, 100000).round(-2), 0.0
)
lam_inc_mm = np.clip(0.4 - 0.25 * discipline, 0.02, 2.0)
mm_nombre_incidents_credit_mm = np.where(mm_utilise_credit_mm, RNG.poisson(lam_inc_mm), 0)

taux_solde_mm = np.clip(0.15 + 0.12 * discipline + 0.10 * richesse, 0.02, 0.9)
mm_solde_moyen_fcfa = np.where(mm, np.clip(mm_flux_entrants_mensuel_fcfa * taux_solde_mm, 500, None).round(-2), 0.0)
mm_solde_minimum_fcfa = np.where(mm, (mm_solde_moyen_fcfa * RNG.uniform(0.05, 0.6, N)).round(-2), 0.0)
mm_evolution_solde_pct = np.where(mm, (2.0 + 6.0 * discipline + RNG.normal(0, 12.0, N)).round(1), np.nan)
mm_volatilite_flux_pct = np.where(
    mm, np.clip(35.0 - 8.0 * discipline + RNG.gamma(2.0, 6.0, N), 2, 120).round(1), np.nan
)
mm_ratio_depenses_credit_appel_data_pct = np.where(
    mm, np.clip(RNG.gamma(2.0, 2.2, N), 0.5, 25).round(1), np.nan
)

# Agrégats transactions (vue consolidée CIF).
total_transactions = RNG.poisson(15, N).clip(1, 80)
volume_depots_fcfa = (revenu_mensuel * RNG.uniform(1.0, 8.0, N) * np.clip(1 + 0.2 * richesse, 0.4, 2.0)).round(-3)
volume_retraits_fcfa = (volume_depots_fcfa * RNG.uniform(0.45, 0.95, N)).round(-3)
tx_mobile_money = np.where(
    mm, RNG.binomial(total_transactions, 0.5) + (frequence_transactions_mm_mois // 3), 0
)

# ===========================================================================
# 7. Compte(s) bancaire(s) classique(s)
# ===========================================================================
possede_compte_bancaire = RNG.binomial(1, np.where(secteur_formel, 0.75, 0.22))
cb = possede_compte_bancaire == 1
nombre_comptes_bancaires = np.where(cb, RNG.choice([1, 2], N, p=[0.82, 0.18]), 0)
type_compte_principal = np.where(
    cb, RNG.choice(TYPES_COMPTE_BANCAIRE, N, p=TYPES_COMPTE_BANCAIRE_PROBAS), TYPE_COMPTE_BANCAIRE_AUCUN
)
mult_solde_cb = np.clip(0.5 + 0.5 * richesse + 0.2 * discipline, 0.05, 4.0)
solde_compte_bancaire_fcfa = np.where(cb, np.clip(revenu_mensuel * mult_solde_cb, 2000, None).round(-2), 0.0)
flux_depots_bancaires_mensuel_fcfa = np.where(cb, np.clip(revenu_mensuel * RNG.uniform(0.3, 1.1, N), 0, None).round(-2), 0.0)
flux_retraits_bancaires_mensuel_fcfa = np.where(cb, (flux_depots_bancaires_mensuel_fcfa * RNG.uniform(0.5, 1.0, N)).round(-2), 0.0)
lam_rejets = np.clip(0.25 - 0.15 * discipline, 0.02, 1.6)
nombre_rejets_prelevements_cheques_12m = np.where(cb, RNG.poisson(lam_rejets), 0)

# ===========================================================================
# 8. Demande de crédit (catalogue biaisé par le secteur)
# ===========================================================================
categorie_credit = np.empty(N, dtype=object)
objet_credit = np.empty(N, dtype=object)
taux_interet_nominal_annuel_pct = np.empty(N)
_dmin = np.empty(N, dtype=int)
_dmax = np.empty(N, dtype=int)
_DUREES = np.array(DUREES_STANDARD)

for i in range(N):
    favorites = categories_par_secteur(secteur_activite[i])
    cat = str(RNG.choice(favorites)) if RNG.random() < 0.75 else str(RNG.choice(CATEGORIES))
    types_possibles = [t for t in CATALOGUE if t["categorie"] == cat]
    tc = types_possibles[int(RNG.integers(0, len(types_possibles)))]
    categorie_credit[i] = tc["categorie"]
    objet_credit[i] = tc["type"]
    taux_interet_nominal_annuel_pct[i] = round(RNG.uniform(tc["taux_min_pct"], tc["taux_max_pct"]), 2)
    _dmin[i], _dmax[i] = tc["duree_min_mois"], tc["duree_max_mois"]


def _tirer_duree(dmin, dmax):
    choix = _DUREES[(_DUREES >= dmin) & (_DUREES <= dmax)]
    if choix.size == 0:
        return int(np.clip((dmin + dmax) // 2, 3, 48))
    return int(RNG.choice(choix))


duree_credit_mois = np.array([_tirer_duree(_dmin[i], _dmax[i]) for i in range(N)], dtype=int)
montant_credit_demande_fcfa = np.clip(revenu_mensuel * RNG.uniform(0.8, 5.5, N), 30000, 3_000_000).round(-3)
garantie = RNG.choice(GARANTIES, N, p=GARANTIES_PROBAS)
frais_dossier_fcfa = np.clip(montant_credit_demande_fcfa * RNG.uniform(0.01, 0.03, N), 500, 25000).round(-2)

# ===========================================================================
# 9. Ratios de capacité de remboursement (échéance = vraie formule d'annuité)
# ===========================================================================
taux_mensuel = (taux_interet_nominal_annuel_pct / 100.0) / 12.0
future_echeance_credit_fcfa = np.where(
    taux_mensuel <= 0,
    montant_credit_demande_fcfa / duree_credit_mois,
    montant_credit_demande_fcfa * taux_mensuel / (1.0 - (1.0 + taux_mensuel) ** (-duree_credit_mois)),
).round(-2)
ratio_endettement = (
    (charges_mensuelles + future_echeance_credit_fcfa + mensualite_externe_estimee) / revenu_mensuel
).round(2)
ratio_reste_a_vivre_absolu_fcfa = (revenu_mensuel - charges_mensuelles - future_echeance_credit_fcfa).round(-2)
ratio_couverture_echeance_epargne = np.where(
    future_echeance_credit_fcfa > 0,
    (epargne_solde_moyen / future_echeance_credit_fcfa).round(2),
    np.nan,
)

# ===========================================================================
# 10. Cible : DEFAUT (1 = impayé sévère). Score latent = règles métier + bruit.
#     UNE seule représentation de la capacité de remboursement (ratio
#     d'endettement) ; le RAV n'ajoute qu'un correctif marginal. Les facteurs
#     latents discipline/richesse entrent directement ET via les variables
#     observables qu'ils pilotent.
# ===========================================================================
offset_secteur = np.array([OFFSET_SECTEUR[s] for s in secteur_activite])
offset_sous_secteur = np.array([OFFSET_SOUS_SECTEUR_FORMEL.get(s, 0.0) for s in sous_secteur_activite])
offset_anciennete_poste = np.where(
    secteur_formel,
    -0.03 * np.clip(anciennete_activite_annees, 0, 15),
    -0.01 * np.clip(anciennete_activite_annees, 0, 15),
)
offset_categorie_credit = np.array([OFFSET_CATEGORIE_CREDIT.get(c, 0.0) for c in categorie_credit])

z = (
    # Intercept calibré pour un taux de défaut cible ~10-13 % (microfinance UEMOA).
    # Sensibilité : environ -0.10 d'intercept => -1.5 à -2 points de défaut dans
    # cette zone. Ajuster ici si le taux affiché sort de [8 % ; 15 %].
    -4.68
    # --- capacité de remboursement ---
    + 1.60 * (ratio_endettement > 0.55)
    + 1.15 * (ratio_endettement > 0.80)
    + 0.25 * (ratio_reste_a_vivre_absolu_fcfa < 10000)
    + 0.20 * (ratio_reste_a_vivre_absolu_fcfa < 0)
    - 0.20 * (np.nan_to_num(ratio_couverture_echeance_epargne) >= 1.0)
    # --- facteurs latents ---
    - 0.65 * discipline
    - 0.25 * richesse
    # --- relation coopérative ---
    - 0.55 * membre_groupe_solidaire
    - 0.012 * np.clip(anciennete_cooperative_mois, 0, 60)
    + 0.55 * (nombre_credits_anterieurs == 0)
    + 0.90 * (regularite_epargne == "Aucune épargne")
    - 0.45 * (regularite_epargne == "Régulière")
    # --- historique interne ---
    + np.where(a_historique, -0.025 * np.nan_to_num(taux_remboursement_historique - 85.0), 0.0)
    + np.where(a_historique, 0.020 * np.nan_to_num(jours_retard_moyen_historique), 0.0)
    + np.where(a_historique, 0.006 * np.nan_to_num(delai_utilisation_credit_apres_deblocage_jours - 15.0), 0.0)
    # --- garantie ---
    - 0.45 * (garantie != "Aucune")
    + 0.50 * (garantie == "Aucune")
    # --- démographie ---
    + 0.22 * (nombre_personnes_a_charge > 5)
    # --- secteur / sous-secteur / ancienneté au poste ---
    + offset_secteur + offset_sous_secteur + offset_anciennete_poste
    # --- saisonnalité + vulnérabilité géographique ---
    + 0.30 * saisonnalite_activite
    + 0.45 * indice_vulnerabilite_zone * np.isin(secteur_activite, [SECT_AGRICULTURE, SECT_ELEVAGE])
    + 0.12 * indice_vulnerabilite_zone
    # --- BIC ---
    + 1.05 * (statut_bic == BIC_INCIDENT)
    - 0.40 * (statut_bic == BIC_BON_PAYEUR)
    + 0.30 * (nombre_prets_actifs_autres_institutions >= 2)
    + 0.15 * (statut_bic == BIC_PRET_EN_COURS)
    + np.where(np.isnan(bic_anciennete_dernier_incident_mois), 0.0,
               0.35 * (np.nan_to_num(bic_anciennete_dernier_incident_mois) < 12))
    + 0.10 * np.clip(np.nan_to_num(bic_nombre_credits_soldes_ailleurs) - 2.0, 0.0, 5.0)
    # --- Mobile Money ---
    + 0.30 * (mm_nombre_incidents_credit_mm >= 1)
    - 0.12 * possede_mobile_money
    - 0.008 * np.clip(frequence_transactions_mm_mois, 0, 30)
    + np.where(mm, 0.010 * np.clip(np.nan_to_num(mm_volatilite_flux_pct) - 35.0, 0.0, 85.0) / 10.0, 0.0)
    # --- comptes bancaires ---
    + 0.35 * (nombre_rejets_prelevements_cheques_12m >= 1)
    - 0.15 * (possede_compte_bancaire == 1)
    # --- catégorie de crédit ---
    + offset_categorie_credit
    # --- bruit idiosyncratique ---
    + RNG.normal(0, 0.60, N)
)
proba_defaut_latent = 1.0 / (1.0 + np.exp(-z))
defaut_credit = RNG.binomial(1, proba_defaut_latent)

# --- Scorecard de référence (SORTIE, jamais une feature) --------------------
score_ia = np.clip(
    690
    - 170 * np.clip(ratio_endettement - 0.40, 0, None)
    + 0.7 * np.nan_to_num(taux_remboursement_historique, nan=80.0)
    - 2.2 * np.nan_to_num(jours_retard_moyen_historique, nan=0.0)
    + 22 * membre_groupe_solidaire
    - 32 * (regularite_epargne == "Aucune épargne")
    + 40 * discipline
    + RNG.normal(0, 15, N),
    300, 900,
).round().astype("int64")
decision_scoring_cif = np.select(
    [score_ia >= 680, score_ia >= 550],
    ["Accord Favorable", "À Examiner"],
    default="Risque Élevé",
)

# ===========================================================================
# 11. Colonnes : modèle / identité / sortie
# ===========================================================================
COLONNES_MODELE = [
    "age", "sexe", "zone", "situation_matrimoniale", "niveau_education", "nombre_personnes_a_charge",
    "secteur_activite", "sous_secteur_activite", "saisonnalite_activite", "indice_vulnerabilite_zone",
    "anciennete_activite_annees", "revenu_mensuel_fcfa", "charges_mensuelles_fcfa",
    "anciennete_cooperative_mois", "membre_groupe_solidaire", "epargne_solde_moyen_fcfa", "regularite_epargne",
    "nombre_credits_anterieurs", "taux_remboursement_historique_pct", "jours_retard_moyen_historique",
    "montant_total_emprunte_passe", "delai_utilisation_credit_apres_deblocage_jours",
    "total_transactions", "volume_depots_fcfa", "volume_retraits_fcfa", "tx_mobile_money",
    "possede_mobile_money", "frequence_transactions_mm_mois", "mm_anciennete_compte_mois",
    "mm_anciennete_sim_mois", "mm_nombre_mois_actifs_12m", "mm_volume_transactions_mensuel_fcfa",
    "mm_flux_entrants_mensuel_fcfa", "mm_flux_sortants_mensuel_fcfa", "mm_montant_remboursements_mm_fcfa",
    "mm_nombre_incidents_credit_mm", "mm_solde_moyen_fcfa", "mm_solde_minimum_fcfa",
    "mm_evolution_solde_pct", "mm_volatilite_flux_pct", "mm_ratio_depenses_credit_appel_data_pct",
    "nombre_comptes_bancaires", "type_compte_principal", "solde_compte_bancaire_fcfa",
    "flux_depots_bancaires_mensuel_fcfa", "flux_retraits_bancaires_mensuel_fcfa",
    "nombre_rejets_prelevements_cheques_12m",
    "interroge_bic", "statut_bic", "nombre_prets_actifs_autres_institutions",
    "encours_credit_autres_institutions_fcfa", "bic_nombre_credits_soldes_ailleurs",
    "bic_anciennete_dernier_incident_mois",
    "categorie_credit", "montant_credit_demande_fcfa", "duree_credit_mois",
    "taux_interet_nominal_annuel_pct", "frais_dossier_fcfa", "garantie",
    "future_echeance_credit_fcfa", "ratio_endettement", "ratio_reste_a_vivre_absolu_fcfa",
    "ratio_couverture_echeance_epargne",
]
COLONNES_SORTIE = ["defaut_credit", "score_ia", "decision_scoring_cif"]

_INT_MONEY = {
    "revenu_mensuel_fcfa", "charges_mensuelles_fcfa", "epargne_solde_moyen_fcfa",
    "montant_total_emprunte_passe", "volume_depots_fcfa", "volume_retraits_fcfa",
    "mm_volume_transactions_mensuel_fcfa", "mm_flux_entrants_mensuel_fcfa",
    "mm_flux_sortants_mensuel_fcfa", "mm_montant_remboursements_mm_fcfa",
    "mm_solde_moyen_fcfa", "mm_solde_minimum_fcfa", "solde_compte_bancaire_fcfa",
    "flux_depots_bancaires_mensuel_fcfa", "flux_retraits_bancaires_mensuel_fcfa",
    "encours_credit_autres_institutions_fcfa", "montant_credit_demande_fcfa",
    "frais_dossier_fcfa", "future_echeance_credit_fcfa", "ratio_reste_a_vivre_absolu_fcfa",
}

# Alias : quelques variables portent un nom "métier" plus court en amont ;
# les colonnes du modèle utilisent le suffixe explicite.
revenu_mensuel_fcfa = revenu_mensuel
charges_mensuelles_fcfa = charges_mensuelles
epargne_solde_moyen_fcfa = epargne_solde_moyen
taux_remboursement_historique_pct = taux_remboursement_historique

_g = globals()
_manquants = [_c for _c in COLONNES_MODELE if _c not in _g]
assert not _manquants, f"Variables absentes pour COLONNES_MODELE : {_manquants}"
_valeurs = {_c: _g[_c] for _c in COLONNES_MODELE}
for _col_int in _INT_MONEY:
    _valeurs[_col_int] = np.asarray(_valeurs[_col_int], dtype="int64")

# ===========================================================================
# 12. Assemblage
# ===========================================================================
id_client = np.array([f"SMD-{i:05d}" for i in range(1, N + 1)])

df_entrainement = pd.DataFrame({"id_client": id_client, **_valeurs, "defaut_credit": defaut_credit})

df_complet = df_entrainement.copy()
df_complet["objet_credit"] = objet_credit
df_complet["score_ia"] = score_ia
df_complet["decision_scoring_cif"] = decision_scoring_cif
df_complet["proba_defaut_latent"] = proba_defaut_latent.round(4)
df_complet["discipline_latent"] = discipline.round(3)
df_complet["richesse_latent"] = richesse.round(3)
for _c, _v in {
    "numero_compte": numero_compte, "type_compte": type_compte, "statut_compte": statut_compte,
    "parts_sociales_fcfa": parts_sociales_fcfa, "nom": nom, "prenom": prenom,
    "date_naissance": date_naissance, "numero_cnib": numero_cnib,
    "date_expiration_cnib": date_expiration_cnib, "contact_telephonique": contact_telephonique,
    "email": email, "pays": pays, "region": region, "ville": ville, "adresse_complete": adresse_complete,
    "type_logement": type_logement, "agence_cif": agence_cif, "activite": activite,
    "date_creation": date_creation, "mensualite_externe_estimee": mensualite_externe_estimee,
}.items():
    df_complet[_c] = _v

# ===========================================================================
# 13. Contrôles de cohérence
# ===========================================================================
taux_defaut = float(defaut_credit.mean())
for _leak in ("defaut_credit", "score_ia", "decision_scoring_cif", "proba_defaut_latent",
              "discipline", "richesse", "objet_credit"):
    assert _leak not in COLONNES_MODELE, f"FUITE : {_leak} dans COLONNES_MODELE"
assert not df_entrainement["defaut_credit"].isna().any()
assert set(np.unique(secteur_activite)).issubset(set(SECTEURS_ACTIVITE))
assert set(np.unique(garantie)).issubset(set(GARANTIES))
assert set(np.unique(statut_bic)).issubset(set([BIC_NON_CONSULTE, *STATUTS_BIC_SI_CONSULTE]))
assert set(np.unique(categorie_credit)).issubset(set(CATEGORIES))
assert len(df_entrainement.columns) == len(COLONNES_MODELE) + 2  # id_client + cible

# ===========================================================================
# 14. Écriture
# ===========================================================================
os.makedirs(os.path.join(REPO, "data"), exist_ok=True)
df_entrainement.to_csv(os.path.join(REPO, "data", "dataset_entrainement.csv"),
                       index=False, encoding="utf-8-sig")
df_complet.to_csv(os.path.join(REPO, "data", "base_complete.csv"),
                  index=False, encoding="utf-8-sig")


def _client_base(i):
    return {
        "id": i + 1,
        "numeroCompte": str(numero_compte[i]),
        "typeCompte": str(type_compte[i]),
        "statutCompte": str(statut_compte[i]),
        "partsSocialesFcfa": int(parts_sociales_fcfa[i]),
        "nom": str(nom[i]),
        "prenom": str(prenom[i]),
        "dateNaissance": str(date_naissance[i]),
        "age": int(age[i]),
        "sexe": str(sexe[i]),
        "zone": str(zone[i]),
        "numeroCnib": str(numero_cnib[i]),
        "dateExpirationCnib": str(date_expiration_cnib[i]),
        "telephone": str(contact_telephonique[i]),
        "email": str(email[i]),
        "pays": str(pays[i]),
        "region": str(region[i]),
        "ville": str(ville[i]),
        "adresse": str(adresse_complete[i]),
        "typeLogement": str(type_logement[i]),
        "agence": str(agence_cif[i]),
        "situationMatrimoniale": str(situation_matrimoniale[i]),
        "nombrePersonnesACharge": int(nombre_personnes_a_charge[i]),
        "niveauEducation": str(niveau_education[i]),
        "activite": str(activite[i]),
        "secteurActivite": str(secteur_activite[i]),
        "ancienneteActiviteAnnees": float(anciennete_activite_annees[i]),
        "dateCreation": str(date_creation[i]),
        "ancienneteCooperativeMois": int(anciennete_cooperative_mois[i]),
        "revenuMensuelFcfa": int(revenu_mensuel[i]),
        "chargesMensuellesFcfa": int(charges_mensuelles[i]),
        "soldeEpargneActuelFcfa": int(epargne_solde_moyen[i]),
        "demandes": [],
    }


def _nan_to_none(x):
    return None if (isinstance(x, float) and np.isnan(x)) else x


def _client_complet(i):
    base = _client_base(i)
    base.update({
        "sousSecteurActivite": str(sous_secteur_activite[i]),
        "saisonaliteActivite": bool(saisonnalite_activite[i]),
        "indiceVulnerabiliteZone": float(indice_vulnerabilite_zone[i]),
        "nombreCreditsAnterieurs": int(nombre_credits_anterieurs[i]),
        "tauxRemboursementHistoriquePct": _nan_to_none(float(taux_remboursement_historique[i])),
        "joursRetardMoyenHistorique": _nan_to_none(float(jours_retard_moyen_historique[i])),
        "montantTotalEmprunteFcfa": int(montant_total_emprunte_passe[i]),
        "delaiUtilisationCreditJours": _nan_to_none(
            float(delai_utilisation_credit_apres_deblocage_jours[i])),
        "totalTransactions": int(total_transactions[i]),
        "volumeDepotsFcfa": int(volume_depots_fcfa[i]),
        "volumeRetraitsFcfa": int(volume_retraits_fcfa[i]),
        "txMobileMoney": int(tx_mobile_money[i]),
        "possedeMobileMoney": bool(possede_mobile_money[i]),
        "frequenceTransactionsMmMois": int(frequence_transactions_mm_mois[i]),
        "mmAncienneteCompteMois": _nan_to_none(float(mm_anciennete_compte_mois[i])),
        "mmSoldeMoyenFcfa": int(mm_solde_moyen_fcfa[i]),
        "mmFluxEntrantsMensuelFcfa": int(mm_flux_entrants_mensuel_fcfa[i]),
        "mmNombreIncidentsCreditMm": int(mm_nombre_incidents_credit_mm[i]),
        "nombreComptesBancaires": int(nombre_comptes_bancaires[i]),
        "typeComptePrincipal": str(type_compte_principal[i]),
        "soldeCompteBancaireFcfa": int(solde_compte_bancaire_fcfa[i]),
        "nombreRejetsPrelevementsCheques12m": int(nombre_rejets_prelevements_cheques_12m[i]),
    })
    return base


clients_banque = [_client_base(i) for i in range(N_CLIENTS_BANQUE)]
clients_complet = [_client_complet(i) for i in range(N_CLIENTS_BANQUE)]


def _ecrire_json(chemin, obj):
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    with open(chemin, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


_ecrire_json(os.path.join(REPO, "data", "societaires.json"), clients_banque)
_ecrire_json(os.path.join(REPO, "data", "societaires_complet.json"), clients_complet)
_ecrire_json(os.path.join(REPO, "frontend", "public", "data", "societaires.json"), clients_banque)
_ecrire_json(os.path.join(REPO, "backend", "src", "main", "resources", "data", "societaires.json"), clients_banque)
# Base A enrichie : le seeder du backend s'en sert pour pré-remplir les agrégats
# comportementaux des sociétaires (source du pré-remplissage du wizard).
_ecrire_json(os.path.join(REPO, "backend", "src", "main", "resources", "data", "societaires_complet.json"), clients_complet)

_ts_path = os.path.join(REPO, "frontend", "src", "app", "data", "societaires-data.ts")
os.makedirs(os.path.dirname(_ts_path), exist_ok=True)
with open(_ts_path, "w", encoding="utf-8") as f:
    f.write("// Base des sociétaires CIF (BASE A) - générée par scripts/01_generate_dataset.py\n")
    f.write("import { Client } from '../models/client.model';\n\n")
    f.write("export const SOCIETAIRES_CIF_BASE: Client[] = ")
    f.write(json.dumps(clients_banque, ensure_ascii=False, indent=2))
    f.write(";\n")

# ===========================================================================
# 15. Rapport
# ===========================================================================
print("=" * 72)
print(f"  dataset_entrainement.csv : {df_entrainement.shape[0]} lignes x "
      f"{len(COLONNES_MODELE)} features (+ id_client + defaut_credit)")
print(f"  societaires.json         : {len(clients_banque)} sociétaires (BASE A)")
print(f"  Taux de défaut global    : {taux_defaut:.2%}")
if not (0.08 <= taux_defaut <= 0.15):
    _cible = 0.115
    _delta = float(np.log(_cible / (1 - _cible)) - np.log(taux_defaut / (1 - taux_defaut)))
    print(f"  ⚠️  hors plage cible [8% ; 15%] -> dans la formule z, remplacer "
          f"l'intercept -4.68 par ~{-4.68 + _delta:.2f} et relancer 01.")
print(f"  Nouveaux clients (0 crédit antérieur) : {(nombre_credits_anterieurs == 0).mean():.1%}")
print(f"  Possède Mobile Money                  : {(possede_mobile_money == 1).mean():.1%}")
print(f"  BIC consulté                          : {(interroge_bic == 1).mean():.1%}")
print("=" * 72)

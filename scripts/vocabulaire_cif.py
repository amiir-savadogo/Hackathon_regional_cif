# -*- coding: utf-8 -*-
"""
vocabulaire_cif.py
==================
SOURCE DE VÉRITÉ UNIQUE des valeurs catégorielles du projet.

Le même vocabulaire doit être utilisé par :
  - le générateur de données   (scripts/01_generate_dataset.py)
  - le catalogue de crédits     (scripts/catalogue_types_credit.py)
  - le moteur IA                (ai-service/main.py, modèle ClientData)
  - les menus du frontend       (formulaire d'instruction / wizard)

Règle : ces chaînes sont encodées telles quelles par le OneHotEncoder du
modèle. Toute valeur envoyée à l'inférence qui ne figure pas ici est
silencieusement mise à zéro par l'encodeur (handle_unknown="ignore") =
signal perdu. Ne jamais dupliquer une de ces listes ailleurs : importer d'ici.
"""

# --- Profil socio-démographique -------------------------------------------------
SEXES = ["Femme", "Homme"]
ZONES = ["Urbaine", "Semi-urbaine", "Rurale"]
SITUATIONS_MATRIMONIALES = ["Marié(e)", "Célibataire", "Veuf(ve)", "Divorcé(e)"]
NIVEAUX_EDUCATION = ["Aucun", "Primaire", "Secondaire", "Supérieur"]

# --- Activité économique ------------------------------------------------------
SECT_COMMERCE_INFORMEL = "Commerce informel"
SECT_AGRICULTURE = "Agriculture"
SECT_ELEVAGE = "Élevage"
SECT_ARTISANAT = "Artisanat"
SECT_RESTAURATION = "Restauration/Transformation"
SECT_TRANSPORT = "Transport"
SECT_SALARIE_FORMEL = "Salarié secteur formel"
SECT_FONCTIONNAIRE = "Fonctionnaire"
SECT_AUTRE_SERVICE = "Autre service"

SECTEURS_ACTIVITE = [
    SECT_COMMERCE_INFORMEL, SECT_AGRICULTURE, SECT_ELEVAGE, SECT_ARTISANAT,
    SECT_RESTAURATION, SECT_TRANSPORT, SECT_SALARIE_FORMEL, SECT_FONCTIONNAIRE,
    SECT_AUTRE_SERVICE,
]
# Probabilités inchangées depuis la V1 (compatibilité menus + comparabilité).
SECTEURS_ACTIVITE_PROBAS = [0.30, 0.16, 0.08, 0.10, 0.12, 0.06, 0.08, 0.05, 0.05]

SECTEURS_FORMELS = [SECT_SALARIE_FORMEL, SECT_FONCTIONNAIRE]

# Sous-secteur : n'existe QUE pour "Salarié secteur formel" (sinon "Non applicable").
SOUS_SECTEUR_NON_APPLICABLE = "Non applicable"
SOUS_SECTEURS_FORMELS = [
    "Banque/Finance", "Télécom/Services", "Mines", "BTP", "Autre secteur formel",
]
SOUS_SECTEURS_FORMELS_PROBAS = [0.14, 0.18, 0.10, 0.20, 0.38]

# Libellé d'activité affiché (Base A), un par secteur.
ACTIVITE_PAR_SECTEUR = {
    SECT_COMMERCE_INFORMEL: "Vente de vivriers et condiments au marché",
    SECT_AGRICULTURE: "Maraîchage et production céréalière",
    SECT_ELEVAGE: "Embouche ovine et caprine",
    SECT_ARTISANAT: "Atelier de couture et confection",
    SECT_RESTAURATION: "Restauration et transformation agroalimentaire",
    SECT_TRANSPORT: "Transport en tricycle et taxi urbain",
    SECT_SALARIE_FORMEL: "Emploi salarié du secteur privé",
    SECT_FONCTIONNAIRE: "Emploi dans la fonction publique",
    SECT_AUTRE_SERVICE: "Prestation de services",
}

# --- Compte / logement (Base A) ---------------------------------------------
STATUTS_COMPTE = ["Actif", "Dormant", "Bloqué"]
STATUTS_COMPTE_PROBAS = [0.92, 0.06, 0.02]
TYPES_COMPTE = [
    "Compte Épargne Sociétaire", "Compte Tontine Digitale", "Compte Courant Micro-Entreprise",
]
TYPES_COMPTE_PROBAS = [0.65, 0.22, 0.13]
TYPES_LOGEMENT = ["Propriétaire", "Locataire", "Logement familial / Hébergé"]
TYPES_LOGEMENT_PROBAS = [0.42, 0.38, 0.20]

# --- Relation coopérative ---------------------------------------------------
REGULARITES_EPARGNE = ["Régulière", "Irrégulière", "Aucune épargne"]

# --- Garantie (aligné sur LGD_PAR_GARANTIE de ai-service/main.py) -----------
GAR_CAUTION_SOLIDAIRE = "Caution solidaire"
GAR_BIEN_MATERIEL = "Bien matériel"
GAR_AVAL_TIERS = "Aval d'un tiers"
GAR_AUCUNE = "Aucune"
GARANTIES = [GAR_CAUTION_SOLIDAIRE, GAR_BIEN_MATERIEL, GAR_AVAL_TIERS, GAR_AUCUNE]
GARANTIES_PROBAS = [0.38, 0.24, 0.16, 0.22]

# --- Bureau d'Information sur le Crédit (BIC) ------------------------------
BIC_NON_CONSULTE = "Non consulté"
BIC_JAMAIS = "Jamais emprunté ailleurs"
BIC_BON_PAYEUR = "Bon payeur ailleurs (solde sans incident)"
BIC_PRET_EN_COURS = "Prêt en cours ailleurs"
BIC_INCIDENT = "Incident de paiement signalé ailleurs"
STATUTS_BIC = [BIC_NON_CONSULTE, BIC_JAMAIS, BIC_BON_PAYEUR, BIC_PRET_EN_COURS, BIC_INCIDENT]
# Probas CONDITIONNELLES à interroge_bic == 1 (les 4 dernières, renormalisées).
STATUTS_BIC_SI_CONSULTE = [BIC_JAMAIS, BIC_BON_PAYEUR, BIC_PRET_EN_COURS, BIC_INCIDENT]
STATUTS_BIC_SI_CONSULTE_PROBAS = [0.42, 0.30, 0.20, 0.08]

# --- Compte bancaire classique -------------------------------------------
TYPE_COMPTE_BANCAIRE_AUCUN = "Aucun"
TYPES_COMPTE_BANCAIRE = ["Épargne", "Courant", "Dépôt à terme"]
TYPES_COMPTE_BANCAIRE_PROBAS = [0.55, 0.38, 0.07]

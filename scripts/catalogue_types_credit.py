# -*- coding: utf-8 -*-
"""
catalogue_types_credit.py
==========================
Catalogue SIMULÉ des types de crédit d'une coopérative financière (SFD) type,
organisé en catégories, avec pour chaque type une fourchette de taux nominal
annuel et de durée indicatives.

IMPORTANT — ce catalogue n'est PAS une nomenclature officielle CIF/BCEAO.
C'est une construction plausible inspirée des produits courants des SFD
ouest-africaines (crédit de campagne, fonds de roulement, équipement,
consommation, habitat, scolaire, santé, social, salarié, groupe solidaire).
Si la coopérative partenaire fournit sa vraie grille produits/taux, remplacer
ce fichier : le reste du pipeline consomme le catalogue par sa STRUCTURE, pas
par son contenu exact.

Chaque entrée : {categorie, type, taux_min_pct, taux_max_pct,
duree_min_mois, duree_max_mois}.
"""

from vocabulaire_cif import (
    SECT_AGRICULTURE, SECT_ELEVAGE, SECT_COMMERCE_INFORMEL, SECT_ARTISANAT,
    SECT_TRANSPORT, SECT_RESTAURATION, SECT_SALARIE_FORMEL, SECT_FONCTIONNAIRE,
    SECT_AUTRE_SERVICE, SECTEURS_ACTIVITE,
)

# --- Noms de catégories (source de vérité : utilisés aussi dans les offsets
#     de risque du générateur, OFFSET_CATEGORIE_CREDIT). -------------------
CAT_AGRICOLE = "Crédit agricole - campagne"
CAT_ELEVAGE = "Crédit élevage"
CAT_COMMERCE = "Crédit commerce - fonds de roulement"
CAT_ARTISANAT = "Crédit artisanat - production"
CAT_TRANSPORT = "Crédit transport"
CAT_EQUIPEMENT = "Crédit équipement - investissement"
CAT_HABITAT = "Crédit habitat - amélioration logement"
CAT_CONSOMMATION = "Crédit consommation"
CAT_SCOLAIRE = "Crédit scolaire - éducation"
CAT_SANTE = "Crédit santé"
CAT_SOCIAL = "Crédit social - événementiel"
CAT_SALARIE = "Crédit salarié - fonctionnaire"
CAT_GROUPE = "Crédit groupe solidaire"

CATALOGUE = []


def _ajouter(categorie, types, taux_min, taux_max, duree_min, duree_max):
    for t in types:
        CATALOGUE.append({
            "categorie": categorie,
            "type": t,
            "taux_min_pct": taux_min,
            "taux_max_pct": taux_max,
            "duree_min_mois": duree_min,
            "duree_max_mois": duree_max,
        })


_ajouter(CAT_AGRICOLE, [
    "Achat de semences", "Achat d'engrais", "Achat de produits phytosanitaires",
    "Location de terre pour la campagne", "Main d'oeuvre agricole",
    "Petit matériel agricole manuel", "Riziculture - intrants",
    "Maraîchage - intrants", "Culture du coton", "Culture de l'arachide",
    "Culture du sésame", "Culture du maïs", "Culture du niébé",
    "Irrigation - petit équipement", "Aviculture - poussins et aliment",
    "Maraîchage de contre-saison", "Transformation post-récolte",
    "Warrantage - stockage céréalier", "Warrantage - stockage arachide",
    "Warrantage - stockage niébé",
], 10.0, 16.0, 3, 12)

_ajouter(CAT_ELEVAGE, [
    "Embouche bovine", "Embouche ovine", "Embouche porcine",
    "Achat de bétail (reproducteurs)", "Aliment de bétail",
    "Santé animale / vaccination", "Aviculture - poulets de chair",
    "Aviculture - poules pondeuses", "Apiculture", "Pisciculture / aquaculture",
], 11.0, 17.0, 4, 18)

_ajouter(CAT_COMMERCE, [
    "Commerce général de détail", "Commerce de gros", "Boutique/kiosque",
    "Commerce ambulant", "Marché de nuit", "Import de marchandises (petit volume)",
    "Vente de tissus/pagnes", "Vente de produits cosmétiques",
    "Vente de produits alimentaires", "Vente de pièces détachées",
    "Quincaillerie", "Librairie/papeterie", "Vente de téléphones/accessoires",
    "Commerce de bétail", "Commerce de céréales", "Commerce de poisson séché/fumé",
    "Station-service / vente de carburant au détail", "Pharmacie/dépôt pharmaceutique",
    "Commerce de matériaux de construction", "Restauration de rue",
], 11.0, 18.0, 3, 24)

_ajouter(CAT_ARTISANAT, [
    "Couture/confection", "Coiffure/tresse", "Menuiserie bois",
    "Menuiserie métallique/soudure", "Mécanique auto/moto", "Teinture",
    "Transformation agroalimentaire (jus, farine)", "Fabrication de savon",
    "Poterie/céramique", "Bijouterie/orfèvrerie", "Cordonnerie",
    "Photographie/vidéo événementielle", "Imprimerie/sérigraphie",
    "Vannerie/tissage",
], 11.0, 17.0, 6, 24)

_ajouter(CAT_TRANSPORT, [
    "Achat de moto-taxi", "Achat de tricycle motorisé", "Réparation de véhicule utilitaire",
    "Achat de taxi", "Assurance/documents de transport", "Location-vente de vélo cargo",
    "Achat de vélo utilitaire", "Achat de charrette/attelage", "Renouvellement de pièces moto-taxi",
], 12.0, 18.0, 6, 36)

_ajouter(CAT_EQUIPEMENT, [
    "Machine de couture industrielle", "Groupe électrogène", "Kit solaire domestique/professionnel",
    "Matériel informatique professionnel", "Matériel de transformation agroalimentaire",
    "Congélateur/chambre froide", "Matériel de restauration (four, plaque)",
    "Extension de local commercial", "Matériel de soudure/menuiserie",
    "Matériel de sonorisation événementielle", "Matériel de coiffure/salon de beauté",
    "Matériel d'irrigation goutte-à-goutte", "Broyeur/moulin à céréales",
    "Presse à huile artisanale",
], 12.0, 18.0, 12, 48)

_ajouter(CAT_HABITAT, [
    "Construction de logement", "Réparation/toiture", "Extension de logement",
    "Adduction d'eau", "Électrification domestique", "Assainissement/latrines",
    "Achat de parcelle", "Peinture/finition", "Clôture de parcelle",
    "Installation de panneaux solaires résidentiels", "Réhabilitation de puits",
], 10.0, 16.0, 12, 48)

_ajouter(CAT_CONSOMMATION, [
    "Électroménager", "Mobilier de maison", "Téléphone/tablette", "Vêtements/habillement",
    "Frais de déménagement", "Literie", "Vaisselle/ustensiles de cuisine",
    "Groupe électrogène domestique", "Abonnement/forfait internet annuel",
], 13.0, 19.0, 3, 18)

_ajouter(CAT_SCOLAIRE, [
    "Frais de scolarité", "Fournitures scolaires", "Formation professionnelle courte",
    "Frais universitaires", "Internat/logement étudiant", "Uniformes scolaires",
    "Frais de concours/examens", "Matériel informatique pour études",
], 9.0, 14.0, 3, 12)

_ajouter(CAT_SANTE, [
    "Frais d'hospitalisation", "Achat de médicaments", "Cotisation mutuelle de santé",
    "Consultation spécialisée", "Frais d'accouchement", "Lunettes/appareillage médical",
    "Frais d'évacuation sanitaire", "Soins dentaires",
], 9.0, 14.0, 3, 12)

_ajouter(CAT_SOCIAL, [
    "Cérémonie de mariage", "Funérailles", "Baptême", "Fête religieuse",
    "Cotisation tontine/association", "Pèlerinage", "Cérémonie de dot",
    "Fête de fin d'année",
], 13.0, 19.0, 3, 12)

_ajouter(CAT_SALARIE, [
    "Avance sur salaire", "Crédit consommation salarié (domiciliation)",
    "Crédit véhicule salarié", "Crédit équipement domestique salarié",
    "Crédit scolaire salarié", "Crédit habitat salarié", "Crédit santé salarié",
    "Crédit de campagne (fonctionnaire rural)", "Crédit investissement complémentaire salarié",
], 8.0, 13.0, 6, 48)

_ajouter(CAT_GROUPE, [
    "Activité génératrice de revenus (groupe)", "Caisse villageoise tournante",
    "Groupement féminin - production", "Groupement agricole - intrants collectifs",
    "Association de transformation collective", "Groupement d'éleveurs - achat groupé",
    "Coopérative de transformation - équipement collectif",
], 9.0, 15.0, 6, 24)

NOMBRE_TYPES = len(CATALOGUE)
CATEGORIES = sorted({t["categorie"] for t in CATALOGUE})

# --- Biais secteur d'activité -> catégories de crédit plausibles -----------
# CLÉS = valeurs réelles de secteur_activite (vocabulaire_cif.SECTEURS_ACTIVITE).
_CORRESPONDANCES = {
    SECT_FONCTIONNAIRE: [CAT_SALARIE],
    SECT_SALARIE_FORMEL: [CAT_SALARIE, CAT_CONSOMMATION],
    SECT_COMMERCE_INFORMEL: [CAT_COMMERCE],
    SECT_AGRICULTURE: [CAT_AGRICOLE],
    SECT_ELEVAGE: [CAT_ELEVAGE],
    SECT_ARTISANAT: [CAT_ARTISANAT],
    SECT_RESTAURATION: [CAT_COMMERCE, CAT_ARTISANAT],
    SECT_TRANSPORT: [CAT_TRANSPORT],
    SECT_AUTRE_SERVICE: [CAT_COMMERCE, CAT_CONSOMMATION],
}


def categories_par_secteur(secteur_activite: str):
    """Catégories plausibles pour un secteur (biaise le tirage du type de
    crédit). Le tirage reste possible sur toutes les catégories avec un poids
    plus faible (besoins personnels transverses)."""
    return _CORRESPONDANCES.get(secteur_activite, [CAT_COMMERCE])


# --- Garde-fous : cohérence catalogue <-> vocabulaire ---------------------
DUREES_STANDARD = [3, 6, 9, 12, 18, 24, 36, 48]

for _secteur in SECTEURS_ACTIVITE:
    assert _secteur in _CORRESPONDANCES, (
        f"categories_par_secteur : secteur non couvert -> fallback silencieux : {_secteur!r}"
    )
for _cats in _CORRESPONDANCES.values():
    for _c in _cats:
        assert _c in CATEGORIES, f"Catégorie inconnue dans _CORRESPONDANCES : {_c!r}"
for _t in CATALOGUE:
    _plage = [d for d in DUREES_STANDARD if _t["duree_min_mois"] <= d <= _t["duree_max_mois"]]
    assert _plage, f"Aucune durée standard dans la plage du type {_t['type']!r}"
    assert _t["taux_min_pct"] <= _t["taux_max_pct"], f"Taux incohérent : {_t['type']!r}"

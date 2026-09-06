# -*- coding: utf-8 -*-
"""
export_catalogue.py
===================
Exporte le catalogue produits (scripts/catalogue_types_credit.py) + les garanties
du modèle vers data/catalogue_credit.json (et la copie ressources backend).

C'est la SOURCE DE VÉRITÉ unique consommée à la fois par :
  - le générateur de dataset (Python)
  - le seeder du backend (Java, DatabaseSeeder) -> tables categorie_credit,
    objets_credit, types_garantie, remplies au démarrage si vides.

Bibliothèque standard uniquement : `py scripts/export_catalogue.py`
"""

import json
import os
import re

from catalogue_types_credit import CATALOGUE, CATEGORIES
from vocabulaire_cif import GARANTIES

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _code(label: str) -> str:
    s = label.upper()
    s = s.replace("É", "E").replace("È", "E").replace("Ê", "E").replace("À", "A").replace("Ô", "O")
    s = re.sub(r"[^A-Z0-9]+", "_", s).strip("_")
    return s[:60]


# --- Taux / durée par catégorie (min des types de la catégorie) -------------
_par_cat = {}
for t in CATALOGUE:
    c = t["categorie"]
    d = _par_cat.setdefault(c, {"taux_min": 99.0, "duree_max": 0})
    d["taux_min"] = min(d["taux_min"], t["taux_min_pct"])
    d["duree_max"] = max(d["duree_max"], t["duree_max_mois"])

categories = [
    {
        "code": _code(cat),
        "label": cat,
        "tauxInteretMin": round(_par_cat[cat]["taux_min"], 2),
        "dureeMaxMois": _par_cat[cat]["duree_max"],
        "systeme": True,   # valeur consommée par le modèle IA -> ne pas renommer
    }
    for cat in CATEGORIES
]

objets = [
    {
        "code": _code(t["categorie"][:3] + "_" + t["type"]),
        "label": t["type"],
        "categorie": t["categorie"],
        "tauxInteretMin": round((t["taux_min_pct"] + t["taux_max_pct"]) / 2, 2),
        "dureeMaxMois": t["duree_max_mois"],
        "systeme": True,
    }
    for t in CATALOGUE
]

garanties = [
    {"code": _code(g), "label": g, "tauxCouvertureRecommande": 100, "systeme": True}
    for g in GARANTIES
]

payload = {"categories": categories, "objets": objets, "garanties": garanties}

for chemin in (
    os.path.join(REPO, "data", "catalogue_credit.json"),
    os.path.join(REPO, "backend", "src", "main", "resources", "data", "catalogue_credit.json"),
):
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    with open(chemin, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"catalogue_credit.json : {len(categories)} catégories, {len(objets)} objets, "
      f"{len(garanties)} garanties -> data/ + backend/src/main/resources/data/")

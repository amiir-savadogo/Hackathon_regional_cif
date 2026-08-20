# Samdé — Scoring Microcrédit

Prototype réalisé pour le **Hackathon National d'Innovation CIF — Projet DigiCoop-WA+**
(Thématique 02 : *Scoring Microcrédit*), Burkina Faso, 4-6 septembre 2026.

Système de scoring automatisé du risque de microcrédit, conçu pour les **Coopératives
financières (Institutions de Microfinance) d'Afrique de l'Ouest**, avec des variables
réellement disponibles localement (épargne, historique interne, Mobile Money,
cautionnement solidaire) plutôt que des variables issues de contextes bancaires
occidentaux (bureau de crédit, carte bancaire).

## Structure du projet

```
Samdé/
├── data/
│   └── Samdé_dataset.csv          # dataset synthétique (4000 dossiers)
├── scripts/
│   ├── 01_generate_dataset.py         # génération du dataset synthétique documenté
│   ├── 02_train_model.py              # prétraitement, SMOTE, comparaison de 3 modèles
│   └── build_notebook.py              # génère notebooks/analyse_et_modelisation.ipynb
├── notebooks/
│   └── analyse_et_modelisation.ipynb  # EDA + modélisation + SHAP (exécuté, avec sorties)
├── models/                            # artefacts sauvegardés (pipeline + modèle + SHAP)
├── app/
│   └── app.py                         # application Streamlit (démonstration agent de crédit)
├── docs_build/
│   └── note_presentation_Samdé.docx  # note de présentation (dossier de candidature)
└── requirements.txt
```

## Installation et exécution

```bash
pip install -r requirements.txt

# 1. Générer le dataset synthétique
python scripts/01_generate_dataset.py

# 2. Entraîner et comparer les modèles (sauvegarde dans models/)
python scripts/02_train_model.py

# 3. Lancer l'application de démonstration
streamlit run app/app.py
```

## Méthodologie

1. **Données** : dataset synthétique (4 000 dossiers) calibré sur des ordres de
   grandeur réalistes de la microfinance en zone UEMOA (taux de défaut de base
   ≈ 11-12%, poids du secteur informel, rôle du cautionnement solidaire, revenus
   informels asymétriques). Voir `scripts/01_generate_dataset.py` pour le détail
   des règles de génération — reproductible et ré-étalonnable avec des données
   réelles anonymisées lors d'un déploiement pilote.
2. **Prétraitement** : imputation (nouveaux clients sans historique), encodage
   one-hot des variables catégorielles, standardisation des variables numériques.
3. **Déséquilibre des classes** : SMOTE appliqué uniquement sur le jeu d'entraînement.
4. **Modélisation** : comparaison de 3 modèles (Régression Logistique, Random
   Forest, XGBoost) ; sélection sur le **F1-score de la classe Défaut au seuil
   de décision optimisé** (et non l'accuracy globale, trompeuse à ~88% de bons
   payeurs) — la Régression Logistique a été retenue pour son interprétabilité
   directe, en plus de ses performances comparables aux modèles plus complexes.
5. **Décision à 3 zones** : favorable / à examiner (comité de crédit) / risque
   élevé — l'outil reste une aide à la décision, pas une automatisation totale.
6. **Explicabilité** : SHAP, par dossier (application) et globale (notebook).
7. **Scorecard complémentaire** (inspiré des pratiques bancaires Bâle II, adapté au
   contexte FCFA plutôt qu'importé tel quel) : Weight of Evidence / Information
   Value pour valider le pouvoir discriminant des variables indépendamment du
   modèle, conversion de la probabilité en **score à points (300-900)**, et
   **perte attendue (Expected Loss = PD × LGD × EAD)** en FCFA — avec un LGD qui
   dépend du type de garantie proposée par le client. Ces trois éléments sont
   affichés dans l'application et détaillés dans le notebook (section 6).

## Dictionnaire des variables

| Variable | Description |
|---|---|
| `age`, `sexe`, `zone`, `situation_matrimoniale`, `niveau_education` | Profil socio-démographique |
| `nombre_personnes_a_charge` | Charge familiale |
| `secteur_activite`, `anciennete_activite_annees` | Activité économique |
| `revenu_mensuel_fcfa`, `charges_mensuelles_fcfa` | Situation financière |
| `anciennete_cooperative_mois`, `membre_groupe_solidaire` | Relation avec la coopérative |
| `epargne_solde_moyen_fcfa`, `regularite_epargne` | Comportement d'épargne |
| `nombre_credits_anterieurs`, `taux_remboursement_historique_pct`, `jours_retard_moyen_historique` | Historique de crédit interne |
| `possede_mobile_money`, `frequence_transactions_mm_mois` | Proxy de flux de trésorerie |
| `interroge_bic`, `statut_bic`, `nombre_prets_actifs_autres_institutions`, `encours_credit_autres_institutions_fcfa` | Situation du client auprès du **Bureau d'Information sur le Crédit (BIC)** — dispositif régional UEMOA, BCEAO comme interface, alimenté mensuellement par les banques, autres établissements financiers et SFD/IMF membres. Permet de détecter un surendettement croisé ou un incident de paiement dans une autre institution. |
| `objet_credit`, `montant_credit_demande_fcfa`, `duree_credit_mois`, `garantie` | Caractéristiques de la demande |
| `ratio_endettement` | (charges + mensualité estimée) / revenu |
| `defaut_credit` | **Cible** : 1 = défaut/impayé sévère, 0 = bon payeur |

## Limites et prochaines étapes

- Le dataset est **synthétique** : les performances (F1 ≈ 0,36, ROC-AUC ≈ 0,74)
  sont indicatives et doivent être revalidées sur données réelles.
- Prochaine étape : recueil de dossiers anonymisés auprès d'une Coopérative
  pilote pour recalibrer le générateur et ré-entraîner le modèle (voir la note
  de présentation, section « Feuille de route »).

## Équipe

Samdé — voir `fiche_equipe_Samdé.docx` (dossier de candidature).

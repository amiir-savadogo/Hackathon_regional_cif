# Samdé - Plateforme d'Évaluation de Microcrédit Assistée par IA

Salut ! Voici le dépôt officiel de notre projet **Samdé**, réalisé dans le cadre du **Hackathon National d'Innovation CIF - Projet DigiCoop-WA+** (Thématique 02 : Scoring Microcrédit) au Burkina Faso.

🌐 **Lien de la plateforme en direct (Production)** : [https://creditsur-wa.vercel.app](https://creditsur-wa.vercel.app)

Plutôt que de faire une simple maquette ou un script Python isolé, nous avons pris le parti de construire un **véritable outil métier de bout en bout (CRM)**. L'objectif est d'offrir aux agents de crédit des Coopératives financières ouest-africaines une plateforme moderne, robuste et directement utilisable pour la gestion de leurs dossiers de microcrédit.

## 🏗️ Architecture Technique

Pour garantir que la plateforme soit scalable et maintenable, nous avons opté pour une architecture microservices complète. Le projet est découpé en 3 couches indépendantes :

1. **Frontend (Interface Web)** : Développé en **Angular 18** avec **TailwindCSS**. C'est le tableau de bord de l'agent de crédit (gestion des clients, formulaires, suivi).
2. **Backend (Logique métier & BDD)** : Développé en **Java Spring Boot 4.1**. Il s'occupe des règles de gestion, de la validation des données, de la sécurité (CORS, API REST) et sauvegarde les données dans une base **PostgreSQL**.
3. **Moteur IA (Scoring)** : Développé en **Python (FastAPI + scikit-learn + SHAP)**. Il reçoit les données du backend et renvoie en temps réel une probabilité de défaut de paiement, une zone de décision, un score scorecard et une explication du dossier pour aider l'agent à prendre sa décision.

> **Note d'architecture** : le moteur IA de cette version « produit » est désormais rigoureusement le même modèle que notre prototype de recherche `Samdé` (Régression Logistique + préprocesseur + SHAP, retenue après comparaison avec 4 autres modèles - Random Forest, XGBoost, LightGBM, CatBoost, plus un stacking - optimisés par recherche bayésienne Optuna et évalués sur un protocole train/validation/test à 3 sous-ensembles disjoints, entraîné sur les 30+ variables du dataset synthétique UEMOA ; voir la note de présentation pour le détail). `scripts/02_train_model.py` sauvegarde désormais automatiquement les artefacts à la fois dans `models/` (recherche) et `ai-service/models/` (production) en une seule exécution, pour qu'il soit structurellement impossible que les deux divergent.

---

## 🚀 Guide de Déploiement (Cloud)

Nous avons packagé le code pour qu'il soit très facilement déployable sur des infrastructures cloud modernes (Render, Vercel, Supabase). Voici comment nous avons mis le projet en ligne :

### 1. Base de données (PostgreSQL)
- Nous utilisons une base de données PostgreSQL gérée (sur **Render.com** ou **Supabase**).
- Le lien de connexion (`DB_URL`) ainsi que les identifiants (`DB_USER`, `DB_PASSWORD`) sont passés en variables d'environnement au serveur Java pour des raisons de sécurité.

### 2. Moteur IA (Python)
- Le service Python est hébergé sur **Render.com** (Web Service).
- **Commande de build** : `pip install -r requirements.txt`
- **Commande de lancement** : `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Le modèle (Régression Logistique, retenue après comparaison avec Random Forest, XGBoost, LightGBM, CatBoost et un stacking - optimisation Optuna, voir la note de présentation) a été pré-entraîné par notre équipe Data et est packagé dans `ai-service/models/` (préprocesseur, modèle, fond SHAP, métadonnées) pour des inférences rapides.

### 3. Backend (Java Spring Boot)
- Le backend est également hébergé sur **Render.com**.
- Comme Render ne supporte pas nativement Java de manière simple, nous avons créé un fichier `Dockerfile` à la racine du dossier `backend`. Il compile l'application avec Maven puis la lance de manière optimisée.
- **Variables d'environnement requises** :
  - `DB_URL`, `DB_USER`, `DB_PASSWORD` : Pour se lier à la BDD.
  - `AI_SERVICE_URL` : L'adresse URL publique du service Python déployé à l'étape précédente.

### 4. Frontend (Angular)
- L'interface agent est hébergée sur **Vercel.com**.
- Lors du déploiement, nous indiquons à Vercel que le dossier racine est `frontend`.
- Le dossier de sortie (*Output Directory*) configuré sur Vercel est `dist/frontend/browser` (standard Angular 18+).
- L'URL de production du backend Java est renseignée dans `frontend/src/environments/environment.production.ts`.

---

## 🧪 Partie Data Science (Pour les curieux)

Si vous souhaitez comprendre comment nous avons entraîné le modèle IA, tout se passe dans le dossier `scripts`.

1. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```
2. **Génération du dataset** (4000 dossiers générés sur base de métriques réalistes de la microfinance UEMOA) :
   ```bash
   python scripts/01_generate_dataset.py
   ```
3. **Entraînement et sélection du modèle** (comparaison Régression Logistique / Random Forest / XGBoost / LightGBM / CatBoost / Stacking, recherche d'hyperparamètres Optuna, protocole train/validation/test, calibration du seuil de décision, export SHAP) :
   ```bash
   python scripts/02_train_model.py
   ```
Les artefacts (`preprocessor.pkl`, `best_model.pkl`, `feature_names.pkl`, `shap_background.pkl`, `metadata.json`) sont automatiquement sauvegardés à la fois dans `models/` et `ai-service/models/` par le script lui-même (aucune copie manuelle nécessaire).

---

## 👥 L'équipe DataMaster

Ce projet a été pensé, designé et développé avec passion par l'équipe **DataMaster** pour répondre aux vrais défis de l'inclusion financière en Afrique de l'Ouest.
Pour plus de détails sur l'aspect métier et stratégique, n'hésitez pas à consulter notre note de présentation (`docs_build/Note_Presentation_Scoring_Microcredit.docx`).

# CréditSûr WA — Plateforme d'Évaluation de Microcrédit Assistée par IA

Prototype réalisé par l'équipe **CréditSûr WA** pour le **Hackathon National d'Innovation CIF — Projet DigiCoop-WA+** (Thématique 02 : *Scoring Microcrédit*), Burkina Faso, 4-6 septembre 2026.

Ce projet n'est pas une simple "calculatrice de score", mais un **véritable CRM métier** conçu pour les Coopératives financières (Institutions de Microfinance) d'Afrique de l'Ouest. Il permet la gestion complète du cycle de vie du client, de l'enregistrement de son profil jusqu'à la prise de décision, en s'appuyant sur un moteur d'Intelligence Artificielle.

---

## 🏗️ Architecture du Projet

Le projet a été pensé selon les standards de l'industrie (Microservices) pour garantir la robustesse et l'évolutivité. Il se divise en 3 couches distinctes :

1. **Frontend (Interface Agent)** : Développé en **Angular 18** avec **TailwindCSS**. Il offre une interface moderne, sobre et professionnelle (CRM) adaptée au travail quotidien d'un agent de crédit.
2. **Backend (Logique Métier & Base de Données)** : Développé en **Java Spring Boot 3**. Il expose une API REST, gère la sécurité (CORS) et orchestre la base de données relationnelle via **Hibernate/JPA**.
3. **Moteur IA (Scoring de Risque)** : Développé en **Python (FastAPI + XGBoost)**. Il reçoit les données financières du backend et retourne instantanément une probabilité de défaut de paiement.

---

## 🧪 Partie Data Science (Génération et Entraînement)

Avant de lancer l'application finale, vous pouvez explorer la partie Data Science du projet (génération de données synthétiques et entraînement du modèle).

1. Installez les dépendances Python générales à la racine :
   ```bash
   pip install -r requirements.txt
   ```
2. **Générer le dataset synthétique** (4000 dossiers calibrés sur le contexte ouest-africain) :
   ```bash
   python scripts/01_generate_dataset.py
   ```
3. **Entraîner et comparer les modèles** (Régression Logistique, Random Forest, XGBoost). Le meilleur modèle sera sauvegardé sous format JSON :
   ```bash
   python scripts/02_train_model.py
   ```
*Note : Le modèle final optimisé a déjà été copié dans le dossier `ai-service/modele_xgboost.json` pour la démonstration.*

---

## 🚀 Guide d'installation et de démarrage de la plateforme

Pour lancer l'application CRM complète, vous devez allumer les trois microservices en parallèle. Ouvrez **3 terminaux différents** à la racine de ce projet.

### Terminal 1 : Lancer le Moteur IA (Python)
Ce service tourne sur le port `8000`.
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn main:app --port 8000
```
*Patientez jusqu'à voir : `Application startup complete.`*

### Terminal 2 : Lancer le Backend Métier (Java)
Ce service tourne sur le port `8080`.
```bash
cd backend
./mvnw spring-boot:run
```
*(Sur Windows, utilisez `.\mvnw spring-boot:run`)*
*Patientez jusqu'à voir : `Started MicrocreditApplication in X seconds`*

### Terminal 3 : Lancer l'Interface Utilisateur (Angular)
Ce service tourne sur le port `4200`.
```bash
cd frontend
npm install
npm start
```
*Patientez jusqu'à voir : `Application bundle generation complete.`*

👉 **Une fois les 3 services lancés, ouvrez votre navigateur et allez sur : [http://localhost:4200](http://localhost:4200)**

---

## 🌟 Fonctionnalités Implémentées

- **Tableau de Bord Global** : Suivi des statistiques d'octroi de crédit en temps réel (taux d'approbation, dossiers en étude, clients enregistrés).
- **Gestion des Demandeurs (KYC)** : Création et listage des profils clients (identités, ancienneté, secteurs d'activité). Contrôle anti-doublon intégré.
- **Formulaire de Crédit Intelligent** : Calcul instantané des indicateurs financiers locaux (Reste à vivre, Ratio d'endettement, Mensualité estimée).
- **Décision Assistée par l'IA** : Intégration en temps réel du modèle XGBoost, affichant une probabilité précise de défaut et une recommandation catégorisée (APPROUVÉ, À L'ÉTUDE, REJETÉ).
- **Historisation** : Traçabilité complète des demandes pour un même client.

---

## 🧠 Le Modèle d'Intelligence Artificielle

Le moteur IA repose sur un algorithme **XGBoost Classifier**, particulièrement adapté aux données tabulaires et résistant aux déséquilibres de classes.
- Le modèle ne se base **pas** sur des variables occidentales (cartes de crédit), mais sur des données de terrain ouest-africaines (revenus informels, charges, ancienneté).
- Le modèle a été converti au format JSON (`modele_xgboost.json`) pour garantir une inférence ultra-rapide (< 50ms) en production via FastAPI.

## 👥 L'équipe

**CréditSûr WA**
Pour plus d'informations sur notre vision métier, merci de consulter notre dossier de candidature officiel (`fiche_equipe_CreditSurWA.docx`).

# Image du moteur de scoring IA (FastAPI + scikit-learn + SHAP).
# Contexte de build : ./ai-service (contient déjà models/, produit par
# scripts/02_train_model.py à la racine - voir docker-compose.yml).
FROM python:3.12-slim

WORKDIR /app

# Étape séparée pour profiter du cache Docker : requirements.txt ne change
# pas à chaque modification de main.py, pas besoin de tout réinstaller.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# --host 0.0.0.0 indispensable en conteneur : sans ça, uvicorn n'écoute que
# sur localhost DANS le conteneur et n'est jamais joignable depuis l'extérieur.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

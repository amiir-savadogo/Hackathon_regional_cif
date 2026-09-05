# -*- coding: utf-8 -*-
"""
generer_base_csv.py
===================
Générateur de la base de données relationnelle bancaire CIF au format CSV
(Confédération des Institutions Financières - Microfinance Ouest-Africaine).

Génère 4 fichiers CSV complets et structurés dans data/ :
  1. data/societaires.csv        : Profil KYC, N° CNIB, Expiration, Type Compte, Logement, Statut, Parts Sociales
  2. data/transactions.csv       : Flux Dépôts, Retraits, Mobile Money par sociétaire
  3. data/historique_credits.csv : Prêts passés, Taux de remboursement, Retards
  4. data/base_complete_scoring.csv : Table consolidée pour le moteur d'IA et le scoring

Usage :
  python scripts/generer_base_csv.py
"""

import os
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

# Fixer la graine pour reproductibilité
RNG = np.random.default_rng(2026)
N_SOCIETAIRES = 1000  # Nombre de sociétaires CIF
DATE_JOUR = datetime(2026, 9, 1)

# -----------------------------------------------------------------------------
# 1. RÉFÉRENTIELS ET DONNÉES GÉOGRAPHIQUES CIF (BURKINA FASO & UEMOA)
# -----------------------------------------------------------------------------

PRENOMS_FEMMES = [
    "Aminata", "Fatimata", "Mariam", "Aïcha", "Salimata", "Rasmata",
    "Kadidiatou", "Zenabou", "Safiatou", "Alimata", "Nafissatou", "Fanta",
    "Adjaratou", "Bintou", "Djénéba", "Minata", "Assétou", "Maimouna",
    "Habibou", "Kadiatou", "Balkissa", "Salamatou", "Clarisse", "Bibata",
    "Korotoumou", "Sita", "Hawa", "Awa", "Ténin", "Zalissa"
]

PRENOMS_HOMMES = [
    "Amadou", "Ibrahim", "Abdoul", "Ousmane", "Boureima", "Souleymane",
    "Moussa", "Yacouba", "Issouf", "Harouna", "Seydou", "Mahamadi",
    "Adama", "Daouda", "Noufou", "Ali", "Hamidou", "Lassina", "Idrissa",
    "Mamadou", "Rasmané", "Saidou", "Pascal", "Kassoum", "Drissa",
    "Salif", "Cheick", "Abdoulaye", "Tidiane", "Modibo"
]

NOMS_FAMILLE = [
    "Ouédraogo", "Sawadogo", "Zongo", "Kaboré", "Compaoré", "Traoré",
    "Diallo", "Cissé", "Sankara", "Bamba", "Sanogo", "Barro", "Guira",
    "Ilboudo", "Nikiéma", "Tapsoba", "Tiendrébéogo", "Koné", "Coulibaly",
    "Barry", "Diarra", "Somé", "Dabiré", "Bationo", "Kinda", "Yaméogo",
    "Savadogo", "Ouattara", "Badolo", "Zoungrana", "Kiemdé"
]

LOCALITES = [
    {"pays": "Burkina Faso", "region": "Centre", "ville": "Ouagadougou", "quartiers": ["Gounghin", "Karpala", "Patte d'Oie", "Dassasgho", "Tampouy", "Pissy", "Cissin", "Wemtenga"], "agence": "Ouaga 1 - Siège Principal"},
    {"pays": "Burkina Faso", "region": "Centre", "ville": "Ouagadougou", "quartiers": ["Somgandé", "Tanghin", "Nonsin", "Larlé", "Kamboinsin", "Saaba"], "agence": "Ouaga 2 - Gounghin / Tampouy"},
    {"pays": "Burkina Faso", "region": "Hauts-Bassins", "ville": "Bobo-Dioulasso", "quartiers": ["Accart-Ville", "Belle-Ville", "Sarfalao", "Koko", "Bindougousso", "Bolomakoté"], "agence": "Bobo-Dioulasso - Marché Central"},
    {"pays": "Burkina Faso", "region": "Centre-Ouest", "ville": "Koudougou", "quartiers": ["Secteur 1 (Centre)", "Secteur 3 (Burkina)", "Secteur 6", "Palogo"], "agence": "Koudougou - Agence Centre"},
    {"pays": "Burkina Faso", "region": "Nord", "ville": "Ouahigouya", "quartiers": ["Secteur 2", "Secteur 5", "Grand Marché", "Aéroport"], "agence": "Ouahigouya - Grand Marché"},
    {"pays": "Burkina Faso", "region": "Cascades", "ville": "Banfora", "quartiers": ["Tatana", "Bounouna", "Secteur 7", "Marché"], "agence": "Banfora - Agence Cascades"},
    {"pays": "Burkina Faso", "region": "Centre-Est", "ville": "Tenkodogo", "quartiers": ["Secteur 2", "Secteur 4", "Centre-Ville"], "agence": "Tenkodogo - Agence CIF"}
]

ACTIVITES_SECTEURS = [
    {"activite": "Vente de vivriers & condiments au marché", "secteur": "Commerce de détail"},
    {"activite": "Boutique d'alimentation générale & divers", "secteur": "Commerce de détail"},
    {"activite": "Maraîchage (tomates, oignons, choux)", "secteur": "Agriculture"},
    {"activite": "Céréaliculture (maïs, mil, sorgho)", "secteur": "Agriculture"},
    {"activite": "Embouche ovine & caprine périurbaine", "secteur": "Élevage"},
    {"activite": "Aviculture & production d'œufs", "secteur": "Élevage"},
    {"activite": "Atelier de couture & confection tissu Faso Danfani", "secteur": "Artisanat"},
    {"activite": "Menuiserie bois & métallique", "secteur": "Artisanat"},
    {"activite": "Restauration / Maquis / Vente de mets locaux", "secteur": "Restauration & Alimentation"},
    {"activite": "Transformation agroalimentaire (soumbala, jus locaux)", "secteur": "Transformation & Agro-industrie"},
    {"activite": "Transport en tricycle / Taxi urbain", "secteur": "Transport & Logistique"},
    {"activite": "Quincaillerie & vente de matériaux de construction", "secteur": "Commerce général"}
]

# -----------------------------------------------------------------------------
# 2. GÉNÉRATION DES SOCIÉTAIRES
# -----------------------------------------------------------------------------

def generer_societaires(n=N_SOCIETAIRES):
    print(f"[*] 1/4 - Génération des {n} sociétaires CIF...")
    
    data_societaires = []
    
    for i in range(n):
        num_compte = f"CPT-{i+1:04d}"
        genre = "Femme" if RNG.random() < 0.58 else "Homme"
        
        nom = RNG.choice(NOMS_FAMILLE)
        prenom = RNG.choice(PRENOMS_FEMMES) if genre == "Femme" else RNG.choice(PRENOMS_HOMMES)
        
        # Âge
        age = int(RNG.integers(19, 66))
        annee_naiss = DATE_JOUR.year - age
        mois_naiss = int(RNG.integers(1, 13))
        jour_naiss = int(RNG.integers(1, 28))
        date_naissance = f"{annee_naiss:04d}-{mois_naiss:02d}-{jour_naiss:02d}"
        
        # N° CNIB et Expiration
        num_cnib = f"B{int(RNG.integers(10000000, 99999999))}"
        jours_validite = int(RNG.integers(180, 3650))
        date_expiration_cnib = (DATE_JOUR + timedelta(days=jours_validite)).strftime("%Y-%m-%d")
        
        # Contact et Email
        prefixe_tel = RNG.choice(["+226 70", "+226 76", "+226 07", "+226 64", "+226 55", "+226 78"])
        contact = f"{prefixe_tel} {RNG.integers(10, 99)} {RNG.integers(10, 99)} {RNG.integers(10, 99)}"
        
        domaine_mail = RNG.choice(["gmail.com", "yahoo.fr", "cif-client.bf", "hotmail.com"])
        prenom_clean = prenom.lower().replace("ï", "i").replace("é", "e").replace("è", "e").replace(" ", "")
        nom_clean = nom.lower().replace("é", "e").replace("è", "e").replace(" ", "")
        mail = f"{prenom_clean}.{nom_clean}{RNG.integers(1, 99)}@{domaine_mail}"
        
        # Localisation
        loc = RNG.choice(LOCALITES)
        pays = loc["pays"]
        region = loc["region"]
        ville = loc["ville"]
        quartier = RNG.choice(loc["quartiers"])
        adresse = f"{quartier}, Secteur {RNG.integers(1, 30)}, Rue {RNG.integers(10, 99)}"
        agence = loc["agence"]
        
        # Démographie
        situation_matrimoniale = RNG.choice(["Marié(e)", "Célibataire", "Veuf(ve)", "Divorcé(e)"], p=[0.68, 0.18, 0.09, 0.05])
        personnes_charge = int(RNG.choice([0, 1, 2, 3, 4, 5, 6, 7], p=[0.05, 0.12, 0.22, 0.26, 0.18, 0.10, 0.05, 0.02]))
        niveau_education = RNG.choice(["Aucun / Alphabétisé", "Primaire", "Secondaire", "Supérieur"], p=[0.32, 0.38, 0.22, 0.08])
        
        # Activité
        act = RNG.choice(ACTIVITES_SECTEURS)
        activite = act["activite"]
        secteur_activite = act["secteur"]
        anciennete_activite_annees = int(RNG.integers(1, min(25, age - 17)))
        
        # Date adhésion CIF
        mois_anciennete = int(RNG.integers(6, 120))
        date_creation = (DATE_JOUR - timedelta(days=mois_anciennete * 30)).strftime("%Y-%m-%d")
        
        # Revenus & Charges (FCFA)
        if "Commerce" in secteur_activite:
            rev = int(RNG.integers(120_000, 1_600_000))
        elif "Agriculture" in secteur_activite:
            rev = int(RNG.integers(80_000, 1_100_000))
        elif "Élevage" in secteur_activite:
            rev = int(RNG.integers(95_000, 1_350_000))
        elif "Transport" in secteur_activite:
            rev = int(RNG.integers(140_000, 1_800_000))
        else:
            rev = int(RNG.integers(75_000, 850_000))
        revenu_mensuel = int(round(rev, -3))
        charges_mensuelles = int(round(revenu_mensuel * RNG.uniform(0.35, 0.65), -3))
        solde_actuel = int(round(revenu_mensuel * RNG.uniform(0.5, 4.5), -3))
        
        # Données spécifiques compte & logement
        type_compte = RNG.choice(["Compte Épargne Sociétaire", "Compte Tontine Digitale", "Compte Courant Micro-Entreprise"], p=[0.65, 0.22, 0.13])
        statut_compte = RNG.choice(["Actif", "Dormant", "Bloqué"], p=[0.92, 0.06, 0.02])
        parts_sociales = int(RNG.choice([10_000, 20_000, 25_000, 50_000], p=[0.45, 0.35, 0.12, 0.08]))
        type_logement = RNG.choice(["Propriétaire", "Locataire", "Logement familial / Hébergé"], p=[0.42, 0.38, 0.20])
        
        data_societaires.append({
            "Numéro Compte": num_compte,
            "Type de Compte": type_compte,
            "Statut du Compte": statut_compte,
            "Parts Sociales (FCFA)": parts_sociales,
            "Nom": nom,
            "Prénom": prenom,
            "Date de Naissance": date_naissance,
            "Âge": age,
            "Genre": genre,
            "N° CNIB": num_cnib,
            "Date Expiration CNIB": date_expiration_cnib,
            "Contact Téléphonique": contact,
            "Email": mail,
            "Pays": pays,
            "Région": region,
            "Ville": ville,
            "Adresse Complète": adresse,
            "Type de Logement": type_logement,
            "Agence CIF": agence,
            "Situation Matrimoniale": situation_matrimoniale,
            "Personnes en Charge": personnes_charge,
            "Niveau d'Éducation": niveau_education,
            "Activité": activite,
            "Secteur d'Activité": secteur_activite,
            "Ancienneté Activité (années)": anciennete_activite_annees,
            "Date d'Adhésion CIF": date_creation,
            "Ancienneté CIF (mois)": mois_anciennete,
            "Revenu Mensuel (FCFA)": revenu_mensuel,
            "Charges Mensuelles (FCFA)": charges_mensuelles,
            "Solde Épargne Actuel (FCFA)": solde_actuel
        })
        
    return pd.DataFrame(data_societaires)

# -----------------------------------------------------------------------------
# 3. GÉNÉRATION DES TRANSACTIONS
# -----------------------------------------------------------------------------

def generer_transactions(df_societaires):
    print("[*] 2/4 - Génération des flux de transactions (Dépôts, Retraits, Mobile Money)...")
    
    transactions = []
    id_tx = 1
    
    types_tx = [
        ("Dépôt Guichet Agence", "CREDIT", 0.35),
        ("Retrait Guichet Agence", "DEBIT", 0.20),
        ("Dépôt Mobile Money (Orange/Moov)", "CREDIT", 0.28),
        ("Retrait Mobile Money", "DEBIT", 0.12),
        ("Cotisation Tontine / Épargne programmée", "CREDIT", 0.05)
    ]
    
    for _, soc in df_societaires.iterrows():
        num_compte = soc["Numéro Compte"]
        rev = soc["Revenu Mensuel (FCFA)"]
        nb_tx = int(RNG.integers(6, 25))
        
        solde_courant = soc["Solde Épargne Actuel (FCFA)"] * 0.4
        
        for _ in range(nb_tx):
            jours_ecoules = int(RNG.integers(1, min(720, soc["Ancienneté CIF (mois)"] * 30)))
            date_tx = (DATE_JOUR - timedelta(days=jours_ecoules)).strftime("%Y-%m-%d %H:%M")
            
            t_choice = RNG.choice(len(types_tx), p=[t[2] for t in types_tx])
            libelle, sens, _ = types_tx[t_choice]
            
            if sens == "CREDIT":
                montant = int(round(RNG.uniform(0.1, 0.8) * rev, -3))
                montant = max(5_000, montant)
                solde_courant += montant
            else:
                montant = int(round(RNG.uniform(0.05, 0.5) * rev, -3))
                montant = min(montant, max(5_000, int(solde_courant * 0.7)))
                solde_courant = max(1_000, solde_courant - montant)
                
            canal = "Mobile Money" if "Mobile" in libelle else ("Guichet" if "Guichet" in libelle else "Automatique")
            
            transactions.append({
                "ID Transaction": f"TX-{id_tx:06d}",
                "Numéro Compte": num_compte,
                "Nom Sociétaire": f"{soc['Prénom']} {soc['Nom']}",
                "Date & Heure": date_tx,
                "Type Opération": libelle,
                "Sens": sens,
                "Montant (FCFA)": montant,
                "Solde Après Opération (FCFA)": int(solde_courant),
                "Canal": canal,
                "Agence": soc["Agence CIF"]
            })
            id_tx += 1
            
    return pd.DataFrame(transactions)

# -----------------------------------------------------------------------------
# 4. GÉNÉRATION DE L'HISTORIQUE DE CRÉDITS
# -----------------------------------------------------------------------------

def generer_historique_credits(df_societaires):
    print("[*] 3/4 - Génération des historiques de crédits et dossiers de prêts...")
    
    credits_list = []
    id_credit = 1
    
    objets = [
        "Achat stock marchandises vivriers",
        "Achat intrants & engrais agricoles",
        "Embouche ovine Tabaski",
        "Acquisition machine couture industrielle",
        "Fonds de roulement alimentation",
        "Matériel de soudure et menuiserie",
        "Agrandissement magasin & rayonnage"
    ]
    
    garanties = [
        "Caution solidaire de groupe (5 membres)",
        "Gage sur stock de marchandises",
        "Nantissement équipement professionnel",
        "Caution individuelle d'un tiers",
        "Hypothèque foncière"
    ]
    
    for _, soc in df_societaires.iterrows():
        num_compte = soc["Numéro Compte"]
        anc = soc["Ancienneté CIF (mois)"]
        rev = soc["Revenu Mensuel (FCFA)"]
        
        if anc < 12:
            nb_credits = RNG.choice([0, 1], p=[0.75, 0.25])
        elif anc < 36:
            nb_credits = RNG.choice([0, 1, 2], p=[0.30, 0.50, 0.20])
        else:
            nb_credits = RNG.choice([1, 2, 3, 4], p=[0.25, 0.45, 0.20, 0.10])
            
        for c_idx in range(nb_credits):
            montant = int(round(rev * RNG.uniform(1.2, 3.5), -4))
            montant = int(np.clip(montant, 75_000, 3_500_000))
            duree = int(RNG.choice([3, 6, 9, 12, 18, 24]))
            
            retard_moyen = int(RNG.choice([0, 0, 0, 3, 7, 14, 28, 45], p=[0.55, 0.15, 0.10, 0.08, 0.05, 0.04, 0.02, 0.01]))
            if retard_moyen == 0:
                taux_remb = 100.0
                statut = "Soldé sans incident"
            elif retard_moyen <= 7:
                taux_remb = float(RNG.choice([100.0, 98.0, 95.0]))
                statut = "Soldé avec retards mineurs"
            else:
                taux_remb = float(RNG.choice([92.0, 85.0, 78.0]))
                statut = "Soldé avec contentieux / rééchelonné"
                
            date_octroi = (DATE_JOUR - timedelta(days=int(anc * 25) - (c_idx * 180))).strftime("%Y-%m-%d")
            
            credits_list.append({
                "ID Crédit": f"CRD-{id_credit:05d}",
                "Numéro Compte": num_compte,
                "Nom Sociétaire": f"{soc['Prénom']} {soc['Nom']}",
                "Date Octroi": date_octroi,
                "Montant Prêt (FCFA)": montant,
                "Durée (mois)": duree,
                "Objet du Prêt": RNG.choice(objets),
                "Type de Garantie": RNG.choice(garanties),
                "Taux Remboursement Interne (%)": taux_remb,
                "Jours Retard Moyen": retard_moyen,
                "Statut Prêt": statut,
                "Agence": soc["Agence CIF"]
            })
            id_credit += 1
            
    return pd.DataFrame(credits_list)

# -----------------------------------------------------------------------------
# 5. CONSOLIDATION VUE COMPLETE MACHINE LEARNING / SCORING
# -----------------------------------------------------------------------------

def consolider_vue_scoring(df_soc, df_credits, df_tx):
    print("[*] 4/4 - Consolidation de la table globale pour le scoring IA...")
    
    agg_cred = df_credits.groupby("Numéro Compte").agg(
        Nb_Credits_Anterieurs=("ID Crédit", "count"),
        Taux_Remboursement_Moyen=("Taux Remboursement Interne (%)", "mean"),
        Jours_Retard_Moyen=("Jours Retard Moyen", "mean"),
        Montant_Total_Emprunte_Passe=("Montant Prêt (FCFA)", "sum")
    ).reset_index()
    
    agg_tx = df_tx.groupby("Numéro Compte").agg(
        Total_Transactions=("ID Transaction", "count"),
        Volume_Depots_FCFA=("Montant (FCFA)", lambda x: x[df_tx.loc[x.index, "Sens"] == "CREDIT"].sum()),
        Volume_Retraits_FCFA=("Montant (FCFA)", lambda x: x[df_tx.loc[x.index, "Sens"] == "DEBIT"].sum()),
        Tx_Mobile_Money=("Canal", lambda x: (x == "Mobile Money").sum())
    ).reset_index()
    
    df_merged = df_soc.merge(agg_cred, on="Numéro Compte", how="left")
    df_merged = df_merged.merge(agg_tx, on="Numéro Compte", how="left")
    
    df_merged["Nb_Credits_Anterieurs"] = df_merged["Nb_Credits_Anterieurs"].fillna(0).astype(int)
    df_merged["Taux_Remboursement_Moyen"] = df_merged["Taux_Remboursement_Moyen"].fillna(100.0).round(1)
    df_merged["Jours_Retard_Moyen"] = df_merged["Jours_Retard_Moyen"].fillna(0).round(1)
    df_merged["Montant_Total_Emprunte_Passe"] = df_merged["Montant_Total_Emprunte_Passe"].fillna(0).astype(int)
    df_merged["Total_Transactions"] = df_merged["Total_Transactions"].fillna(0).astype(int)
    df_merged["Volume_Depots_FCFA"] = df_merged["Volume_Depots_FCFA"].fillna(0).astype(int)
    df_merged["Volume_Retraits_FCFA"] = df_merged["Volume_Retraits_FCFA"].fillna(0).astype(int)
    df_merged["Tx_Mobile_Money"] = df_merged["Tx_Mobile_Money"].fillna(0).astype(int)
    
    montants_nouveaux = []
    scores_ia = []
    decisions = []
    cibles_defaut = []
    
    for _, row in df_merged.iterrows():
        rev = row["Revenu Mensuel (FCFA)"]
        charges = row["Charges Mensuelles (FCFA)"]
        epargne = row["Solde Épargne Actuel (FCFA)"]
        taux_remb = row["Taux_Remboursement_Moyen"]
        retard = row["Jours_Retard_Moyen"]
        nb_cred = row["Nb_Credits_Anterieurs"]
        
        m_pret = int(round(rev * RNG.uniform(1.5, 3.8), -4))
        m_pret = int(np.clip(m_pret, 100_000, 3_500_000))
        montants_nouveaux.append(m_pret)
        
        pts = 600
        ratio_ep = epargne / max(1, m_pret)
        pts += min(75, int(ratio_ep * 110))
        
        if taux_remb >= 98.0 and nb_cred > 0:
            pts += 50
        elif taux_remb < 88.0 or retard > 15:
            pts -= 95
            
        reste = rev - charges
        echeance = m_pret / 12
        if (echeance / max(1, reste)) < 0.40:
            pts += 45
        elif (echeance / max(1, reste)) > 0.80:
            pts -= 85
            
        if row["Tx_Mobile_Money"] >= 8:
            pts += 25
            
        pts += int(RNG.integers(-20, 21))
        score = int(np.clip(pts, 320, 890))
        scores_ia.append(score)
        
        if score >= 680:
            decisions.append("Accord Favorable")
            cibles_defaut.append(1 if RNG.random() < 0.035 else 0)
        elif score >= 550:
            decisions.append("À Examiner")
            cibles_defaut.append(1 if RNG.random() < 0.15 else 0)
        else:
            decisions.append("Risque Élevé")
            cibles_defaut.append(1 if RNG.random() < 0.70 else 0)
            
    df_merged["Montant Nouveau Prêt Sollicité (FCFA)"] = montants_nouveaux
    df_merged["Score IA (300-900)"] = scores_ia
    df_merged["Décision Scoring CIF"] = decisions
    df_merged["Cible Défaut (0/1)"] = cibles_defaut
    
    return df_merged

# -----------------------------------------------------------------------------
# 6. EXPORT DE LA BASE DE DONNÉES JSON CIF
# -----------------------------------------------------------------------------

def exporter_base_societaires(df_soc, df_tx, df_cred, df_consolide):
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Préparation des objets sociétaires structurés
    frontend_soc = []
    for idx, row in df_soc.iterrows():
        frontend_soc.append({
            "id": idx + 1,
            "numeroCompte": str(row["Numéro Compte"]),
            "typeCompte": str(row["Type de Compte"]),
            "statutCompte": str(row["Statut du Compte"]),
            "partsSocialesFcfa": int(row["Parts Sociales (FCFA)"]),
            "nom": str(row["Nom"]),
            "prenom": str(row["Prénom"]),
            "dateNaissance": str(row["Date de Naissance"]),
            "age": int(row["Âge"]),
            "sexe": str(row["Genre"]),
            "numeroCnib": str(row["N° CNIB"]),
            "dateExpirationCnib": str(row["Date Expiration CNIB"]),
            "telephone": str(row["Contact Téléphonique"]),
            "email": str(row["Email"]),
            "pays": str(row["Pays"]),
            "region": str(row["Région"]),
            "ville": str(row["Ville"]),
            "adresse": str(row["Adresse Complète"]),
            "typeLogement": str(row["Type de Logement"]),
            "agence": str(row["Agence CIF"]),
            "situationMatrimoniale": str(row["Situation Matrimoniale"]),
            "nombrePersonnesACharge": int(row["Personnes en Charge"]),
            "niveauEducation": str(row["Niveau d'Éducation"]),
            "activite": str(row["Activité"]),
            "secteurActivite": str(row["Secteur d'Activité"]),
            "ancienneteActiviteAnnees": int(row["Ancienneté Activité (années)"]),
            "dateCreation": str(row["Date d'Adhésion CIF"]),
            "ancienneteCooperativeMois": int(row["Ancienneté CIF (mois)"]),
            "revenuMensuelFcfa": int(row["Revenu Mensuel (FCFA)"]),
            "chargesMensuellesFcfa": int(row["Charges Mensuelles (FCFA)"]),
            "soldeEpargneActuelFcfa": int(row["Solde Épargne Actuel (FCFA)"]),
            "demandes": []
        })
        
    import json
    
    # A) Export dans data/societaires.json
    with open(os.path.join(output_dir, "societaires.json"), "w", encoding="utf-8") as f:
        json.dump(frontend_soc, f, ensure_ascii=False, indent=2)
        
    # B) Export direct dans le Frontend (public & source)
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
    if os.path.exists(frontend_dir):
        public_data_dir = os.path.join(frontend_dir, "public", "data")
        os.makedirs(public_data_dir, exist_ok=True)
        with open(os.path.join(public_data_dir, "societaires.json"), "w", encoding="utf-8") as f:
            json.dump(frontend_soc, f, ensure_ascii=False, indent=2)
            
        app_data_dir = os.path.join(frontend_dir, "src", "app", "data")
        os.makedirs(app_data_dir, exist_ok=True)
        with open(os.path.join(app_data_dir, "societaires-data.ts"), "w", encoding="utf-8") as f:
            f.write("// Base de données relationnelle CIF générée automatiquement\n")
            f.write("import { Client } from '../models/client.model';\n\n")
            f.write("export const SOCIETAIRES_CIF_BASE: Client[] = ")
            f.write(json.dumps(frontend_soc, ensure_ascii=False, indent=2))
            f.write(";\n")

    print("\n" + "="*75)
    print(" [SUCCÈS] BASE DE DONNÉES CIF INITIALISÉE AVEC SUCCÈS")
    print("="*75)
    print(f"  • {len(frontend_soc):,} profils sociétaires prêts dans l'application web")
    print(f"  • Données injectées dans : frontend/public/data/societaires.json")
    print(f"  • Données injectées dans : frontend/src/app/data/societaires-data.ts")
    print("="*75 + "\n")

if __name__ == "__main__":
    print("===========================================================================")
    print(" GÉNERATION DE LA BASE DE DONNÉES DES SOCIÉTAIRES CIF ")
    print("===========================================================================")
    df_soc = generer_societaires(N_SOCIETAIRES)
    df_tx = generer_transactions(df_soc)
    df_cred = generer_historique_credits(df_soc)
    df_consolide = consolider_vue_scoring(df_soc, df_cred, df_tx)
    exporter_base_societaires(df_soc, df_tx, df_cred, df_consolide)

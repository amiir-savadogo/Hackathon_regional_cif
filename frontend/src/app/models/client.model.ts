export interface Client {
  id?: number;
  nom: string;
  prenom: string;
  age: number;
  telephone?: string;
  secteurActivite?: string;
  ancienneteActiviteAnnees: number;

  // Profil socio-démographique (utilisé par le moteur de scoring IA)
  sexe?: 'Femme' | 'Homme' | string;
  zone?: 'Urbaine' | 'Semi-urbaine' | 'Rurale' | string;
  situationMatrimoniale?: string;
  niveauEducation?: 'Aucun' | 'Primaire' | 'Secondaire' | 'Supérieur' | string;
  nombrePersonnesACharge?: number;

  dateCreation?: string;
  demandes?: DemandeCredit[];
}

export interface FacteurExplicatif {
  variable: string;
  contribution: number;
  sens: 'AUGMENTE_RISQUE' | 'REDUIT_RISQUE' | string;
}

export interface DemandeCredit {
  id?: number;
  client?: Client;

  // Données financières de base
  revenuMensuelFcfa: number;
  chargesMensuellesFcfa: number;

  // Relation avec la coopérative
  ancienneteCooperativeMois?: number;
  membreGroupeSolidaire?: boolean;
  epargneSoldeMoyenFcfa?: number;
  regulariteEpargne?: 'Régulière' | 'Irrégulière' | 'Aucune épargne' | string;

  // Historique de crédit interne
  nombreCreditsAnterieurs?: number;
  tauxRemboursementHistoriquePct?: number | null;
  joursRetardMoyenHistorique?: number | null;

  // Mobile Money
  possedeMobileMoney?: boolean;
  frequenceTransactionsMmMois?: number;

  // Bureau d'Information sur le Crédit (BIC)
  interrogeBic?: boolean;
  statutBic?: string;
  nombrePretsActifsAutresInstitutions?: number;
  encoursCreditAutresInstitutionsFcfa?: number;

  // Demande de crédit
  objetCredit?: string;
  montantDemandeFcfa: number;
  dureeMois: number;
  garantie?: string;

  // Résultat du moteur IA
  scoreRisque?: number;               // probabilité de défaut en %, 0-100
  probaDefaut?: number;               // probabilité de défaut brute, 0-1
  zoneDecision?: 'ACCORD_FAVORABLE' | 'A_EXAMINER' | 'RISQUE_ELEVE' | string;
  scoreCredit?: number;               // score scorecard 300-900
  perteAttendueFcfa?: number;         // Expected Loss
  ratioEndettement?: number;
  explicationJson?: string;           // facteurs SHAP sérialisés (parser avec JSON.parse)

  statut?: 'APPROUVE' | 'REJETE' | 'A_L_ETUDE' | 'ERREUR_IA' | string;
  dateCreation?: string;
}

export interface DashboardStats {
  totalClients: number;
  totalDemandes: number;
  approuvees: number;
  rejetees: number;
  enEtude: number;
}

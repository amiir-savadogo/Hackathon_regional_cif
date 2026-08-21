export interface Client {
  id?: number;
  nom: string;
  prenom: string;
  age: number;
  telephone?: string;
  secteurActivite?: string;
  ancienneteActiviteAnnees: number;
  dateCreation?: string;
  demandes?: DemandeCredit[];
}

export interface DemandeCredit {
  id?: number;
  client?: Client;
  revenuMensuelFcfa: number;
  chargesMensuellesFcfa: number;
  montantDemandeFcfa: number;
  dureeMois: number;
  scoreRisque?: number;
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

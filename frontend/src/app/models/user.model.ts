export interface AgentRole {
  id: string;
  code: string;
  label: string;
  description: string;
  badgeColor: string;
  dateCreation: string;
}

export interface AgentUser {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string;
  roleCode: string;
  roleLabel: string;
  agence: string;
  dateCreation: string;
  telephone?: string;
  avatarColor?: string;
  actif: boolean;
}

export interface AgenceCIF {
  id: string;
  nom: string;
  code: string;
  pays: string;
  ville: string;
  region: string;
  telephone?: string;
  adresse?: string;
  dateCreation: string;
}

export interface CorbeilleItem {
  id: string;
  type: 'ROLE' | 'AGENT' | 'AGENCE' | 'OBJET_CREDIT' | 'GARANTIE' | 'CATEGORIE';
  typeLabel: string;
  title: string;
  details: string;
  data: any;
  dateSuppression: string;
  delaiJours: number; // Ex: 30 jours avant purge automatique
}

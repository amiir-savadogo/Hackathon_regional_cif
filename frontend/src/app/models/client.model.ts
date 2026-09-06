export interface Client {
  id?: number;
  numeroCompte?: string;
  typeCompte?: string;
  statutCompte?: 'Actif' | 'Dormant' | 'Bloqué' | string;
  partsSocialesFcfa?: number;
  nom: string;
  prenom: string;
  age: number;
  dateNaissance?: string;
  numeroCnib?: string;
  dateExpirationCnib?: string;
  telephone?: string;
  email?: string;
  pays?: string;
  region?: string;
  ville?: string;
  adresse?: string;
  typeLogement?: 'Propriétaire' | 'Locataire' | 'Logement familial / Hébergé' | string;
  agence?: string;
  secteurActivite?: string;
  activite?: string;
  ancienneteActiviteAnnees: number;
  dateCreation?: string;
  ancienneteCooperativeMois?: number;
  revenuMensuelFcfa?: number;
  chargesMensuellesFcfa?: number;
  soldeEpargneActuelFcfa?: number;

  // Profil socio-démographique (utilisé par le moteur de scoring IA)
  sexe?: 'Femme' | 'Homme' | string;
  zone?: 'Urbaine' | 'Semi-urbaine' | 'Rurale' | string;
  situationMatrimoniale?: string;
  niveauEducation?: 'Aucun' | 'Primaire' | 'Secondaire' | 'Supérieur' | string;
  nombrePersonnesACharge?: number;

  // --- Données comportementales connues de la banque (pré-remplissage du wizard,
  //     source : data/societaires_complet.json). Toutes optionnelles. ---
  sousSecteurActivite?: string;
  saisonaliteActivite?: boolean;
  indiceVulnerabiliteZone?: number;
  nombreCreditsAnterieurs?: number;
  tauxRemboursementHistoriquePct?: number | null;
  joursRetardMoyenHistorique?: number | null;
  montantTotalEmprunteFcfa?: number;
  delaiUtilisationCreditJours?: number | null;
  totalTransactions?: number;
  volumeDepotsFcfa?: number;
  volumeRetraitsFcfa?: number;
  txMobileMoney?: number;
  possedeMobileMoney?: boolean;
  frequenceTransactionsMmMois?: number;
  mmAncienneteCompteMois?: number | null;
  mmSoldeMoyenFcfa?: number;
  mmFluxEntrantsMensuelFcfa?: number;
  nombreComptesBancaires?: number;
  typeComptePrincipal?: string;
  soldeCompteBancaireFcfa?: number;
  nombreRejetsPrelevementsCheques12m?: number;

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

  // Activité (contexte porté avec le dossier pour tracer ce qui a été scoré)
  sousSecteurActivite?: string;
  saisonaliteActivite?: boolean;

  // Relation avec la coopérative
  ancienneteCooperativeMois?: number;
  membreGroupeSolidaire?: boolean;
  epargneSoldeMoyenFcfa?: number;
  regulariteEpargne?: 'Régulière' | 'Irrégulière' | 'Aucune épargne' | string;

  // Historique de crédit interne
  nombreCreditsAnterieurs?: number;
  tauxRemboursementHistoriquePct?: number | null;
  joursRetardMoyenHistorique?: number | null;
  montantTotalEmprunteFcfa?: number;
  delaiUtilisationCreditJours?: number | null;

  // Agrégats de transactions (vue consolidée CIF)
  totalTransactions?: number;
  volumeDepotsFcfa?: number;
  volumeRetraitsFcfa?: number;
  txMobileMoney?: number;

  // Mobile Money (enrichi)
  possedeMobileMoney?: boolean;
  frequenceTransactionsMmMois?: number;
  mmAncienneteCompteMois?: number | null;
  mmAncienneteSimMois?: number | null;
  mmNombreMoisActifs12m?: number | null;
  mmVolumeTransactionsMensuelFcfa?: number;
  mmFluxEntrantsMensuelFcfa?: number;
  mmFluxSortantsMensuelFcfa?: number;
  mmMontantRemboursementsMmFcfa?: number;
  mmSoldeMoyenFcfa?: number;
  mmSoldeMinimumFcfa?: number;
  mmEvolutionSoldePct?: number | null;
  mmVolatiliteFluxPct?: number | null;
  mmRatioDepensesCreditAppelDataPct?: number | null;

  // Comptes bancaires classiques
  nombreComptesBancaires?: number;
  typeComptePrincipal?: string;
  soldeCompteBancaireFcfa?: number;
  fluxDepotsBancairesMensuelFcfa?: number;
  fluxRetraitsBancairesMensuelFcfa?: number;
  nombreRejetsPrelevementsCheques12m?: number;

  // Bureau d'Information sur le Crédit (BIC, enrichi)
  interrogeBic?: boolean;
  statutBic?: string;
  nombrePretsActifsAutresInstitutions?: number;
  encoursCreditAutresInstitutionsFcfa?: number;
  bicNombreCreditsSoldesAilleurs?: number | null;
  bicAncienneteDernierIncidentMois?: number | null;

  // Demande de crédit
  categorieCredit?: string;
  objetCredit?: string;
  montantDemandeFcfa: number;
  dureeMois: number;
  tauxInteretNominalAnnuelPct?: number;
  garantie?: string;

  // Résultat du moteur IA
  scoreRisque?: number;               // probabilité de défaut en %, 0-100
  probaDefaut?: number;               // probabilité de défaut brute, 0-1
  zoneDecision?: 'ACCORD_FAVORABLE' | 'A_EXAMINER' | 'RISQUE_ELEVE' | string;
  scoreCredit?: number;               // score de solvabilité 0-100 (100 = meilleur)
  perteAttendueFcfa?: number;         // Expected Loss
  ratioEndettement?: number;
  ratioResteAVivreFcfa?: number;      // reste-à-vivre absolu après échéance
  futureEcheanceCreditFcfa?: number;  // mensualité du crédit demandé (annuité)
  explicationJson?: string;           // facteurs SHAP sérialisés (parser avec JSON.parse)
  noteDecision?: string;              // règle métier ayant modifié la zone, le cas échéant

  statut?: 'APPROUVE' | 'REJETE' | 'A_L_ETUDE' | 'ERREUR_IA' | string;
  dateCreation?: string;

  // Origine du score : 'IA' = moteur de scoring backend, 'ESTIMATION_LOCALE' = repli
  // calculé côté navigateur quand le backend est injoignable (à ne pas confondre
  // avec une vraie prédiction du modèle).
  source?: 'IA' | 'ESTIMATION_LOCALE' | string;
}

export interface DashboardStats {
  totalClients: number;
  totalDemandes: number;
  approuvees: number;
  rejetees: number;
  enEtude: number;
}

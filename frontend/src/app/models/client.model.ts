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
  dateAdhesionCooperative?: string;   // ouverture du compte sociétaire (sert au calcul de l'ancienneté)
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
  nombreCreditsSoldes?: number;
  partCreditsSoldesPct?: number | null;
  aDejaDefautInterne?: boolean;
  tauxRemboursementDernierCreditPct?: number | null;
  joursRetardMaxHistorique?: number | null;
  nombreIncidentsPaiementTotal?: number;
  nombreReechelonnementsTotal?: number;
  ancienneteDernierCreditMois?: number | null;
  montantMaxCreditAnterieurFcfa?: number;
  creditsInternesAnterieurs?: CreditInterneAnterieur[];
  // BIC (centrale des risques UEMOA) - pré-chargé, lecture seule
  interrogeBic?: boolean;
  statutBic?: string;
  bicScore?: number;
  nombrePretsActifsAutresInstitutions?: number;
  encoursCreditAutresInstitutionsFcfa?: number;
  bicMensualitesTotalesFcfa?: number;
  bicNombreCreditsSoldesAilleurs?: number | null;
  bicNombreImpayesTotal?: number;
  bicJoursRetardMax?: number | null;
  bicNombreContentieux?: number;
  bicMontantRetardTotalFcfa?: number;
  bicInterdictionBancaire?: boolean;
  bicNombreChequesImpayes12m?: number;
  bicAncienneteDernierIncidentMois?: number | null;
  bicEngagementsExternes?: BicEngagementExterne[];
  // Factures ONEA / SONABEL - pré-chargé, lecture seule
  facturesNombre12m?: number;
  facturesTauxPaiementPct?: number;
  facturesNombreImpayees?: number;
  facturesRetardMoyenJours?: number;
  facturesMontantImpayeTotalFcfa?: number;
  facturesServicesPublics?: FactureServicePublic[];
  // Moralité / civisme - informatif, hors modèle
  casierJudiciaire?: string;
  nombreInfractionsRoutieres24m?: number;
  nombreLitigesCivils?: number;
  presenceListeSanctions?: boolean;
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

/** Un crédit CIF passé du sociétaire (historique interne détaillé, lecture seule). */
export interface CreditInterneAnterieur {
  reference?: string;
  categorie?: string;
  objet?: string;
  dateDecaissement?: string;
  dateEcheancePrevue?: string;
  dateSolde?: string | null;
  montantAccordeFcfa?: number;
  tauxInteretAnnuelPct?: number;
  dureeMois?: number;
  echeanceMensuelleFcfa?: number;
  coutTotalCreditFcfa?: number;
  montantTotalRembourseFcfa?: number;
  capitalRestantDuFcfa?: number;
  statut?: 'Soldé' | 'Soldé par anticipation' | 'En cours' | 'En défaut' | 'Rééchelonné' | string;
  tauxRembourseePct?: number;
  nombreEcheancesEnRetard?: number;
  joursRetardCumules?: number;
  joursRetardMoyen?: number;
  joursRetardMax?: number;
  nombreIncidentsPaiement?: number;
  nombreReechelonnements?: number;
  delaiUtilisationApresDeblocageJours?: number;
  garantieType?: string;
  garantieAppelee?: boolean;
  agence?: string;
  membreGroupeSolidaire?: boolean;
}

/** Un engagement de crédit dans une AUTRE institution, remonté par le BIC. */
export interface BicEngagementExterne {
  etablissement?: string;
  typeCredit?: string;
  dateOctroi?: string;
  montantInitialFcfa?: number;
  encoursRestantFcfa?: number;
  mensualiteFcfa?: number;
  dureeMois?: number;
  tauxInteretAnnuelPct?: number;
  statut?: 'Sain' | 'Impayé' | 'Souffrance' | 'Contentieux' | 'Soldé' | string;
  nombreImpayes?: number;
  montantEnRetardFcfa?: number;
  joursRetardMax?: number;
  garantie?: string;
}

/** Une facture de service public (ONEA eau, SONABEL électricité). */
export interface FactureServicePublic {
  fournisseur?: 'ONEA' | 'SONABEL' | string;
  periode?: string;
  montantFcfa?: number;
  dateEmission?: string;
  dateEcheance?: string;
  statut?: 'Payée' | 'Impayée' | string;
  datePaiement?: string | null;
  joursRetard?: number;
  montantImpayeFcfa?: number;
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

  // Appréciation de l'agent - informatif, hors modèle
  avisAgent?: 'FAVORABLE' | 'FAVORABLE_SOUS_RESERVE' | 'RESERVE' | 'DEFAVORABLE' | string;
  avisAgentCommentaire?: string;
  avisAgentMotifs?: string;           // motifs séparés par des virgules
  avisAgentDate?: string;

  statut?: 'APPROUVE' | 'REJETE' | 'A_L_ETUDE' | 'ERREUR_IA' | string;
  dateCreation?: string;

  // Corbeille (suppression logique)
  supprime?: boolean;
  dateSuppression?: string;
  supprimePar?: string;

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

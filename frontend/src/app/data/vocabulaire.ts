// Vocabulaire "verrouillé modèle" : valeurs consommées telles quelles par le
// moteur IA (miroir de scripts/vocabulaire_cif.py). Ne pas modifier sans
// ré-entraîner le modèle. Les listes paramétrables (catégories, objets,
// garanties) viennent, elles, du backend via SettingsService.

export const SEXES = ['Femme', 'Homme'] as const;
export const ZONES = ['Urbaine', 'Semi-urbaine', 'Rurale'] as const;
export const SITUATIONS_MATRIMONIALES = ['Marié(e)', 'Célibataire', 'Veuf(ve)', 'Divorcé(e)'] as const;
export const NIVEAUX_EDUCATION = ['Aucun', 'Primaire', 'Secondaire', 'Supérieur'] as const;

export const SECTEURS_ACTIVITE = [
  'Commerce informel', 'Agriculture', 'Élevage', 'Artisanat',
  'Restauration/Transformation', 'Transport', 'Salarié secteur formel',
  'Fonctionnaire', 'Autre service',
] as const;

export const SOUS_SECTEUR_NON_APPLICABLE = 'Non applicable';
export const SOUS_SECTEURS_FORMELS = [
  'Banque/Finance', 'Télécom/Services', 'Mines', 'BTP', 'Autre secteur formel',
] as const;

export const REGULARITES_EPARGNE = ['Régulière', 'Irrégulière', 'Aucune épargne'] as const;

export const STATUTS_BIC = [
  'Non consulté',
  'Jamais emprunté ailleurs',
  'Bon payeur ailleurs (solde sans incident)',
  'Prêt en cours ailleurs',
  'Incident de paiement signalé ailleurs',
] as const;
export const BIC_PRET_EN_COURS = 'Prêt en cours ailleurs';
export const BIC_INCIDENT = 'Incident de paiement signalé ailleurs';

export const TYPE_COMPTE_BANCAIRE_AUCUN = 'Aucun';
export const TYPES_COMPTE_BANCAIRE = ['Épargne', 'Courant', 'Dépôt à terme'] as const;

export const GARANTIES_MODELE = ['Caution solidaire', 'Bien matériel', "Aval d'un tiers", 'Aucune'] as const;

export const DUREES_STANDARD = [3, 6, 9, 12, 18, 24, 36, 48] as const;

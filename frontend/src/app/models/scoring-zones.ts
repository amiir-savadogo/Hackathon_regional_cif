// Seuils de décision du moteur de scoring.
// ALIGNÉS SUR models/metadata.json du modèle déployé (seuil_vert_max /
// seuil_rouge_min). À mettre à jour ICI si le modèle est ré-entraîné avec des
// zones différentes - c'est le seul endroit à changer côté frontend.
//
// Modèle courant : RandomForest (F1), seuil_vert_max = 0.28, seuil_rouge_min = 0.53.

/** Proba de défaut < ce seuil -> zone verte (Accord favorable). */
export const PD_SEUIL_VERT = 0.28;
/** Proba de défaut >= ce seuil -> zone rouge (Risque élevé). */
export const PD_SEUIL_ROUGE = 0.53;

// Le score de solvabilité affiché = round((1 - PD) * 100). Bornes équivalentes :
/** Score strictement au-dessus -> vert (72). */
export const SCORE_SEUIL_VERT = Math.round((1 - PD_SEUIL_VERT) * 100);
/** Score strictement au-dessus (et <= SCORE_SEUIL_VERT) -> orange (47). */
export const SCORE_SEUIL_ORANGE = Math.round((1 - PD_SEUIL_ROUGE) * 100);

export type ZoneCouleur = 'vert' | 'orange' | 'rouge' | 'gris';

/** Couleur logique d'un score de solvabilité 0-100 (null/hors plage -> gris). */
export function couleurScore(s?: number | null): ZoneCouleur {
  if (s === null || s === undefined || isNaN(s)) return 'gris';
  if (s > SCORE_SEUIL_VERT) return 'vert';
  if (s > SCORE_SEUIL_ORANGE) return 'orange';
  return 'rouge';
}

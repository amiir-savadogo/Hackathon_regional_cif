// Seuils de décision du moteur de scoring.
// ALIGNÉS SUR models/metadata.json du modèle déployé (seuil_vert_max /
// seuil_rouge_min). À mettre à jour ICI si le modèle est ré-entraîné avec des
// zones différentes - c'est le seul endroit à changer côté frontend.
//
// Modèle courant : RandomForest, seuil_vert_max = 0.28, seuil_rouge_min = 0.53.
//
// Convention d'affichage : "Score de risque" = probabilité de défaut x 100.
// PLUS LE SCORE EST ÉLEVÉ, PLUS C'EST RISQUÉ (0 = aucun risque, 100 = défaut
// quasi certain). Vert = score bas, rouge = score haut.

/** Proba de défaut < ce seuil -> zone verte (Accord favorable). */
export const PD_SEUIL_VERT = 0.28;
/** Proba de défaut >= ce seuil -> zone rouge (Risque élevé). */
export const PD_SEUIL_ROUGE = 0.53;

// Score de risque = round(PD x 100). Bornes équivalentes :
/** Score de risque <= ce seuil -> vert (28). */
export const SCORE_RISQUE_VERT_MAX = Math.round(PD_SEUIL_VERT * 100);
/** Score de risque > ce seuil -> rouge (53). Entre les deux -> orange. */
export const SCORE_RISQUE_ROUGE_MIN = Math.round(PD_SEUIL_ROUGE * 100);

export type ZoneCouleur = 'vert' | 'orange' | 'rouge' | 'gris';

/** Couleur logique d'un score de RISQUE 0-100 (null/hors plage -> gris). */
export function couleurScore(s?: number | null): ZoneCouleur {
  if (s === null || s === undefined || isNaN(s)) return 'gris';
  if (s <= SCORE_RISQUE_VERT_MAX) return 'vert';
  if (s <= SCORE_RISQUE_ROUGE_MIN) return 'orange';
  return 'rouge';
}

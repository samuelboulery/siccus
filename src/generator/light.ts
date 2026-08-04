import { RAD } from './rng'

/**
 * L'éclairage de la planche.
 *
 * Une seule source, en haut à gauche, constante sur tout le dessin. C'est cette
 * cohérence — plus que la finesse du trait — qui fait qu'un feuillage se lit
 * comme un volume au lieu d'une collection de silhouettes découpées. Une gravure
 * dont les ombres partent dans tous les sens n'a jamais l'air d'un objet.
 */
export const LIGHT_FROM = -132

/**
 * Densité de tramé d'un organe, de 1 (en pleine lumière) à 4 (croisé).
 *
 * Trois contributions : l'orientation de l'organe vis-à-vis de la source, sa
 * face — un dessous est toujours à l'ombre — et son raccourci, car une feuille
 * vue de profil montre sa tranche et se lit plus sombre.
 */
/**
 * De quel côté d'un organe tombe l'ombre, +1 ou −1.
 *
 * L'organe pointe dans la direction `angle` ; sa normale est à 90°. Le côté à
 * l'ombre est celui qui tourne le dos à la source.
 */
export function shadeSideOf(angle: number): 1 | -1 {
  return Math.cos((angle + 90 - LIGHT_FROM) * RAD) > 0 ? -1 : 1
}

export function hatchLevelOf(
  angle: number,
  underside: boolean,
  widthScale: number,
): 1 | 2 | 3 | 4 {
  const lit = 0.5 + 0.5 * Math.cos((angle - LIGHT_FROM) * RAD)
  const shade = (1 - lit) * 0.68 + (underside ? 0.26 : 0) + (1 - widthScale) * 0.22
  const level = 1 + Math.round(Math.max(0, Math.min(1, shade)) * 3)
  return Math.max(1, Math.min(4, level)) as 1 | 2 | 3 | 4
}

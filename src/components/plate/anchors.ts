import type { Organ, Plate, Point } from '../../lib/types'

/**
 * Ce que les flèches de la planche désignent.
 *
 * Jusqu'ici la flèche des notes pointait `min(178, tx + 70)` — une coordonnée
 * calculée, donc le vide. Une planche d'étude ne fait jamais ça : chaque renvoi
 * touche un organe précis, et c'est ce qui la fait lire comme un document plutôt
 * que comme une illustration.
 *
 * ⚠ Tout se déduit de `Plate`. Aucun tirage `rng` n'est consommé ici : ces choix
 * sont des conséquences de la planche, pas des décisions du hasard, et ils ne
 * doivent surtout pas déplacer une branche.
 */

/** Passage des coordonnées du dessin à celles de la planche. */
export function toPlate(plate: Plate, x: number, y: number): Point {
  const { scale, tx, ty } = plate.framing
  return [x * scale + tx, y * scale + ty]
}

/**
 * L'organe le mieux placé pour être montré : grand, et plutôt vers la droite et
 * le haut du sujet — c'est de ce côté que se trouve la colonne des figures, donc
 * le filet ne traversera pas toute la planche.
 */
export function pickShowcaseOrgan(plate: Plate): Organ | undefined {
  if (plate.organs.length === 0) return undefined

  let best = plate.organs[0]!
  let bestScore = -Infinity
  const xs = plate.organs.map((o) => o.x)
  const ys = plate.organs.map((o) => o.y)
  const minX = Math.min(...xs)
  const spanX = Math.max(1e-6, Math.max(...xs) - minX)
  const minY = Math.min(...ys)
  const spanY = Math.max(1e-6, Math.max(...ys) - minY)

  for (const organ of plate.organs) {
    const toTheRight = (organ.x - minX) / spanX
    const towardTop = 1 - (organ.y - minY) / spanY
    /* Une feuille vue de profil ferait un mauvais spécimen à montrer : on
       privilégie celles qui s'offrent de face. */
    const score = organ.size * organ.widthScale * (1 + toTheRight * 0.6 + towardTop * 0.4)
    if (score > bestScore) {
      bestScore = score
      best = organ
    }
  }
  return best
}

/** Le point le plus haut du sujet — sommet d'inflorescence, ou apex du feuillage. */
function apexOf(plate: Plate): Point {
  const candidates: Point[] = [
    ...plate.dots.map((d): Point => [d.x, d.y]),
    ...plate.organs.map((o): Point => [o.x, o.y]),
  ]
  if (candidates.length === 0) return [0, 0]
  return candidates.reduce((a, b) => (b[1] < a[1] ? b : a))
}

/**
 * L'organe que désigne la note de terrain. Volontairement distinct de celui de
 * la figure ① et pris dans la moitié basse : deux flèches qui convergent sur le
 * même point se recouvrent et ne désignent plus rien.
 */
function pickNoteOrgan(plate: Plate, exclude: Organ | undefined): Organ | undefined {
  const others = plate.organs.filter((o) => o !== exclude)
  if (others.length === 0) return exclude

  const ys = others.map((o) => o.y)
  const minY = Math.min(...ys)
  const spanY = Math.max(1e-6, Math.max(...ys) - minY)

  let best = others[0]!
  let bestScore = -Infinity
  for (const organ of others) {
    const towardBottom = (organ.y - minY) / spanY
    const score = organ.size * organ.widthScale * (1 + towardBottom * 0.9)
    if (score > bestScore) {
      bestScore = score
      best = organ
    }
  }
  return best
}

export type PlateAnchors = {
  /** Ce que la figure ① agrandit, en coordonnées de planche. */
  figureOne: Point | undefined
  /** Ce que la figure ② agrandit. */
  figureTwo: Point
  /** Ce que désigne la flèche des notes de terrain. */
  note: Point | undefined
}

export function plateAnchors(plate: Plate): PlateAnchors {
  const showcase = pickShowcaseOrgan(plate)
  const noted = pickNoteOrgan(plate, showcase)

  /* Une coupe de tige se prélève au collet — l'origine du dessin est exactement
     ce point. Une graine ou une inflorescence viennent du sommet. */
  const two: Point = plate.detail2 === 'coupe' ? [0, 0] : apexOf(plate)

  return {
    figureOne: showcase ? toPlate(plate, showcase.x, showcase.y) : undefined,
    figureTwo: toPlate(plate, two[0], two[1]),
    note: noted ? toPlate(plate, noted.x, noted.y) : undefined,
  }
}

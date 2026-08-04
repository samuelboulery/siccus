import { nib, sk } from '../../generator/geometry'
import { r2 } from '../../generator/rng'
import type { Point } from '../../lib/types'

/**
 * Les filets de renvoi — les flèches de la planche.
 *
 * L'ancienne pointe était écrite en dur (`l3 -1.6 l-0.4 3.2 z`) : elle regardait
 * toujours en bas à droite, quelle que soit la direction d'arrivée du filet. Une
 * flèche qui ne pointe pas dans le sens de sa course est le genre de détail qui
 * fait basculer une planche du côté « fait à la machine ».
 *
 * Ici la pointe est construite SUR la tangente terminale de la courbe, le filet
 * s'arrête avant sa cible au lieu de la piquer, et il enfle vers la pointe comme
 * tout trait gravé.
 */

/** Longueur de la pointe, en unités de planche. */
const HEAD_LENGTH = 2.6
/** Demi-largeur de la pointe à sa base. Rapport ~3,5 : une pointe gravée est mince. */
const HEAD_HALF_WIDTH = 0.72

/** Épaisseur du filet à la queue et juste avant la pointe. */
const TAIL_WIDTH = 0.12
const NECK_WIDTH = 0.34

/** Échantillonnage de la quadratique pour l'extrusion. */
const SAMPLES = 14

export type LeaderSpec = {
  /** Départ : le chiffre de la figure, ou le bloc de notes. */
  from: Point
  /** Ce que le filet désigne réellement. */
  to: Point
  /**
   * Courbure, en fraction de la corde, signée. Un filet parfaitement droit se lit
   * comme une cote technique ; au-delà d'un dixième il devient une fioriture qui
   * traverse toute la planche. Le signe sert à écarter deux filets voisins pour
   * qu'ils ne se croisent pas.
   */
  bow?: number
  /** Écart laissé devant la cible : une flèche gravée effleure, elle ne pique pas. */
  gap?: number
}

export type Leader = {
  /** Le filet, contour fermé d'un trait fuselé. */
  shaft: string
  /** La pointe, triangle plein aligné sur la tangente d'arrivée. */
  head: string
  /** Point exact atteint par la pointe — sert à poser un chiffre ou un repère. */
  tip: Point
  /** Direction d'arrivée, unitaire. Sert à poser un chiffre HORS du dessin visé. */
  direction: Point
}

const quadratic = (a: Point, c: Point, b: Point, t: number): Point => {
  const u = 1 - t
  return [
    u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
  ]
}

/**
 * Construit un filet et sa pointe.
 *
 * Renvoie des chemins vides plutôt que des `NaN` quand départ et cible se
 * confondent : un renvoi dégénéré doit disparaître, pas casser la planche.
 */
export function buildLeader({ from, to, bow = 0.06, gap = 1.8 }: LeaderSpec): Leader {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const chord = Math.hypot(dx, dy)

  if (!Number.isFinite(chord) || chord < gap + HEAD_LENGTH) {
    return { shaft: '', head: '', tip: to, direction: [1, 0] }
  }

  /* La pointe s'arrête avant la cible, le long de la corde. */
  const shrink = (chord - gap) / chord
  const end: Point = [from[0] + dx * shrink, from[1] + dy * shrink]

  /* Point de contrôle décalé perpendiculairement : le filet arrive alors dans
     l'axe de sa pointe au lieu de l'aborder de biais. */
  const nx = -dy / chord
  const ny = dx / chord
  const control: Point = [
    (from[0] + end[0]) / 2 + nx * chord * bow,
    (from[1] + end[1]) / 2 + ny * chord * bow,
  ]

  /* Tangente terminale d'une quadratique : `fin − contrôle`. C'est elle, et rien
     d'autre, qui donne son orientation à la pointe. */
  const tx = end[0] - control[0]
  const ty = end[1] - control[1]
  const tm = Math.hypot(tx, ty) || 1
  const ux = tx / tm
  const uy = ty / tm

  const base: Point = [end[0] - ux * HEAD_LENGTH, end[1] - uy * HEAD_LENGTH]
  const head =
    `M${r2(end[0])},${r2(end[1])} ` +
    `L${r2(base[0] - uy * HEAD_HALF_WIDTH)},${r2(base[1] + ux * HEAD_HALF_WIDTH)} ` +
    `L${r2(base[0] + uy * HEAD_HALF_WIDTH)},${r2(base[1] - ux * HEAD_HALF_WIDTH)} Z`

  /* Le filet s'arrête au collet de la pointe : superposés, ils feraient une bosse. */
  const samples: Point[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    samples.push(quadratic(from, control, end, (i / SAMPLES) * (1 - HEAD_LENGTH / chord)))
  }

  return {
    shaft: sk(nib(samples, TAIL_WIDTH, NECK_WIDTH, 0), true),
    head,
    tip: end,
    direction: [ux, uy],
  }
}

import { RAD } from './rng'
import type { Framing, Organ, Stroke } from '../lib/types'

/**
 * Zone réservée au sujet sur la planche A3 (297 × 420), en unités du viewBox.
 * Centrée-gauche : la colonne de droite porte les détails agrandis et l'échelle.
 */
export const SUBJECT_AREA = { x: 24, y: 44, w: 158, h: 262 } as const

/** Marges de respiration autour de la bounding box. */
const MARGIN_X = 1.14
const MARGIN_Y = 1.08

/** Un sujet minuscule ne doit pas être agrandi jusqu'à remplir la planche. */
const MIN_EXTENT = 30

/**
 * Cadrage calculé APRÈS génération — jamais de viewBox en dur, sinon la moitié
 * des plantes débordent.
 *
 * L'origine du dessin (0, 0) est le collet, à l'intersection tige/racine : c'est
 * elle qui donne la ligne de sol une fois transformée.
 */
export function frameSubject(strokes: readonly Stroke[], organs: readonly Organ[]): Framing {
  let x0 = Infinity
  let x1 = -Infinity
  let y0 = Infinity
  let y1 = -Infinity

  const see = (x: number, y: number): void => {
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }

  /* Les coordonnées sont relues depuis les chemins : c'est la seule source de
     vérité une fois le tremblé appliqué. Les commandes SVG ne prennent que des
     paires x,y, donc l'appariement est sûr. */
  for (const s of strokes) {
    const nums = s.d.match(/-?\d+(\.\d+)?/g)
    if (!nums) continue
    for (let i = 0; i < nums.length - 1; i += 2) see(+nums[i]!, +nums[i + 1]!)
  }

  /* Une feuille est un groupe pivoté autour de son point d'attache : on encadre
     l'attache et l'extrémité, élargies du rayon du limbe. */
  for (const o of organs) {
    const r = o.size * 0.62
    const ex = o.x + Math.cos((o.ang + 90) * RAD) * o.size
    const ey = o.y + Math.sin((o.ang + 90) * RAD) * o.size
    see(o.x - r, o.y - r)
    see(o.x + r, o.y + r)
    see(ex - r, ey - r)
    see(ex + r, ey + r)
  }

  see(0, 0)

  const boxW = Math.max(MIN_EXTENT, x1 - x0) * MARGIN_X
  const boxH = Math.max(MIN_EXTENT, y1 - y0) * MARGIN_Y
  const scale = Math.min(SUBJECT_AREA.w / boxW, SUBJECT_AREA.h / boxH)
  const tx = SUBJECT_AREA.x + SUBJECT_AREA.w / 2 - ((x0 + x1) / 2) * scale
  const ty = SUBJECT_AREA.y + SUBJECT_AREA.h / 2 - ((y0 + y1) / 2) * scale

  return { scale, tx, ty, groundY: ty }
}

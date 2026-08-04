import { r2, jit, RAD, type Rng } from './rng'
import type { Point } from '../lib/types'

/**
 * Primitives de tracé.
 *
 * Aucun segment n'est jamais droit : tout passe par `sk()`, qui lisse une polyligne
 * en quadratiques. C'est ce qui sépare l'organique du fractal.
 */

/** Polyligne → chemin lissé en quadratiques. `close` ferme le contour. */
export function sk(pts: readonly Point[], close = false): string {
  if (!pts || pts.length < 2) return ''
  const first = pts[0]!
  let d = `M${r2(first[0])},${r2(first[1])}`
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!
    const n = pts[i + 1]!
    const mx = (p[0] + n[0]) / 2
    const my = (p[1] + n[1]) / 2
    d += ` Q${r2(p[0])},${r2(p[1])} ${r2(mx)},${r2(my)}`
  }
  const last = pts[pts.length - 1]!
  d += ` Q${r2(last[0])},${r2(last[1])} ${r2(last[0])},${r2(last[1])}`
  return close ? `${d} Z` : d
}

/** Tremblement de main : décale chaque point d'au plus `amp`. */
export function nudge(pts: readonly Point[], rng: Rng, amp: number): Point[] {
  return pts.map((p) => [p[0] + jit(rng, amp), p[1] + jit(rng, amp)] as Point)
}

export type Stem = { pts: Point[]; x: number; y: number; a: number }

/**
 * Une tige : `n` pas depuis (x, y), courbés de `bend` degrés au total,
 * chaque pas perturbé de ±`jitter`.
 */
export function stem(
  x: number,
  y: number,
  ang: number,
  len: number,
  bend: number,
  rng: Rng,
  jitter: number,
  n: number,
): Stem {
  const pts: Point[] = [[x, y]]
  let a = ang
  let cx = x
  let cy = y
  const step = len / n
  for (let i = 0; i < n; i++) {
    a += bend / n + jit(rng, jitter)
    cx += Math.cos(a * RAD) * step
    cy += Math.sin(a * RAD) * step
    pts.push([cx, cy])
  }
  return { pts, x: cx, y: cy, a }
}

/**
 * Extrude une polyligne en ruban fermé, la demi-largeur étant donnée par `wFn(t)`.
 * Sert aux limbes de feuille comme aux limbes de graminée.
 */
export function ribbon(pts: readonly Point[], wFn: (t: number) => number): Point[] {
  const right: Point[] = []
  const left: Point[] = []
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const w = wFn(t)
    const p = pts[i]!
    const q = pts[Math.min(i + 1, n - 1)]!
    const o = pts[Math.max(i - 1, 0)]!
    const dx = q[0] - o[0]
    const dy = q[1] - o[1]
    const m = Math.hypot(dx, dy) || 1
    right.push([p[0] - (dy / m) * w, p[1] + (dx / m) * w])
    left.push([p[0] + (dy / m) * w, p[1] - (dx / m) * w])
  }
  return right.concat(left.reverse())
}

/**
 * Un trait de burin : contour fermé d'une ligne dont l'épaisseur varie.
 *
 * C'est le premier écart d'une gravure avec un dessin vectoriel. Un `stroke`
 * SVG a une épaisseur constante et des bouts arrondis ; une taille douce gonfle
 * au milieu — le burin s'enfonce — et sort en pointe.
 *
 * @param w0 largeur à la base, `w1` à l'extrémité. `w1 = 0` sur un trait terminal.
 * @param belly renflement au milieu, en fraction de la largeur.
 */
export function nib(
  pts: readonly Point[],
  w0: number,
  w1: number,
  belly: number,
): Point[] {
  return ribbon(pts, (t) => ((w0 + (w1 - w0) * t) * (1 + belly * Math.sin(Math.PI * t))) / 2)
}

/**
 * Un trait de burin dont l'épaisseur est donnée point par point.
 *
 * Sert aux axes entiers : un axe doit être UN seul trait continu. Découpé en un
 * ruban par entre-nœud, il montre des encoches et des ressauts de largeur à
 * chaque jointure — l'effet chapelet de saucisses.
 *
 * @param widths largeur pleine à chaque point de `pts`, même longueur.
 */
export function nibVarying(pts: readonly Point[], widths: readonly number[]): Point[] {
  const last = widths.length - 1
  return ribbon(pts, (t) => {
    const at = t * last
    const i = Math.max(0, Math.min(last - 1, Math.floor(at)))
    const f = at - i
    return ((widths[i]! * (1 - f) + widths[i + 1]! * f) / 2) || 0.05
  })
}

/** Vrille de plante grimpante : spirale qui se resserre. */
export function tendril(x: number, y: number, ang: number, size: number, rng: Rng): string {
  const pts: Point[] = []
  let a = ang
  let cx = x
  let cy = y
  let step = size * 0.16
  for (let i = 0; i < 16; i++) {
    a += 26 + i * 2.4 + jit(rng, 4)
    cx += Math.cos(a * RAD) * step
    cy += Math.sin(a * RAD) * step
    step *= 0.93
    pts.push([cx, cy])
  }
  return sk(pts)
}

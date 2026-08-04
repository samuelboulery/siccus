import { jit, r2, RAD, type Rng } from './rng'
import { nudge, ribbon, sk } from './geometry'
import type { LeafMargin, LeafShape, LeafType, Point } from '../lib/types'

/**
 * Pas de la nervure médiane. FIGE LA CONSOMMATION DE `rng` — ne jamais changer :
 * la géométrie est calculée à cette résolution quoi qu'il arrive, seule la
 * quantité de points ÉCRITE dans le fichier varie (voir `emission`).
 */
const MID_STEPS = 22
const HATCH_STEPS = 5

/**
 * Résolution d'écriture, proportionnelle à la taille de l'organe.
 *
 * Une feuille de canopée mesure environ 3 mm sur la planche imprimée : la tracer
 * avec 46 points de contour, douze nervures et un double trait est invisible à
 * l'œil comme à 300 dpi, et faisait passer un arbre dense de 250 Ko à 8,5 Mo.
 *
 * ⚠ Ce réglage n'intervient QU'À L'ÉMISSION. Tous les points sont calculés, donc
 * tous les tirages `rng` ont lieu, dans le même ordre, quelle que soit la taille.
 * Un organe plus léger ne déplace pas une seule branche de la plante.
 */
function emission(size: number): {
  stride: number
  doubleOutline: boolean
  veinLimit: number
  hatchLimit: number
} {
  /* Seuils en unités du dessin, avant mise à l'échelle du cadrage. Un organe de
     45 est une feuille de rosette ou un détail agrandi ; un organe de 15 est une
     feuille de canopée, quelques millimètres sur la planche. */
  if (size >= 45) return { stride: 1, doubleOutline: true, veinLimit: 99, hatchLimit: 99 }
  if (size >= 30) return { stride: 2, doubleOutline: true, veinLimit: 8, hatchLimit: 4 }
  if (size >= 18) return { stride: 3, doubleOutline: false, veinLimit: 4, hatchLimit: 2 }
  return { stride: 5, doubleOutline: false, veinLimit: 2, hatchLimit: 0 }
}

/** Garde un point sur `stride`, premier et dernier toujours conservés. */
function decimate(pts: readonly Point[], stride: number): Point[] {
  if (stride <= 1 || pts.length <= 3) return [...pts]
  const kept = pts.filter((_, i) => i % stride === 0)
  const last = pts[pts.length - 1]!
  if (kept[kept.length - 1] !== last) kept.push(last)
  return kept
}

/** Demi-largeur relative du limbe le long de la nervure, en `t ∈ [0, 1]`. */
function profile(kind: LeafType, t: number): number {
  const s = Math.sin(Math.PI * t)
  switch (kind) {
    case 'lanceolee':
      return Math.pow(Math.sin(Math.PI * Math.pow(t, 1.25)), 1.7) * 0.17
    case 'cordee':
      return Math.sin(Math.PI * (0.16 + 0.84 * t)) * 0.4
    case 'lineaire':
      return Math.min(1, s * 3.4) * 0.1
    case 'spatulee':
      return Math.pow(t, 0.85) * s * 0.44
    case 'obovale':
      return Math.pow(t, 0.45) * s * 0.36
    case 'ovale':
      return Math.pow(s, 0.86) * 0.31
  }
}

/**
 * Un organe foliaire complet : contour irrégulier doublé, marge (entière, dentée,
 * lobée), nervure médiane, nervures secondaires appariées et hachures d'ombre.
 *
 * C'est le seul endroit du projet où l'on dessine une feuille : le détail agrandi
 * de la planche appelle la même fonction avec une taille plus grande, ce qui
 * garantit qu'il montre bien l'organe de la plante affichée.
 */
export function leafOrgan(
  kind: LeafType,
  margin: LeafMargin,
  size: number,
  rng: Rng,
  bend: number,
  veinCount = 6,
): LeafShape {
  const n = MID_STEPS
  const out = emission(size)

  const mid: Point[] = []
  let a = -90
  let cx = 0
  let cy = 0
  for (let i = 0; i <= n; i++) {
    mid.push([cx, cy])
    a += bend / n + jit(rng, 0.5)
    cx += Math.cos(a * RAD) * (size / n)
    cy += Math.sin(a * RAD) * (size / n)
  }

  const teeth = margin === 'dentee' ? 11 : margin === 'lobee' ? 5 : 0
  const amp = margin === 'dentee' ? 0.13 : margin === 'lobee' ? 0.26 : 0
  const wFn = (t: number): number => {
    const base = profile(kind, t) * size
    const m = teeth ? 1 + amp * Math.sin(t * teeth * Math.PI * 2) : 1
    return Math.max(0.05, base * m + jit(rng, size * 0.006))
  }

  const outline = nudge(ribbon(mid, wFn), rng, size * 0.008)

  const veins: string[] = []
  for (let i = 1; i <= veinCount; i++) {
    const t = 0.1 + (i / (veinCount + 1)) * 0.82
    const idx = Math.round(t * n)
    const p = mid[idx]!
    const q = mid[Math.min(n, idx + 1)]!
    const o = mid[Math.max(0, idx - 1)]!
    const dx = q[0] - o[0]
    const dy = q[1] - o[1]
    const m = Math.hypot(dx, dy) || 1
    const w = wFn(t) * 0.94
    const up = 0.34
    for (const side of [1, -1]) {
      const ex = p[0] - (dy / m) * w * side + (q[0] - p[0]) * n * up * 0.11
      const ey = p[1] + (dx / m) * w * side + (q[1] - p[1]) * n * up * 0.11
      const control: Point = [
        (p[0] + ex) / 2 + jit(rng, size * 0.02),
        (p[1] + ey) / 2 + jit(rng, size * 0.02),
      ]
      veins.push(sk(nudge([p, control, [ex, ey]], rng, size * 0.006)))
    }
  }

  const hatch: string[] = []
  for (let i = 0; i < HATCH_STEPS; i++) {
    const t = 0.16 + i * 0.12
    const idx = Math.round(t * n)
    const p = mid[idx]!
    const q = mid[Math.min(n, idx + 1)]!
    const o = mid[Math.max(0, idx - 1)]!
    const dx = q[0] - o[0]
    const dy = q[1] - o[1]
    const m = Math.hypot(dx, dy) || 1
    const w = wFn(t) * 0.72
    hatch.push(
      `M${r2(p[0] - (dy / m) * w)},${r2(p[1] + (dx / m) * w)} ` +
        `L${r2(p[0] + (dy / m) * w * 0.25)},${r2(p[1] - (dx / m) * w * 0.25)}`,
    )
  }

  /* ⚠ Ces deux tremblés doivent être calculés ICI, après les nervures et les
     hachures : c'est l'ordre de l'ébauche, et le flux `rng` est partagé avec la
     croissance de la plante. Les déplacer redessinerait toutes les branches.
     `outline2` est calculé même quand il n'est pas écrit, pour la même raison. */
  const outline2 = nudge(outline, rng, size * 0.012)
  const midrib = nudge(mid, rng, size * 0.006)

  /* ── écriture ─────────────────────────────────────────────────────────────
     Le ruban est `droite[0..n] ++ gauche[n..0]` : on décime chaque flanc
     séparément pour que le contour reste fermé et symétrique. */
  const half = outline.length / 2
  const thin = (pts: Point[]): Point[] => [
    ...decimate(pts.slice(0, half), out.stride),
    ...decimate(pts.slice(half), out.stride),
  ]

  return {
    outline: sk(thin(outline), true),
    ...(out.doubleOutline ? { outline2: sk(thin(outline2), true) } : {}),
    midrib: sk(decimate(midrib, out.stride)),
    veins: veins.slice(0, out.veinLimit),
    hatch: hatch.slice(0, out.hatchLimit),
  }
}

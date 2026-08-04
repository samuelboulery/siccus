import { jit, RAD, type Rng } from './rng'
import { nudge, ribbon, sk } from './geometry'
import type { LeafMargin, LeafShape, LeafType, Point } from '../lib/types'

/**
 * Pas de la nervure médiane. FIGE LA CONSOMMATION DE `rng` — ne jamais changer :
 * la géométrie est calculée à cette résolution quoi qu'il arrive, seule la
 * quantité de points ÉCRITE dans le fichier varie (voir `emission`).
 */
const MID_STEPS = 22
/** Plafond de hachures de modelé sur un organe, même très grand. */
const HATCH_MAX = 16

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
  if (size >= 45) return { stride: 1, doubleOutline: true, veinLimit: 99, hatchLimit: 16 }
  if (size >= 30) return { stride: 2, doubleOutline: true, veinLimit: 8, hatchLimit: 8 }
  if (size >= 18) return { stride: 3, doubleOutline: false, veinLimit: 4, hatchLimit: 0 }
  /* Sous 18 unités le limbe fait trois millimètres sur la planche : le tramé du
     `<pattern>` suffit, des hachures individuelles s'y empâteraient. */
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
  /**
   * Raccourci de la largeur du limbe. Une feuille vue de profil est étroite mais
   * garde ses nervures : c'est ce que voit l'œil, et c'est ce qui distingue un
   * feuillage d'une planche d'autocollants.
   */
  widthScale = 1,
  /**
   * Côté à l'ombre, +1 ou -1. Toutes les hachures d'un organe partent du même
   * bord : c'est la cohérence de l'éclairage qui fait le volume.
   */
  shadeSide: 1 | -1 = 1,
  /**
   * Position de l'arête de pli le long de la nervure, ou `undefined` si le limbe
   * est resté à plat sous la presse.
   */
  foldAt?: number,
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
    const base = profile(kind, t) * size * widthScale
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

  /* Hachures de modelé : des traits transversaux qui partent de la marge et
     rentrent vers la nervure, du côté à l'ombre. Ils suivent la courbure du
     limbe — c'est ce qui distingue une hachure gravée d'une trame imprimée.
     Le pas est constant, la longueur suit la largeur locale. */
  const hatch: string[] = []
  const hatchCount = Math.min(HATCH_MAX, out.hatchLimit)
  for (let i = 0; i < hatchCount; i++) {
    const t = 0.1 + ((i + 0.5) / hatchCount) * 0.8
    const idx = Math.round(t * n)
    const p = mid[idx]!
    const q = mid[Math.min(n, idx + 1)]!
    const o = mid[Math.max(0, idx - 1)]!
    const dx = q[0] - o[0]
    const dy = q[1] - o[1]
    const m = Math.hypot(dx, dy) || 1
    const nx = (-dy / m) * shadeSide
    const ny = (dx / m) * shadeSide

    const w = wFn(t)
    const outer = 0.9
    const inner = 0.12 + rng() * 0.18
    const start: Point = [p[0] + nx * w * outer, p[1] + ny * w * outer]
    const end: Point = [p[0] + nx * w * inner, p[1] + ny * w * inner]
    /* Un léger fléchissement vers l'apex : une hachure gravée n'est pas une
       corde tendue en travers du limbe. */
    const bow: Point = [
      (start[0] + end[0]) / 2 + (q[0] - p[0]) * 0.8,
      (start[1] + end[1]) / 2 + (q[1] - p[1]) * 0.8,
    ]
    hatch.push(sk([start, bow, end]))
  }

  /* ── pli de presse ────────────────────────────────────────────────────────
     Au-delà de l'arête, le limbe est rabattu en miroir : on réfléchit la portion
     du contour située après le pli, plutôt que de la redessiner — la forme
     rabattue est exactement celle qui manque, c'est ce qui rend le pli crédible. */
  let fold: LeafShape['fold']
  if (foldAt !== undefined && out.hatchLimit > 0) {
    const k = Math.max(2, Math.min(n - 2, Math.round(foldAt * n)))
    const p = mid[k]!
    const q = mid[Math.min(n, k + 1)]!
    const o = mid[Math.max(0, k - 1)]!
    const dx = q[0] - o[0]
    const dy = q[1] - o[1]
    const m = Math.hypot(dx, dy) || 1
    /* L'arête court en travers du limbe, donc perpendiculairement à la nervure. */
    const ax = -dy / m
    const ay = dx / m

    const reflect = ([vx, vy]: Point): Point => {
      const rx = vx - p[0]
      const ry = vy - p[1]
      const proj = rx * ax + ry * ay
      return [p[0] + 2 * proj * ax - rx, p[1] + 2 * proj * ay - ry]
    }

    const flapPts = [...outline.slice(k, n + 1), ...outline.slice(n + 1, 2 * n + 2 - k)].map(
      reflect,
    )
    if (flapPts.length > 3) {
      const reach = wFn(foldAt) * 1.15
      fold = {
        flap: sk(decimate(flapPts, out.stride), true),
        crease: sk([
          [p[0] + ax * reach, p[1] + ay * reach],
          [p[0] - ax * reach, p[1] - ay * reach],
        ]),
      }
    }
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
    ...(fold ? { fold } : {}),
  }
}

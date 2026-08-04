import { jit, RAD, type Rng } from './rng'
import { nudge, ribbon, sk, stem, tendril } from './geometry'
import { leafOrgan } from './leaf'
import type { Sketch } from './sketch'
import type { Genome, Point, PortId } from '../lib/types'

/**
 * Les cinq ports. Chacun dessine une morphologie entière et renvoie le nombre de
 * vagues de profondeur — l'unité de groupement de l'animation.
 *
 * ⚠ Ces fonctions consomment `rng` dans un ordre qui fige l'apparence de toutes les
 * plantes déjà générées. Réordonner un tirage, même sans changer le résultat visible
 * d'une ligne, change silencieusement toutes les planches du port concerné.
 */

/** Plafond de traits, coupé EN PROFONDEUR — jamais en milieu de branche. */
const MAX_NODES = 1500

type Branch = { x: number; y: number; a: number; len: number; w: number }

function arbustif(sketch: Sketch, g: Genome, rng: Rng): number {
  let frontier: Branch[] = [{ x: 0, y: 0, a: -90, len: 52, w: g.thickness }]
  let total = 0
  let maxWave = 1

  for (let d = 0; d < g.depth && frontier.length; d++) {
    if (total + frontier.length > MAX_NODES) break
    const next: Branch[] = []

    for (const nd of frontier) {
      const sign = d % 2 === 0 ? 1 : -1
      const s = stem(nd.x, nd.y, nd.a, nd.len, g.curvature * 36 * sign, rng, 1.4, 5)
      sketch.stemStroke(s, nd.w, d)
      total++

      /* Feuilles LE LONG des rameaux, pas seulement aux extrémités. */
      if (d >= Math.floor(g.depth * 0.34) && rng() < g.density) {
        const nb = g.phyllotaxy === 'verticillee' ? 3 : g.phyllotaxy === 'opposee' ? 2 : 1
        for (let k = 0; k < nb; k++) {
          const lean =
            (k - (nb - 1) / 2) * (g.phyllotaxy === 'verticillee' ? 52 : 80) + jit(rng, 18)
          sketch.organ(s.x, s.y, s.a + 90 + lean, g.leafSize * (0.7 + rng() * 0.6), d)
        }
      }

      if (d + 1 < g.depth) {
        const three = d >= 2 && rng() < 0.22
        const angles = three
          ? [-g.angleBase, jit(rng, 6), g.angleBase]
          : [-g.angleBase * 0.6, g.angleBase * 0.6]
        for (const b of angles) {
          next.push({
            x: s.x,
            y: s.y,
            a: s.a + b * (1 + g.angleJitter * (rng() * 2 - 1)),
            len: nd.len * (0.7 + g.branchRatio * 0.24),
            w: nd.w * g.branchRatio,
          })
        }
      }
    }

    frontier = next
    maxWave = d + 1
  }
  return maxWave
}

function rosette(sketch: Sketch, g: Genome, rng: Rng): number {
  const nLeaves = 7 + Math.floor(rng() * 7)
  for (let i = 0; i < nLeaves; i++) {
    const a = -172 + i * (164 / (nLeaves - 1)) + jit(rng, 7)
    const petiole = 14 + rng() * 22
    const s = stem(0, 0, a, petiole, jit(rng, 18), rng, 1.2, 4)
    sketch.stemStroke(s, g.thickness * 0.28, Math.floor(i / 3))
    sketch.organ(
      s.x,
      s.y,
      s.a,
      g.leafSize * (2.1 + rng() * 1.1),
      Math.floor(i / 3),
      undefined,
      undefined,
      8,
    )
  }

  /* Hampes florales en ombelle. */
  const scapes = 1 + Math.floor(rng() * 2)
  for (let i = 0; i < scapes; i++) {
    const s = stem(jit(rng, 6), 0, -90 + jit(rng, 10), 96 + rng() * 46, jit(rng, 26), rng, 1.6, 9)
    sketch.stemStroke(s, g.thickness * 0.5, 4)
    const rays = 11 + Math.floor(rng() * 9)
    for (let k = 0; k < rays; k++) {
      const a = -170 + k * (160 / (rays - 1)) + jit(rng, 6)
      const len = 8 + rng() * 9
      const end: Point = [s.x + Math.cos(a * RAD) * len, s.y + Math.sin(a * RAD) * len]
      sketch.push([[s.x, s.y], end], g.thickness * 0.11, 6)
      sketch.dots.push({ x: end[0], y: end[1], r: 0.9 + rng() * 0.8, wave: 7 })
    }
  }
  return 7
}

function graminee(sketch: Sketch, g: Genome, rng: Rng): number {
  const nBlades = 9 + Math.floor(rng() * 8)
  for (let i = 0; i < nBlades; i++) {
    const side = i % 2 ? 1 : -1
    const a = -90 + side * (12 + rng() * 44)
    const s = stem(jit(rng, 4), 0, a, 76 + rng() * 66, side * (28 + rng() * 40), rng, 1.6, 12)

    /* ⚠ Deux organes sont construits puis jetés. Ils ne dessinent rien, mais ils
       CONSOMMENT `rng` : les supprimer redessinerait toutes les graminées déjà
       générées. Le limbe réel est le ruban ci-dessous, pas un `leafOrgan`. */
    sketch.organ(0, 0, 0, 1, Math.floor(i / 3))
    sketch.organs.pop()
    leafOrgan('lineaire', 'entiere', 1, rng, 0, 3)

    const w0 = g.thickness * 0.72
    const outline = nudge(
      ribbon(s.pts, (t) => Math.max(0.12, w0 * (1 - t * 0.94))),
      rng,
      0.5,
    )
    sketch.strokes.push({
      d: sk(outline, true),
      w: g.thickness * 0.16,
      wave: Math.floor(i / 3),
      pass: 0,
      fillBlade: true,
    })
    sketch.push(s.pts, g.thickness * 0.09, Math.floor(i / 3), 1)
  }

  /* Chaumes et épillets. */
  const culms = 2 + Math.floor(rng() * 3)
  for (let i = 0; i < culms; i++) {
    const s = stem(jit(rng, 5), 0, -90 + jit(rng, 8), 108 + rng() * 54, jit(rng, 20), rng, 1.4, 10)
    sketch.stemStroke(s, g.thickness * 0.32, 5)
    const nSpikes = 7 + Math.floor(rng() * 7)
    for (let k = 0; k < nSpikes; k++) {
      const t = 0.5 + (k / nSpikes) * 0.5
      const p = s.pts[Math.round(t * (s.pts.length - 1))]!
      const a = s.a + (k % 2 ? 1 : -1) * (40 + rng() * 26)
      const sp = stem(p[0], p[1], a, 7 + rng() * 7, jit(rng, 14), rng, 0.8, 3)
      sketch.push(sp.pts, 0.22, 6)
      sketch.dots.push({ x: sp.x, y: sp.y, r: 1 + rng() * 0.7, wave: 7 })
    }
  }
  return 7
}

function grimpant(sketch: Sketch, g: Genome, rng: Rng): number {
  let node = stem(0, 0, -92 + jit(rng, 6), 74, 30 * (rng() < 0.5 ? 1 : -1), rng, 1.8, 8)
  sketch.stemStroke(node, g.thickness * 0.62, 0)

  const segments = 4 + Math.floor(rng() * 3)
  for (let i = 0; i < segments; i++) {
    const wave = i + 1
    const bend = (i % 2 === 0 ? -1 : 1) * (26 + rng() * 32)
    const next = stem(node.x, node.y, node.a, 44 + rng() * 18, bend, rng, 1.8, 8)
    sketch.stemStroke(next, g.thickness * 0.62 * Math.pow(0.88, i + 1), wave)

    for (let k = 0; k < 3; k++) {
      const t = 0.22 + k * 0.32
      const p = next.pts[Math.round(t * (next.pts.length - 1))]!
      sketch.organ(
        p[0],
        p[1],
        next.a + (k % 2 ? 96 : -96) + jit(rng, 16),
        g.leafSize * (1.5 + rng() * 0.7),
        wave,
        undefined,
        undefined,
        8,
      )
    }

    if (rng() < 0.8) {
      sketch.marks.push({
        d: tendril(next.x, next.y, next.a + (rng() < 0.5 ? 70 : -70), 22 + rng() * 10, rng),
        wave: wave + 1,
      })
    }
    if (rng() < 0.45) {
      const anchor = next.pts[3]!
      const br = stem(
        anchor[0],
        anchor[1],
        next.a + (rng() < 0.5 ? 52 : -52),
        34 + rng() * 20,
        jit(rng, 24),
        rng,
        1.6,
        6,
      )
      sketch.stemStroke(br, g.thickness * 0.24, wave + 1)
      sketch.organ(br.x, br.y, br.a + 80, g.leafSize * 1.1, wave + 1, undefined, undefined, 6)
    }
    node = next
  }
  return segments + 2
}

function fougere(sketch: Sketch, g: Genome, rng: Rng): number {
  const nFronds = 5 + Math.floor(rng() * 3)
  for (let i = 0; i < nFronds; i++) {
    const fan = (i / (nFronds - 1)) * 2 - 1 /* -1 → +1 : éventail de frondes */
    const a = -90 + fan * 58 + jit(rng, 5)
    const s = stem(
      jit(rng, 4),
      0,
      a,
      78 + rng() * 36,
      fan * (52 + rng() * 30) + jit(rng, 8),
      rng,
      1.4,
      14,
    )
    sketch.stemStroke(s, g.thickness * 0.34, i)

    const nPinnae = 11 + Math.floor(rng() * 8)
    for (let k = 0; k < nPinnae; k++) {
      const t = 0.12 + (k / nPinnae) * 0.85
      const idx = Math.round(t * (s.pts.length - 1))
      const p = s.pts[idx]!
      const q = s.pts[Math.min(s.pts.length - 1, idx + 1)]!
      const o = s.pts[Math.max(0, idx - 1)]!
      const ang = Math.atan2(q[1] - o[1], q[0] - o[0]) / RAD
      const size = g.leafSize * 1.05 * (1 - t * 0.5)
      for (const side of [1, -1]) {
        sketch.organ(
          p[0],
          p[1],
          ang + side * (58 + jit(rng, 10)),
          size,
          nFronds + Math.floor(t * 4),
          undefined,
          undefined,
          4,
        )
      }
    }
  }
  return nFronds + 4
}

const PORTS: Record<PortId, (sketch: Sketch, g: Genome, rng: Rng) => number> = {
  arbustif,
  rosette,
  graminee,
  grimpant,
  fougere,
}

/** Dessine la partie aérienne et renvoie le nombre de vagues de profondeur. */
export function growPort(sketch: Sketch, g: Genome, rng: Rng): number {
  return PORTS[g.portId](sketch, g, rng)
}

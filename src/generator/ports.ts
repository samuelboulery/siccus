import { jit, RAD, type Rng } from './rng'
import { nudge, ribbon, sk, stem, tendril } from './geometry'
import { createBudget, founding, growAxis, type Architecture, type AxisSpec } from './axis'
import type { Sketch } from './sketch'
import type { Genome, Point, PortId } from '../lib/types'

/**
 * Les cinq ports.
 *
 * Ce ne sont plus cinq algorithmes indépendants mais cinq jeux de réglages du
 * moteur d'axes (`axis.ts`) — plus quelques organes propres à chaque morphologie :
 * ombelles, épillets, vrilles, crosse de fougère.
 *
 * ⚠ Ces fonctions consomment `rng` dans un ordre qui fige l'apparence de toutes
 * les plantes. Réordonner un tirage change silencieusement toutes les planches du
 * port concerné.
 */

type PortResult = { maxWave: number }

/**
 * Arbuste : monopodial et BASITONE — les axes vigoureux partent de la souche.
 * C'est ce qui fait un buisson plutôt qu'un arbre miniature.
 */
function arbustif(sketch: Sketch, g: Genome, rng: Rng): PortResult {
  const arch: Architecture = {
    target: -90,
    upright: 0.2,
    /* Les rameaux ne se redressent presque plus : ils s'écartent et s'arquent. */
    orderDamping: 0.22,
    droop: 1.6,
    droopGrowth: 2.1,
    branchAngle: 1.7,
    acrotony: -0.55,
    branchRate: 0.5 + g.density * 0.3,
    maxOrder: Math.max(2, Math.min(4, Math.round(g.depth / 3))),
    lateralShare: 0.3,
    lateralScale: 0.72,
    leaves: true,
    wobble: 2.4,
  }

  const budget = createBudget()
  /* Basitone : plusieurs axes vigoureux partent de la souche. C'est ce qui fait
     un buisson et non un arbre miniature. */
  const trunks = 2 + Math.floor(rng() * 3)

  for (let i = 0; i < trunks; i++) {
    const spread = trunks > 1 ? (i / (trunks - 1) - 0.5) * 2 : 0
    const launch = -90 + spread * (22 + rng() * 16)
    growAxis(
      sketch,
      g,
      arch,
      {
        ...founding(arch, {
          x: jit(rng, 2),
          y: 0,
          angle: launch,
          roll: rng() * 360,
          width: g.thickness * (1 - i * 0.13),
          internode: 13 + rng() * 5,
          internodes: Math.round(g.depth * 1.2),
          order: 0,
          wave: 0,
        }),
        /* Un tronc de touffe ne revient pas tout à fait à la verticale : il
           garde une part de son écartement, sinon les axes se superposent. */
        target: launch * 0.55 + arch.target * 0.45,
      },
      rng,
      budget,
    )
  }
  return { maxWave: budget.maxWave }
}

/**
 * Rosette : entre-nœuds quasi nuls au collet — toutes les feuilles s'insèrent
 * presque au même point, de plus en plus étalées vers l'extérieur — surmontée
 * d'une hampe florale orthotrope.
 */
function rosette(sketch: Sketch, g: Genome, rng: Rng): PortResult {
  const leaves = 9 + Math.floor(rng() * 8)
  let roll = rng() * 360

  for (let i = 0; i < leaves; i++) {
    const u = i / (leaves - 1)
    roll += 137.5
    /* Les feuilles extérieures sont les plus vieilles : plus longues et couchées. */
    const prostrate = -168 + u * 156 + jit(rng, 9)
    const petiole = 10 + (1 - u) * 8 + rng() * 8
    const axis = stem(jit(rng, 2), 0, prostrate, petiole, jit(rng, 14), rng, 1.1, 3)
    sketch.push(axis.pts, g.thickness * 0.24 * (1 - u * 0.35), Math.floor(i / 3))

    const side = Math.cos(roll * RAD)
    sketch.organ({
      x: axis.x,
      y: axis.y,
      ang: axis.a,
      size: g.leafSize * (2.3 - u * 0.7) * (0.85 + rng() * 0.3),
      wave: Math.floor(i / 3) + 1,
      roll,
      widthScale: 0.42 + 0.58 * Math.abs(side),
      underside: Math.sin(roll * RAD) < 0,
      veins: 8,
    })
  }

  const scapes = 1 + Math.floor(rng() * 2)
  const budget = createBudget()
  budget.maxWave = 6

  for (let i = 0; i < scapes; i++) {
    const arch: Architecture = {
      target: -90,
      upright: 0.3,
      orderDamping: 0,
      droop: 1.2,
      droopGrowth: 1,
      branchAngle: 1,
      acrotony: 1,
      branchRate: 0,
      maxOrder: 0,
      lateralShare: 0,
      lateralScale: 0,
      leaves: false,
      wobble: 2,
    }
    const spec: AxisSpec = founding(arch, {
      x: jit(rng, 5),
      y: 0,
      angle: -90 + jit(rng, 9),
      roll: rng() * 360,
      width: g.thickness * 0.42,
      internode: 15 + rng() * 6,
      internodes: 7,
      order: 0,
      wave: 4,
    })
    const apex = growAxis(sketch, g, arch, spec, rng, budget)
    umbel(sketch, g, rng, [apex.x, apex.y], apex.wave + 1)
  }

  return { maxWave: Math.max(9, budget.maxWave + 2) }
}

/** Graminée : touffe d'axes équivalents, limbes engainants, aucune ramification. */
function graminee(sketch: Sketch, g: Genome, rng: Rng): PortResult {
  const blades = 9 + Math.floor(rng() * 8)

  for (let i = 0; i < blades; i++) {
    const side = i % 2 ? 1 : -1
    const angle = -90 + side * (12 + rng() * 44)
    const axis = stem(
      jit(rng, 4),
      0,
      angle,
      76 + rng() * 66,
      side * (28 + rng() * 40),
      rng,
      1.6,
      12,
    )

    /* Le limbe EST le trait : un ruban qui s'effile, pas un contour rapporté. */
    const w0 = g.thickness * 0.72
    const outline = nudge(
      ribbon(axis.pts, (t) => Math.max(0.12, w0 * (1 - t * 0.94))),
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
    sketch.push(axis.pts, g.thickness * 0.09, Math.floor(i / 3), 1)
  }

  const culms = 2 + Math.floor(rng() * 3)
  for (let i = 0; i < culms; i++) {
    const axis = stem(jit(rng, 5), 0, -90 + jit(rng, 8), 108 + rng() * 54, jit(rng, 20), rng, 1.4, 10)
    sketch.stemStroke(axis, g.thickness * 0.32, 5)

    const spikelets = 7 + Math.floor(rng() * 7)
    for (let k = 0; k < spikelets; k++) {
      const t = 0.5 + (k / spikelets) * 0.5
      const p = axis.pts[Math.round(t * (axis.pts.length - 1))]!
      const a = axis.a + (k % 2 ? 1 : -1) * (40 + rng() * 26)
      const sp = stem(p[0], p[1], a, 7 + rng() * 7, jit(rng, 14), rng, 0.8, 3)
      sketch.push(sp.pts, 0.22, 6)
      sketch.dots.push({ x: sp.x, y: sp.y, r: 1 + rng() * 0.7, wave: 7 })
    }
  }
  return { maxWave: 8 }
}

/** Grimpant : un axe unique très long, plagiotrope, qui retombe, avec des vrilles. */
function grimpant(sketch: Sketch, g: Genome, rng: Rng): PortResult {
  const arch: Architecture = {
    target: -60,
    upright: 0.07,
    orderDamping: 0.3,
    droop: 6.5,
    droopGrowth: 1.5,
    branchAngle: 1.4,
    acrotony: 0.7,
    branchRate: 0.18,
    maxOrder: 1,
    lateralShare: 0.22,
    lateralScale: 0.6,
    leaves: true,
    wobble: 4,
  }

  const budget = createBudget()
  const spec: AxisSpec = founding(arch, {
    x: 0,
    y: 0,
    angle: -92 + jit(rng, 8),
    roll: rng() * 360,
    width: g.thickness * 0.62,
    /* Entre-nœuds longs : c'est la marque d'une liane, et cela empêche les
       limbes de s'entasser à la base. */
    internode: 22 + rng() * 8,
    internodes: Math.round(g.depth * 1.6),
    order: 0,
    wave: 0,
  })
  growAxis(sketch, g, arch, spec, rng, budget)

  /* Les vrilles s'accrochent aux nœuds : on les pose sur les feuilles déjà
     placées, un nœud sur deux, ce qui les met naturellement aux bons endroits. */
  const nodes = sketch.organs.filter((_, i) => i % 2 === 1)
  for (const node of nodes) {
    if (rng() > 0.45) continue
    sketch.marks.push({
      d: tendril(node.x, node.y, node.ang + (rng() < 0.5 ? 62 : -62), 20 + rng() * 12, rng),
      wave: node.wave + 1,
    })
  }
  return { maxWave: budget.maxWave + 1 }
}

/**
 * Fougère : les axes sont des frondes, les pennes s'insèrent en opposé le long du
 * rachis, et l'apex de la plus jeune fronde est encore enroulé en crosse —
 * la vernation circinée, signature immédiate d'une fougère.
 */
function fougere(sketch: Sketch, g: Genome, rng: Rng): PortResult {
  const fronds = 4 + Math.floor(rng() * 3)
  let maxWave = 4

  for (let i = 0; i < fronds; i++) {
    const fan = fronds > 1 ? (i / (fronds - 1)) * 2 - 1 : 0
    const angle = -90 + fan * 56 + jit(rng, 5)
    const rachis = stem(
      jit(rng, 4),
      0,
      angle,
      78 + rng() * 36,
      fan * (48 + rng() * 26) + jit(rng, 8),
      rng,
      1.3,
      14,
    )
    sketch.push(rachis.pts, g.thickness * 0.3, i)

    const pinnae = 11 + Math.floor(rng() * 8)
    for (let k = 0; k < pinnae; k++) {
      const t = 0.12 + (k / pinnae) * 0.85
      const idx = Math.round(t * (rachis.pts.length - 1))
      const p = rachis.pts[idx]!
      const q = rachis.pts[Math.min(rachis.pts.length - 1, idx + 1)]!
      const o = rachis.pts[Math.max(0, idx - 1)]!
      const local = Math.atan2(q[1] - o[1], q[0] - o[0]) / RAD
      /* Les pennes raccourcissent vers l'apex : c'est le profil d'une fronde. */
      const size = g.leafSize * 1.05 * (1 - t * 0.55)
      const wave = i + 1 + Math.floor(t * 4)
      if (wave > maxWave) maxWave = wave

      for (const side of [1, -1]) {
        sketch.organ({
          x: p[0],
          y: p[1],
          ang: local + side * (56 + jit(rng, 9)),
          size,
          wave,
          roll: side > 0 ? 0 : 180,
          /* Une penne se voit toujours à plat : la fronde est un plan. */
          widthScale: 0.92 + rng() * 0.16,
          underside: false,
          veins: 4,
        })
      }
    }

    /* La plus jeune fronde n'est pas déroulée. */
    if (i === fronds - 1 || rng() < 0.25) {
      sketch.marks.push({
        d: tendril(rachis.x, rachis.y, rachis.a + 12, 16 + rng() * 7, rng),
        wave: maxWave,
      })
    }
  }
  return { maxWave: maxWave + 2 }
}

/** Ombelle : rayons et boutons, au sommet d'une hampe. */
function umbel(sketch: Sketch, g: Genome, rng: Rng, at: Point, wave: number): void {
  const rays = 11 + Math.floor(rng() * 9)
  for (let k = 0; k < rays; k++) {
    const a = -170 + k * (160 / (rays - 1)) + jit(rng, 6)
    const len = 8 + rng() * 9
    const end: Point = [at[0] + Math.cos(a * RAD) * len, at[1] + Math.sin(a * RAD) * len]
    sketch.push([at, end], g.thickness * 0.11, wave)
    sketch.dots.push({ x: end[0], y: end[1], r: 0.9 + rng() * 0.8, wave: wave + 1 })
  }
}

const PORTS: Record<PortId, (sketch: Sketch, g: Genome, rng: Rng) => PortResult> = {
  arbustif,
  rosette,
  graminee,
  grimpant,
  fougere,
}

/** Dessine la partie aérienne et renvoie le nombre de vagues de profondeur. */
export function growPort(sketch: Sketch, g: Genome, rng: Rng): number {
  return PORTS[g.portId](sketch, g, rng).maxWave
}

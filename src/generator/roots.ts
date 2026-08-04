import { jit, type Rng } from './rng'
import { stem } from './geometry'
import { createBudget, founding, growAxis, type Architecture } from './axis'
import type { Sketch } from './sketch'
import type { Genome } from '../lib/types'

/**
 * Le système racinaire — la plante arrachée, entière, comme l'exige le mot « herbier ».
 *
 * Même moteur d'axes que la partie aérienne, retourné : cible vers le bas, aucune
 * feuille, ramification plus dense, décroissance plus rapide. Les racines ne
 * participent pas au décompte des vagues : elles descendent pendant que la tige monte.
 */
export function growRoots(sketch: Sketch, g: Genome, rng: Rng): void {
  const fibrous = g.portId === 'graminee' || g.portId === 'rosette' || g.portId === 'fougere'

  if (fibrous) {
    /* Chevelu fasciculé : beaucoup de radicelles fines partant du collet, peu
       ramifiées. Pas de hiérarchie à modéliser — c'est justement ce qui le
       distingue d'un pivot. */
    const roots = 12 + Math.floor(rng() * 10)
    for (let i = 0; i < roots; i++) {
      const a = 90 + jit(rng, g.rootSpread)
      const s = stem(jit(rng, 7), 0, a, 34 + rng() * 40, jit(rng, 40), rng, 3.2, 8)
      sketch.nib(s.pts, g.thickness * 0.12, 0, Math.floor(i / 4))
      if (rng() < 0.55) {
        const anchor = s.pts[4]!
        const b = stem(anchor[0], anchor[1], a + jit(rng, 60), 14 + rng() * 18, jit(rng, 30), rng, 3, 5)
        sketch.nib(b.pts, g.thickness * 0.08, 0, Math.floor(i / 4) + 1)
      }
    }
    return
  }

  /* Pivot ramifié : le même moteur que la tige, donc la même loi de section — la
     racine principale porte visuellement ses radicelles. */
  const arch: Architecture = {
    target: 90,
    upright: 0.22,
    /* Une radicelle ne revient jamais vers le pivot : elle fuit, et son
       amortissement est plus fort encore que celui d'un rameau aérien. */
    orderDamping: 0.12,
    droop: 0,
    droopGrowth: 1,
    branchAngle: 1.9,
    acrotony: -0.3,
    branchRate: 0.85,
    maxOrder: Math.max(3, Math.min(5, g.depth - 5)),
    lateralShare: 0.4,
    lateralScale: 0.72,
    leaves: false,
    wobble: 7,
  }

  const budget = createBudget()
  growAxis(
    sketch,
    g,
    arch,
    founding(arch, {
      x: 0,
      y: 0,
      angle: 90 + jit(rng, 6),
      roll: rng() * 360,
      /* Le pivot part plus fin que la tige et s'effile vite : une racine se lit
         par sa hiérarchie et ses radicelles, pas par sa masse. */
      width: g.thickness * 0.5,
      internode: 7 + rng() * 3,
      internodes: Math.max(6, Math.min(11, g.depth)),
      order: 0,
      wave: 0,
    }),
    rng,
    budget,
  )
}

import { jit, type Rng } from './rng'
import { stem } from './geometry'
import type { Sketch } from './sketch'
import type { Genome } from '../lib/types'

/**
 * Le système racinaire — la plante arrachée, entière, comme l'exige le mot « herbier ».
 *
 * Même moteur que la partie aérienne, retourné sous la ligne de sol : angles plus
 * ouverts, aucune feuille, décroissance d'épaisseur plus rapide, courbure majorée,
 * profondeur réduite. Il ne participe pas au décompte des vagues : les racines
 * poussent vers le bas pendant que la tige monte.
 */
export function growRoots(sketch: Sketch, g: Genome, rng: Rng): void {
  const fibrous =
    g.portId === 'graminee' || g.portId === 'rosette' || g.portId === 'fougere'

  if (fibrous) {
    /* Chevelu fasciculé : beaucoup de radicelles fines, peu ramifiées. */
    const nRoots = 12 + Math.floor(rng() * 10)
    for (let i = 0; i < nRoots; i++) {
      const a = 90 + jit(rng, g.rootSpread)
      const s = stem(jit(rng, 7), 0, a, 34 + rng() * 40, jit(rng, 40), rng, 3.2, 8)
      sketch.push(s.pts, g.thickness * 0.12, Math.floor(i / 4))
      if (rng() < 0.55) {
        const anchor = s.pts[4]!
        const b = stem(
          anchor[0],
          anchor[1],
          a + jit(rng, 60),
          14 + rng() * 18,
          jit(rng, 30),
          rng,
          3,
          5,
        )
        sketch.push(b.pts, g.thickness * 0.08, Math.floor(i / 4) + 1)
      }
    }
    return
  }

  /* Pivot ramifié : même récursion que le port arbustif, miroir et amortie. */
  let frontier = [{ x: 0, y: 0, a: 90, len: 40, w: g.thickness * 0.8 }]
  const maxDepth = Math.max(4, Math.min(7, g.depth - 3))

  for (let d = 0; d < maxDepth && frontier.length; d++) {
    const next: typeof frontier = []
    for (const nd of frontier) {
      const s = stem(nd.x, nd.y, nd.a, nd.len, g.curvature * 54 * (d % 2 ? -1 : 1), rng, 3, 6)
      sketch.stemStroke(s, nd.w, d)
      if (d + 1 < maxDepth) {
        for (const b of [-g.rootSpread * 0.5, g.rootSpread * 0.5, jit(rng, 10)]) {
          if (rng() < 0.78) {
            next.push({
              x: s.x,
              y: s.y,
              a: s.a + b * (1 + g.angleJitter * (rng() * 2 - 1)),
              len: nd.len * 0.74,
              w: nd.w * g.branchRatio * 0.84,
            })
          }
        }
      }
    }
    frontier = next
  }
}

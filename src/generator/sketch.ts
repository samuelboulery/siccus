import { type Rng } from './rng'
import { nudge, sk, type Stem } from './geometry'
import { leafOrgan } from './leaf'
import type { Dot, Genome, LeafMargin, LeafType, Mark, Organ, Point, Stroke } from '../lib/types'

/**
 * Accumulateur de traits pendant la génération d'une planche.
 *
 * Seul endroit du générateur où l'on mute : un `Sketch` est local à un appel de
 * `buildPlate`, jamais partagé, et il est figé en données immuables au retour.
 * Construire quatre listes par `concat` successifs coûterait O(n²) pour ~2000 traits.
 */

export type OrganSpec = {
  x: number
  y: number
  ang: number
  size: number
  wave: number
  roll: number
  widthScale: number
  underside: boolean
  kind?: LeafType
  margin?: LeafMargin
  veins?: number
}

export type Sketch = {
  readonly strokes: Stroke[]
  readonly organs: Organ[]
  readonly dots: Dot[]
  readonly marks: Mark[]

  /** Un trait brut, tremblé proportionnellement à son épaisseur. */
  push(pts: readonly Point[], w: number, wave: number, pass?: number): void
  /** Une tige : passe principale + repasse claire si elle est assez épaisse. */
  stemStroke(s: Stem, w: number, wave: number): void
  /** Une feuille posée à un nœud. */
  organ(spec: OrganSpec): void
}

export function createSketch(genome: Genome, rng: Rng): Sketch {
  const strokes: Stroke[] = []
  const organs: Organ[] = []
  const dots: Dot[] = []
  const marks: Mark[] = []

  return {
    strokes,
    organs,
    dots,
    marks,

    push(pts, w, wave, pass = 0) {
      strokes.push({ d: sk(nudge(pts, rng, w * 0.22)), w: Math.max(0.1, w), wave, pass })
    },

    stemStroke(s, w, wave) {
      this.push(s.pts, w, wave)
      if (w > genome.thickness * 0.34) this.push(s.pts, w * 0.42, wave, 1)
    },

    organ(spec) {
      organs.push({
        x: spec.x,
        y: spec.y,
        ang: spec.ang,
        size: spec.size,
        wave: spec.wave,
        roll: spec.roll,
        widthScale: spec.widthScale,
        underside: spec.underside,
        shape: leafOrgan(
          spec.kind ?? genome.organType,
          spec.margin ?? genome.organMargin,
          spec.size,
          rng,
          genome.leafBend,
          spec.veins,
          spec.widthScale,
        ),
      })
    },
  }
}

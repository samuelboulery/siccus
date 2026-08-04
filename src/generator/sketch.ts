import { type Rng } from './rng'
import { nib, nibVarying, nudge, sk, type Stem } from './geometry'
import { leafOrgan } from './leaf'
import type { Dot, Genome, LeafMargin, LeafType, Mark, Organ, Point, Stroke } from '../lib/types'

/**
 * Accumulateur de traits pendant la génération d'une planche.
 *
 * Seul endroit du générateur où l'on mute : un `Sketch` est local à un appel de
 * `buildPlate`, jamais partagé, et il est figé en données immuables au retour.
 * Construire quatre listes par `concat` successifs coûterait O(n²) pour ~2000 traits.
 */

/**
 * En dessous de cette épaisseur, un contour fuselé est invisible et pèse deux
 * fois le trait qu'il remplace. Radicelles, vrilles et ramilles restent des
 * `stroke` d'épaisseur constante.
 */
const NIB_THRESHOLD = 0.4

/** Renflement du trait au milieu de sa course, en fraction de sa largeur. */
const BELLY = 0.16

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

  /**
   * Un trait de burin : gonfle au milieu, s'effile vers `w1`. `w1 = 0` donne une
   * extrémité en pointe — c'est ce qu'on veut sur une ramille terminale.
   */
  nib(pts: readonly Point[], w0: number, w1: number, wave: number): void
  /**
   * Un axe entier en un seul trait, dont l'épaisseur est donnée point par point.
   * C'est la forme normale : un axe découpé en un ruban par entre-nœud montre
   * une encoche à chaque jointure.
   */
  axis(pts: readonly Point[], widths: readonly number[], wave: number): void
  /** Un trait fin d'épaisseur constante. */
  hair(pts: readonly Point[], w: number, wave: number): void
  /** Une tige : trait de burin si elle est assez épaisse, cheveu sinon. */
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

    nib(pts, w0, w1, wave) {
      if (w0 < NIB_THRESHOLD) {
        this.hair(pts, w0, wave)
        return
      }
      /* Le tremblé va dans la MÉDIANE, jamais dans le contour extrudé : nudger
         les deux flancs indépendamment les fait diverger et hérisse le trait de
         pointes. Une main tremble, une largeur de trait non. */
      const spine = nudge(pts, rng, w0 * 0.16)
      strokes.push({
        d: sk(nib(spine, w0, w1, BELLY), true),
        w: w0,
        wave,
        kind: 'nib',
        spine: sk(spine),
      })
    },

    axis(pts, widths, wave) {
      const w0 = widths[0] ?? 0
      if (pts.length < 2) return
      if (w0 < NIB_THRESHOLD) {
        this.hair(pts, w0, wave)
        return
      }
      const spine = nudge(pts, rng, w0 * 0.1)
      strokes.push({
        d: sk(nibVarying(spine, widths), true),
        w: w0,
        wave,
        kind: 'nib',
        spine: sk(spine),
      })
    },

    hair(pts, w, wave) {
      strokes.push({
        d: sk(nudge(pts, rng, w * 0.22)),
        w: Math.max(0.1, w),
        wave,
        kind: 'hair',
      })
    },

    stemStroke(s, w, wave) {
      this.nib(s.pts, w, w * 0.72, wave)
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

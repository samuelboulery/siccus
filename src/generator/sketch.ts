import { r2, RAD, type Rng } from './rng'
import { nib, nibVarying, nudge, sk, type Stem } from './geometry'
import { leafOrgan } from './leaf'
import { hatchLevelOf, LIGHT_FROM, shadeSideOf } from './light'
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

/**
 * Au-delà de cette épaisseur, un axe cesse d'être un trait et devient un volume :
 * on le modèle au lieu de le remplir. En dessous, le contour vide se refermerait
 * sur lui-même et ne laisserait rien voir.
 */
const CYLINDER_THRESHOLD = 2.2

/**
 * Hachures transversales d'un axe épais, du côté opposé à la lumière.
 *
 * Chaque trait part du bord d'ombre et rentre vers l'intérieur ; le côté éclairé
 * reste du papier nu. C'est la manière la plus économique de faire tourner un
 * cylindre — et la seule qu'un graveur ait jamais eue.
 */
function cylinderShading(pts: readonly Point[], widths: readonly number[], rng: Rng): string {
  const lx = Math.cos(LIGHT_FROM * RAD)
  const ly = Math.sin(LIGHT_FROM * RAD)
  const parts: string[] = []

  /* On parcourt l'axe à pas d'ARC constant, pas de sommet en sommet : les
     sommets sont espacés d'un cinquième d'entre-nœud, ce qui donnerait une
     hachure tous les cinq millimètres — un peigne, pas un modelé. Un graveur
     espace ses traits à l'échelle du diamètre. */
  let travelled = 0
  let nextTick = 0

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!
    const b = pts[i + 1]!
    const segLength = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (segLength < 1e-6) continue

    while (nextTick <= travelled + segLength) {
      const f = (nextTick - travelled) / segLength
      const w = (widths[i] ?? 0) * (1 - f) + (widths[i + 1] ?? 0) * f
      nextTick += Math.max(0.85, w * 0.38)
      if (w < CYLINDER_THRESHOLD * 0.75) continue

      const px = a[0] + (b[0] - a[0]) * f
      const py = a[1] + (b[1] - a[1]) * f
      const m = segLength
      /* Normale à l'axe, retournée du côté qui fuit la lumière. */
      let nx = -(b[1] - a[1]) / m
      let ny = (b[0] - a[0]) / m
      if (nx * lx + ny * ly > 0) {
        nx = -nx
        ny = -ny
      }

      const half = w / 2
      /* Le trait part du bord d'ombre et s'arrête avant l'autre bord : la bande
         de papier laissée nue est le reflet, et c'est elle qui fait tourner le
         cylindre. */
      const depth = w * (0.55 + rng() * 0.28)
      const x0 = px + nx * half * 0.96
      const y0 = py + ny * half * 0.96
      parts.push(`M${r2(x0)},${r2(y0)} L${r2(x0 - nx * depth)},${r2(y0 - ny * depth)}`)
    }
    travelled += segLength
  }
  return parts.join(' ')
}

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
      const outline = sk(nibVarying(spine, widths), true)
      const spinePath = sk(spine)

      if (w0 < CYLINDER_THRESHOLD) {
        strokes.push({ d: outline, w: w0, wave, kind: 'nib', spine: spinePath })
        return
      }

      /* Au-delà de cette épaisseur, un axe rempli en plein se lit comme une
         bande de feutre. Une taille douce le modèle : contour vide, papier nu
         du côté éclairé, hachures transversales du côté de l'ombre. C'est ce
         qui fait tourner un cylindre. */
      strokes.push({
        d: outline,
        w: w0,
        lineWidth: Math.max(0.16, w0 * 0.075),
        wave,
        kind: 'cyl',
        spine: spinePath,
      })
      strokes.push({
        d: cylinderShading(spine, widths, rng),
        w: w0,
        lineWidth: Math.max(0.13, w0 * 0.055),
        wave,
        kind: 'shade',
        spine: spinePath,
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
        hatchLevel: hatchLevelOf(spec.ang, spec.underside, spec.widthScale),
        shape: leafOrgan(
          spec.kind ?? genome.organType,
          spec.margin ?? genome.organMargin,
          spec.size,
          rng,
          genome.leafBend,
          spec.veins,
          spec.widthScale,
          shadeSideOf(spec.ang),
        ),
      })
    },
  }
}

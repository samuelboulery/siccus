import { Fragment } from 'react'
import { jit, mulberry32, r2, type Rng } from '../../generator/rng'
import { sk } from '../../generator/geometry'
import { leafOrgan } from '../../generator/leaf'
import { DETAIL_BOXES } from './layout'
import type { DetailKind, Plate, Point } from '../../lib/types'

export { DETAIL_SCALES, detail2Scale } from './layout'

/**
 * Décalage du seed pour le flux des détails. Les détails ne doivent PAS puiser
 * dans le flux principal : ils sont dessinés au rendu, pas à la génération, et
 * s'ils partageaient l'instance ils déplaceraient toute la planche.
 */
const DETAIL_SEED_SALT = 0x9e37

type DetailPlatesProps = {
  plate: Plate
  animated: boolean
  /** Préfixe des identifiants de motif, partagé avec le reste de la planche. */
  idPrefix: string
}

/**
 * Les deux organes extraits et agrandis, numérotés ① ②.
 *
 * Ils ne coûtent presque rien — ce sont les mêmes fonctions de dessin que le
 * sujet, appelées à grande taille — et ils font passer le rendu d'« output
 * génératif » à « document d'étude ».
 */
export function DetailPlates({ plate, animated, idPrefix }: DetailPlatesProps) {
  const rng = mulberry32(plate.seed ^ DETAIL_SEED_SALT)
  const { ink, foliage } = plate.palette
  const [first, second] = DETAIL_BOXES

  return (
    <g
      style={animated ? { animation: 'sic-in 1.2s ease-out 2.1s both' } : undefined}
      aria-hidden="true"
    >
      <IsolatedLeaf
        plate={plate}
        cx={first.cx}
        cy={first.cy}
        ink={ink}
        wash={foliage}
        rng={rng}
        hatchFill={`url(#${idPrefix}-detail-hatch-2)`}
      />
      <SecondDetail
        kind={plate.detail2}
        cx={second.cx}
        cy={second.cy}
        ink={ink}
        wash={`url(#${idPrefix}-detail-hatch-2)`}
        rng={rng}
      />
    </g>
  )
}

type OrganProps = {
  cx: number
  cy: number
  ink: string
  wash: string
  rng: Rng
}

/**
 * Détail ① — la feuille isolée, face inférieure.
 * Même `leafOrgan` que la plante : le détail montre toujours l'organe du sujet.
 */
function IsolatedLeaf({
  plate,
  cx,
  cy,
  ink,
  rng,
  hatchFill,
}: OrganProps & { plate: Plate; hatchFill: string }) {
  const { organType, organMargin, leafBend } = plate.genome
  const size = organType === 'lineaire' ? 70 : 62
  /* Même fonction que la plante, à taille agrandie : le détail montre bien
     l'organe du sujet, hachures de modelé comprises. */
  const shape = leafOrgan(organType, organMargin, size, rng, leafBend * 0.5, 11, 1, 1)

  return (
    <g transform={`translate(${cx},${r2(cy + size / 2)})`}>
      <path
        d={shape.outline}
        fill={hatchFill}
        stroke={ink}
        strokeWidth={0.45}
        strokeLinejoin="round"
      />
      <path d={shape.hatch.join(' ')} fill="none" stroke={ink} strokeWidth={0.3} opacity={0.7} />
      <path d={shape.veins.join(' ')} fill="none" stroke={ink} strokeWidth={0.26} opacity={0.6} />
      <path d={shape.midrib} fill="none" stroke={ink} strokeWidth={0.42} opacity={0.85} />
      {shape.outline2 && (
        <path
          d={shape.outline2}
          fill="none"
          stroke={ink}
          strokeWidth={0.24}
          opacity={0.5}
          strokeLinejoin="round"
        />
      )}
    </g>
  )
}

function SecondDetail({ kind, ...props }: OrganProps & { kind: DetailKind }) {
  if (kind === 'coupe') return <StemSection {...props} />
  if (kind === 'ombelle') return <Umbel {...props} />
  return <Seed {...props} />
}

/** Détail ② — coupe transversale de tige : anneaux concentriques et rayons ligneux. */
function StemSection({ cx, cy, ink, wash, rng }: OrganProps) {
  const rings = Array.from({ length: 4 }, (_, i) => {
    const r = 22 - i * 5.6
    const pts: Point[] = []
    for (let k = 0; k <= 26; k++) {
      const a = (k / 26) * Math.PI * 2
      pts.push([Math.cos(a) * (r + jit(rng, 0.5)), Math.sin(a) * (r + jit(rng, 0.5))])
    }
    return { d: sk(pts, true), fill: i === 1 ? wash : 'none', width: i === 0 ? 0.55 : 0.3 }
  })

  const spokes = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2
    return `M${r2(Math.cos(a) * 11)},${r2(Math.sin(a) * 11)} L${r2(Math.cos(a) * 16.4)},${r2(Math.sin(a) * 16.4)}`
  })

  return (
    <g transform={`translate(${cx},${cy})`}>
      {rings.map((ring, i) => (
        <path
          key={i}
          d={ring.d}
          fill={ring.fill}
          stroke={ink}
          strokeWidth={ring.width}
        />
      ))}
      <path d={spokes.join(' ')} fill="none" stroke={ink} strokeWidth={0.2} opacity={0.5} />
    </g>
  )
}

/** Détail ② — inflorescence en ombelle : rayons et boutons. */
function Umbel({ cx, cy, ink, wash, rng }: OrganProps) {
  const rays = 15
  const items = Array.from({ length: rays }, (_, i) => {
    const a = -168 + i * (156 / (rays - 1)) + jit(rng, 4)
    const len = 16 + rng() * 7
    const end: Point = [Math.cos(a * (Math.PI / 180)) * len, Math.sin(a * (Math.PI / 180)) * len]
    const mid: Point = [end[0] * 0.5 + jit(rng, 1.4), end[1] * 0.5 + jit(rng, 1.4)]
    return { d: sk([[0, 0], mid, end]), end, r: 1.5 + rng() * 0.9 }
  })

  return (
    <g transform={`translate(${cx},${r2(cy + 14)})`}>
      {items.map((item, i) => (
        <Fragment key={i}>
          <path d={item.d} fill="none" stroke={ink} strokeWidth={0.28} />
          <circle
            cx={r2(item.end[0])}
            cy={r2(item.end[1])}
            r={r2(item.r)}
            fill={wash}
            stroke={ink}
            strokeWidth={0.22}
          />
        </Fragment>
      ))}
    </g>
  )
}

/** Détail ② — graine mûre : téguments doublés, hachures et hile. */
function Seed({ cx, cy, ink, wash, rng }: OrganProps) {
  const ring = (rx: number, ry: number, jx: number, jy: number): Point[] => {
    const pts: Point[] = []
    for (let k = 0; k <= 28; k++) {
      const a = (k / 28) * Math.PI * 2
      pts.push([Math.cos(a) * (rx + jit(rng, jx)), Math.sin(a) * (ry + jit(rng, jy))])
    }
    return pts
  }
  const outer = ring(14, 20, 0.4, 0.5)
  const halo = ring(14.9, 21, 0.5, 0.5)
  const hatch = Array.from(
    { length: 9 },
    (_, i) => `M${r2(-11 + i * 2.6)},${r2(-8 + i * 1.4)} L${r2(-4 + i * 2.6)},${r2(2 + i * 1.4)}`,
  )

  return (
    <g transform={`translate(${cx},${cy})`}>
      <path d={sk(outer, true)} fill={wash} stroke={ink} strokeWidth={0.5} />
      <path d={sk(halo, true)} fill="none" stroke={ink} strokeWidth={0.22} opacity={0.45} />
      <path d={hatch.join(' ')} fill="none" stroke={ink} strokeWidth={0.2} opacity={0.4} />
      <path d="M-6,-13 Q4,0 -3,14" fill="none" stroke={ink} strokeWidth={0.34} opacity={0.7} />
    </g>
  )
}

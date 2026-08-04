import { Fragment } from 'react'
import { jit, mulberry32, r2, RAD, type Rng } from '../../generator/rng'
import { sk } from '../../generator/geometry'
import { LIGHT_FROM } from '../../generator/light'
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
        hatchFill={`url(#${idPrefix}-detail-hatch-1)`}
      />
      <SecondDetail
        kind={plate.detail2}
        cx={second.cx}
        cy={second.cy}
        ink={ink}
        /* Niveau 1 comme la figure ① : au pas serré du niveau 2, le tramé moire
           à l'écran sur les grandes surfaces pleines. */
        wash={`url(#${idPrefix}-detail-hatch-1)`}
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
      {/* Hiérarchie d'épaisseur : médiane, puis nervures, puis hachures. Sans
          elle les trois systèmes ont le même poids et se battent. */}
      <path d={shape.hatch.join(' ')} fill="none" stroke={ink} strokeWidth={0.2} opacity={0.6} />
      <path d={shape.veins.join(' ')} fill="none" stroke={ink} strokeWidth={0.3} opacity={0.78} />
      <path d={shape.midrib} fill="none" stroke={ink} strokeWidth={0.55} opacity={0.9} />
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

/** Contour fermé d'un anneau irrégulier — la main du graveur, pas le compas. */
function ring(rx: number, ry: number, wobble: number, rng: Rng, steps = 30): string {
  const pts: Point[] = []
  for (let k = 0; k <= steps; k++) {
    const a = (k / steps) * Math.PI * 2
    pts.push([Math.cos(a) * (rx + jit(rng, wobble)), Math.sin(a) * (ry + jit(rng, wobble))])
  }
  return sk(pts, true)
}

/**
 * Moucheture : des points, obtenus par des segments d'un centième d'unité à bouts
 * ronds. Quatorze caractères par point — un `<circle>` en coûterait quatre fois
 * plus, et il en faut des centaines.
 */
function stipple(count: number, radius: number, rng: Rng, inner = 0): string {
  const parts: string[] = []
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2
    const r = inner + Math.sqrt(rng()) * (radius - inner)
    parts.push(`M${r2(Math.cos(a) * r)},${r2(Math.sin(a) * r)} l0.01 0`)
  }
  return parts.join(' ')
}

/**
 * Détail ② — coupe transversale de tige.
 *
 * Une vraie coupe montre une ANATOMIE : épiderme, cortex, un anneau de faisceaux
 * conducteurs séparés, des rayons médullaires entre eux, et la moelle au centre.
 * Quatre cercles concentriques et vingt-deux rayons ne disaient rien de tout ça.
 */
function StemSection({ cx, cy, ink, wash, rng }: OrganProps) {
  const R = 24
  const bundles = 9 + Math.floor(rng() * 4)
  const bundleRing = R * 0.62

  const rays: string[] = []
  const lenses: { d: string; core: string }[] = []
  for (let i = 0; i < bundles; i++) {
    const a = (i / bundles) * Math.PI * 2 + jit(rng, 0.06)
    const ux = Math.cos(a)
    const uy = Math.sin(a)
    /* Le faisceau : une lentille orientée dans le rayon, xylème vers l'intérieur. */
    const half = (Math.PI * bundleRing) / bundles / 2.6
    const depth = R * 0.17
    const cxb = ux * bundleRing
    const cyb = uy * bundleRing
    const pts: Point[] = []
    for (let k = 0; k <= 16; k++) {
      const t = (k / 16) * Math.PI * 2
      pts.push([
        cxb + ux * Math.cos(t) * depth - uy * Math.sin(t) * half,
        cyb + uy * Math.cos(t) * depth + ux * Math.sin(t) * half,
      ])
    }
    lenses.push({
      d: sk(pts, true),
      core: `M${r2(cxb - uy * half * 0.55)},${r2(cyb + ux * half * 0.55)} L${r2(cxb + uy * half * 0.55)},${r2(cyb - ux * half * 0.55)}`,
    })
    /* Rayon médullaire : il court ENTRE deux faisceaux, pas au travers. */
    const between = a + Math.PI / bundles
    rays.push(
      `M${r2(Math.cos(between) * R * 0.22)},${r2(Math.sin(between) * R * 0.22)} ` +
        `L${r2(Math.cos(between) * R * 0.82)},${r2(Math.sin(between) * R * 0.82)}`,
    )
  }

  return (
    <g transform={`translate(${cx},${cy})`}>
      {/* Épiderme en double filet : la paroi a une épaisseur. */}
      <path d={ring(R, R, 0.4, rng)} fill={wash} stroke={ink} strokeWidth={0.55} />
      <path d={ring(R * 0.93, R * 0.93, 0.35, rng)} fill="none" stroke={ink} strokeWidth={0.25} opacity={0.7} />

      {/* Cortex moucheté — le parenchyme, granuleux sous la loupe. */}
      <path
        d={stipple(150, R * 0.9, rng, R * 0.72)}
        stroke={ink}
        strokeWidth={0.34}
        strokeLinecap="round"
        opacity={0.55}
      />

      <path d={rays.join(' ')} fill="none" stroke={ink} strokeWidth={0.16} opacity={0.5} />

      {lenses.map((lens, i) => (
        <Fragment key={i}>
          <path d={lens.d} fill="none" stroke={ink} strokeWidth={0.3} />
          <path d={lens.core} stroke={ink} strokeWidth={0.5} opacity={0.85} />
        </Fragment>
      ))}

      {/* Moelle : plus claire que le reste, elle creuse le centre. */}
      <path d={ring(R * 0.3, R * 0.3, 0.3, rng)} fill={wash} stroke={ink} strokeWidth={0.28} />
    </g>
  )
}

/**
 * Détail ② — inflorescence en ombelle composée.
 *
 * Involucre de bractées à la base, rayons primaires de longueurs inégales,
 * chacun portant une ombellule de petites fleurs. Des rayons terminés par des
 * points n'étaient qu'un schéma.
 */
function Umbel({ cx, cy, ink, wash, rng }: OrganProps) {
  const rays = 9 + Math.floor(rng() * 4)
  const spread = 150

  const umbels = Array.from({ length: rays }, (_, i) => {
    const a = -90 - spread / 2 + (i / (rays - 1)) * spread + jit(rng, 4)
    /* Les rayons extérieurs sont plus longs : c'est ce qui donne à une ombelle
       son sommet plat plutôt qu'une boule. */
    const edge = Math.abs(i / (rays - 1) - 0.5) * 2
    const len = 22 + edge * 8 + rng() * 4
    const tip: Point = [Math.cos(a * RAD) * len, Math.sin(a * RAD) * len]
    const florets = 5 + Math.floor(rng() * 3)

    return {
      ray: sk([[0, 0], [tip[0] * 0.55 + jit(rng, 1.2), tip[1] * 0.55 + jit(rng, 1.2)], tip]),
      tip,
      florets: Array.from({ length: florets }, (_, k) => {
        const fa = a - 60 + (k / (florets - 1)) * 120 + jit(rng, 8)
        const fl = 3.6 + rng() * 2
        return {
          stalk: `M${r2(tip[0])},${r2(tip[1])} L${r2(tip[0] + Math.cos(fa * RAD) * fl)},${r2(tip[1] + Math.sin(fa * RAD) * fl)}`,
          at: [tip[0] + Math.cos(fa * RAD) * fl, tip[1] + Math.sin(fa * RAD) * fl] as Point,
        }
      }),
    }
  })

  /* Involucre : la collerette de bractées d'où partent tous les rayons. */
  const bracts = Array.from({ length: 6 }, (_, i) => {
    const a = -90 - 55 + (i / 5) * 110 + jit(rng, 5)
    const len = 6.5 + rng() * 2.5
    return `M0,0 L${r2(Math.cos(a * RAD) * len)},${r2(Math.sin(a * RAD) * len)}`
  })

  return (
    <g transform={`translate(${cx},${r2(cy + 16)})`}>
      <path d={bracts.join(' ')} fill="none" stroke={ink} strokeWidth={0.3} opacity={0.75} />
      {umbels.map((u, i) => (
        <Fragment key={i}>
          <path d={u.ray} fill="none" stroke={ink} strokeWidth={0.3} />
          <path d={u.florets.map((f) => f.stalk).join(' ')} fill="none" stroke={ink} strokeWidth={0.16} opacity={0.7} />
          {u.florets.map((f, k) => (
            <Floret key={k} at={f.at} ink={ink} wash={wash} rng={rng} />
          ))}
        </Fragment>
      ))}
    </g>
  )
}

/** Une fleur d'ombellule : cinq pétales et un centre. Deux millimètres sur la planche. */
function Floret({ at, ink, wash, rng }: { at: Point; ink: string; wash: string; rng: Rng }) {
  const r = 1.35 + rng() * 0.5
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = -90 + i * 72 + jit(rng, 7)
    return `M${r2(at[0])},${r2(at[1])} L${r2(at[0] + Math.cos(a * RAD) * r)},${r2(at[1] + Math.sin(a * RAD) * r)}`
  })
  return (
    <>
      <path d={petals.join(' ')} fill="none" stroke={ink} strokeWidth={0.15} opacity={0.85} />
      <circle cx={r2(at[0])} cy={r2(at[1])} r={r2(r * 0.42)} fill={wash} stroke={ink} strokeWidth={0.14} />
    </>
  )
}

/**
 * Détail ② — graine mûre.
 *
 * Une graine a des repères : le raphé, arête du cordon nourricier soudé au
 * tégument ; le hile, cicatrice laissée par le détachement ; le micropyle, à sa
 * pointe. Sans eux c'était un caillou hachuré.
 */
function Seed({ cx, cy, ink, wash, rng }: OrganProps) {
  const rx = 15
  const ry = 22
  /* Côté à l'ombre, cohérent avec l'éclairage de toute la planche. */
  const sx = Math.cos((LIGHT_FROM + 180) * RAD)
  const sy = Math.sin((LIGHT_FROM + 180) * RAD)

  /* Le point de l'ellipse le plus enfoncé dans l'ombre. On balaie un demi-tour
     centré sur lui — et on parcourt l'ellipse par SON paramètre, pas en faisant
     tourner une ellipse droite : la rotation d'une paramétrisation axiale ne
     reste pas sur la courbe, et les hachures partaient en épines au-dehors. */
  const center = Math.atan2(sy / ry, sx / rx)
  const shading: string[] = []
  for (let i = 0; i <= 26; i++) {
    const offset = (i / 26 - 0.5) * Math.PI
    const th = center + offset
    const px = Math.cos(th) * rx
    const py = Math.sin(th) * ry
    /* Normale extérieure d'une ellipse : (cos/rx, sin/ry), à normaliser. */
    let nx = Math.cos(th) / rx
    let ny = Math.sin(th) / ry
    const nm = Math.hypot(nx, ny) || 1
    nx /= nm
    ny /= nm
    /* Le trait est le plus long en plein cœur de l'ombre et meurt aux bords. */
    const depth = 1.6 + Math.cos(offset) * 5.4
    shading.push(
      `M${r2(px - nx * 0.35)},${r2(py - ny * 0.35)} L${r2(px - nx * depth)},${r2(py - ny * depth)}`,
    )
  }

  return (
    <g transform={`translate(${cx},${cy})`}>
      <path d={ring(rx, ry, 0.45, rng)} fill={wash} stroke={ink} strokeWidth={0.55} />

      {/* Tégument granuleux. */}
      <path
        d={stipple(110, rx * 0.84, rng)}
        stroke={ink}
        strokeWidth={0.3}
        strokeLinecap="round"
        opacity={0.4}
      />

      {/* Modelé : hachures serrées du côté opposé à la lumière. */}
      <path d={shading.join(' ')} fill="none" stroke={ink} strokeWidth={0.22} opacity={0.75} />

      {/* Le raphé : l'arête qui court du hile au sommet. */}
      <path
        d={sk([
          [-rx * 0.42, ry * 0.82],
          [rx * 0.12, 0],
          [-rx * 0.1, -ry * 0.88],
        ])}
        fill="none"
        stroke={ink}
        strokeWidth={0.42}
        opacity={0.9}
      />

      {/* Le hile, cicatrice du détachement, et le micropyle à sa pointe. */}
      <ellipse
        cx={r2(-rx * 0.42)}
        cy={r2(ry * 0.8)}
        rx={2.6}
        ry={1.5}
        transform={`rotate(-28 ${r2(-rx * 0.42)} ${r2(ry * 0.8)})`}
        fill="none"
        stroke={ink}
        strokeWidth={0.38}
      />
      <circle cx={r2(-rx * 0.42 + 3)} cy={r2(ry * 0.76)} r={0.5} fill={ink} opacity={0.8} />
    </g>
  )
}

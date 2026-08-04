import { jit, type Rng } from './rng'
import { stem } from './geometry'
import type { Sketch } from './sketch'
import type { Genome, Phyllotaxy, Point } from '../lib/types'

/**
 * Le moteur d'axes.
 *
 * Une plante ne se ramifie pas n'importe où : un nœud porte une feuille, et c'est
 * à l'AISSELLE de cette feuille qu'un bourgeon peut débourrer en rameau. C'est le
 * même événement. Tant que les branches naissaient à la fin d'un segment et les
 * feuilles ailleurs, on obtenait une arborescence — pas une plante.
 *
 * Un axe se construit donc entre-nœud par entre-nœud :
 *
 *     roll += angle phyllotaxique
 *     poser la ou les feuilles du nœud, orientées par roll
 *     évaluer le bourgeon axillaire
 *     s'il débourre, lancer un axe fille DANS l'aisselle
 *
 * L'axe est son propre continuateur : la dominance apicale n'a pas besoin d'être
 * simulée, elle tombe de la structure. Les filles sont, par construction, plus
 * courtes et plus fines que la poursuite de l'axe.
 */

/** Angles de divergence, en degrés. */
const DIVERGENCE: Record<Phyllotaxy, number> = {
  /** La spirale de Fibonacci — 360° / φ². */
  alterne: 137.5,
  /** Décussé : chaque paire tourne d'un quart de tour sur la précédente. */
  opposee: 90,
  verticillee: 120,
}

/** Nombre de feuilles par nœud. */
const LEAVES_PER_NODE: Record<Phyllotaxy, number> = {
  alterne: 1,
  opposee: 2,
  verticillee: 3,
}

/**
 * Exposant du modèle du tuyau (Shinozaki) : la section d'un axe se conserve à
 * travers ses ramifications, `w_parent^E = Σ w_fille^E`. Entre 2 (conduction pure)
 * et 3 (tenue mécanique pure) ; 2,4 est la valeur mesurée sur la plupart des
 * ligneux. C'est elle qui fait qu'un tronc PORTE visuellement sa ramure — une
 * décroissance à facteur constant perd de la matière à chaque fourche.
 */
const PIPE_EXPONENT = 2.4

/** Angle d'insertion de la feuille sur l'axe, en degrés. */
const INSERTION = 58

/** Plafond global de nœuds. La coupe se fait EN PROFONDEUR, jamais en milieu d'axe. */
const MAX_NODES = 1400

/** Réglages d'architecture. Les cinq ports en sont cinq jeux. */
export type Architecture = {
  /** Direction visée par l'axe fondateur, en degrés. -90 = vers le haut. */
  target: number
  /** Fraction de redressement vers la cible, sur l'axe fondateur. Orthotropisme. */
  upright: number
  /**
   * Amortissement du redressement d'un ordre au suivant.
   *
   * L'axe fondateur est orthotrope — il vise la verticale. Une latérale ne l'est
   * pas : elle est PLAGIOTROPE, elle garde la mémoire de sa direction de départ
   * et s'écarte. Sans cet amortissement, chaque rameau se redresse aussitôt et la
   * plante devient une colonne de brindilles verticales.
   */
  orderDamping: number
  /** Affaissement gravitropique, en degrés, croissant vers l'extrémité. */
  droop: number
  /** Une latérale s'affaisse davantage que l'axe qui la porte. */
  droopGrowth: number
  /** Écart au départ d'une latérale, en multiples de `angleBase`. */
  branchAngle: number
  /**
   * −1 basitone … +1 acrotone. Où naissent les latérales vigoureuses : à la base
   * (un arbuste) ou vers l'apex (un arbre). C'est ce réglage, plus que tout autre,
   * qui décide de la silhouette.
   */
  acrotony: number
  /** Proportion de bourgeons axillaires qui débourrent. */
  branchRate: number
  /** Ordre de ramification maximal. 0 = aucun rameau. */
  maxOrder: number
  /** Part de la section reprise par une latérale. Le reste poursuit l'axe. */
  lateralShare: number
  /** Longueur d'une latérale, relative à l'entre-nœud du parent. */
  lateralScale: number
  /** Des feuilles aux nœuds ? Faux pour les racines. */
  leaves: boolean
  /** Irrégularité de la direction, en degrés par entre-nœud. */
  wobble: number
}

export type AxisSpec = {
  x: number
  y: number
  /** Direction initiale, en degrés. */
  angle: number
  /** Angle phyllotaxique au premier nœud. */
  roll: number
  /** Épaisseur à la base. */
  width: number
  /** Longueur d'entre-nœud de référence. */
  internode: number
  /** Nombre d'entre-nœuds. */
  internodes: number
  /** 0 = axe fondateur. */
  order: number
  /** Vague d'animation du premier nœud : la croissance est acropète. */
  wave: number
  /** Direction visée par CET axe. Une latérale vise sa propre direction de départ. */
  target: number
  /** Force du redressement de CET axe, amortie à chaque ordre. */
  upright: number
  /** Affaissement de CET axe, majoré à chaque ordre. */
  droop: number
}

type Budget = { nodes: number; maxWave: number }

export function createBudget(): Budget {
  return { nodes: 0, maxWave: 1 }
}

/** Un axe fondateur prend les tropismes de l'architecture ; ses filles les héritent amortis. */
export function founding(
  arch: Architecture,
  spec: Omit<AxisSpec, 'target' | 'upright' | 'droop'>,
): AxisSpec {
  return { ...spec, target: arch.target, upright: arch.upright, droop: arch.droop }
}

/** Gradient d'entre-nœuds : court au démarrage, long en pleine vigueur, court à l'apex. */
const internodeAt = (base: number, u: number): number =>
  base * (0.55 + 0.45 * Math.sin(Math.PI * u))

/**
 * Vigueur du bourgeon axillaire selon sa position sur l'axe.
 * `acrotony` = +1 → maximale à l'apex ; −1 → maximale à la base.
 */
const budVigour = (u: number, acrotony: number): number => {
  const towardApex = 0.25 + 0.75 * u
  const towardBase = 1 - 0.75 * u
  const t = (acrotony + 1) / 2
  return towardBase * (1 - t) + towardApex * t
}

/** Où l'axe s'est arrêté. Les ports y accrochent leurs organes terminaux. */
export type Apex = { x: number; y: number; angle: number; wave: number }

/**
 * Fait croître un axe et, récursivement, ses rameaux.
 *
 * ⚠ Consomme `rng` dans un ordre qui fige l'apparence de toutes les plantes.
 * Voir l'encadré de genome.ts.
 */
export function growAxis(
  sketch: Sketch,
  g: Genome,
  arch: Architecture,
  spec: AxisSpec,
  rng: Rng,
  budget: Budget,
): Apex {
  const divergence = DIVERGENCE[g.phyllotaxy]
  const perNode = LEAVES_PER_NODE[g.phyllotaxy]

  let { x, y, angle, roll } = spec
  /* La section, pas l'épaisseur : c'est elle qui se conserve aux fourches. */
  let section = Math.pow(spec.width, PIPE_EXPONENT)
  let lastWave = spec.wave

  /* L'axe s'accumule et n'est tracé qu'une fois, à la fin, en un seul trait
     continu. Émettre un ruban par entre-nœud produirait une encoche et un
     ressaut de largeur à chaque jointure. */
  const path: Point[] = [[x, y]]
  const widths: number[] = [spec.width]

  for (let i = 0; i < spec.internodes; i++) {
    if (budget.nodes >= MAX_NODES) break
    budget.nodes++

    const u = spec.internodes > 1 ? i / (spec.internodes - 1) : 0
    const length = internodeAt(spec.internode, u) * (0.85 + rng() * 0.3)

    /* Tropismes : redressement vers la cible, puis affaissement croissant vers
       l'extrémité. C'est ce qui donne la branche arquée — elle part vers le haut
       et retombe — qu'aucun L-system ne produit tout seul. */
    const turn =
      (spec.target - angle) * spec.upright + spec.droop * (0.35 + 1.3 * u) + jit(rng, arch.wobble)

    /* Deux décroissances se composent : la loi de section, qui retire de la
       matière à chaque rameau, et l'amincissement propre de l'axe entre deux
       nœuds. Sans la seconde, un axe peu ramifié garde son épaisseur jusqu'à
       l'apex et se lit comme un tuyau. */
    const trunk = Math.pow(section, 1 / PIPE_EXPONENT)
    const uNext = spec.internodes > 1 ? (i + 1) / (spec.internodes - 1) : 1
    const last = i === spec.internodes - 1
    const width = Math.max(0.12, trunk * (1 - 0.62 * u))
    /* Le dernier entre-nœud s'effile presque en pointe : une ramille terminale
       ne se termine pas par un bout carré. */
    const widthEnd = last ? width * 0.22 : Math.max(0.1, trunk * (1 - 0.62 * Math.min(1, uNext)))

    /* Cinq pas par entre-nœud : en dessous, le ruban extrudé devient anguleux et
       le trait cesse de se lire comme une courbe. */
    const segment = stem(x, y, angle, length, turn, rng, 1.1, 5)
    const wave = spec.wave + i

    /* Les points de l'entre-nœud rejoignent l'axe, avec leur largeur interpolée.
       Le premier est sauté : c'est le dernier du précédent. */
    for (let k = 1; k < segment.pts.length; k++) {
      const f = k / (segment.pts.length - 1)
      path.push(segment.pts[k]!)
      widths.push(width + (widthEnd - width) * f)
    }

    if (wave > budget.maxWave) budget.maxWave = wave
    lastWave = wave

    x = segment.x
    y = segment.y
    angle = segment.a
    roll += divergence

    /* ── le nœud ────────────────────────────────────────────────────────────
       Feuilles d'abord, rameaux ensuite : le rameau part à l'aisselle de la
       feuille dont il partage l'azimut. */
    const sides: number[] = []
    for (let k = 0; k < perNode; k++) {
      const leafRoll = roll + (k * 360) / perNode
      const side = Math.cos((leafRoll * Math.PI) / 180)
      sides.push(side)

      if (arch.leaves) {
        /* Projection du raccourci : une feuille qui pointe vers l'observateur se
           voit courte et étroite ; une feuille de profil se voit en entier. */
        const lengthScale = 0.42 + 0.58 * Math.abs(side)
        const widthScale = 0.18 + 0.82 * Math.abs(side)
        const vigour = 0.75 + 0.5 * Math.sin(Math.PI * Math.min(1, u + 0.15))

        sketch.organ({
          x,
          y,
          /* `side` porte le signe : à ±1 la feuille sort perpendiculairement,
             à 0 elle pointe dans l'axe, donc vers l'observateur. */
          ang: angle + INSERTION * side,
          size: g.leafSize * vigour * lengthScale * (0.85 + rng() * 0.3),
          wave: wave + 1,
          roll: leafRoll,
          widthScale,
          underside: Math.sin((leafRoll * Math.PI) / 180) < 0,
        })
      }
    }

    /* ── le bourgeon axillaire ──────────────────────────────────────────── */
    if (spec.order < arch.maxOrder && i > 0 && budget.nodes < MAX_NODES) {
      const vigour = budVigour(u, arch.acrotony)
      if (rng() < arch.branchRate * vigour) {
        const side = sides[Math.floor(rng() * sides.length)] ?? 1
        const lateralSection = section * arch.lateralShare
        section -= lateralSection

        const launch =
          angle +
          g.angleBase *
            arch.branchAngle *
            (side >= 0 ? 1 : -1) *
            (1 + g.angleJitter * (rng() * 2 - 1))

        growAxis(
          sketch,
          g,
          arch,
          {
            x,
            y,
            angle: launch,
            roll: roll + divergence * 0.5,
            width: Math.pow(lateralSection, 1 / PIPE_EXPONENT),
            internode: spec.internode * arch.lateralScale,
            internodes: Math.max(2, Math.round(spec.internodes * 0.62 * vigour)),
            order: spec.order + 1,
            wave: wave + 1,
            /* La latérale vise SA direction de départ, pas la verticale : c'est
               la définition du plagiotropisme, et ce qui écarte la ramure. */
            target: launch,
            upright: spec.upright * arch.orderDamping,
            droop: spec.droop * arch.droopGrowth,
          },
          rng,
          budget,
        )
      }
    }
  }

  sketch.axis(path, widths, spec.wave)

  return { x, y, angle, wave: lastWave }
}

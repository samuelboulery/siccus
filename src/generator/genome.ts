import { jit, type Rng } from './rng'
import { PALETTES } from './palettes'
import type { Genome, LeafMargin, LeafType, Palette, Phyllotaxy, PortId } from '../lib/types'

export const PORT_IDS: readonly PortId[] = [
  'arbustif',
  'rosette',
  'graminee',
  'grimpant',
  'fougere',
] as const

const PHYLLOTAXIES: readonly Phyllotaxy[] = ['alterne', 'opposee', 'verticillee'] as const

const LEAF_TYPES: readonly LeafType[] = [
  'ovale',
  'lanceolee',
  'cordee',
  'spatulee',
  'obovale',
  'lineaire',
] as const

const MARGINS: readonly LeafMargin[] = ['entiere', 'dentee', 'lobee'] as const

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  ORDRE DE CONSOMMATION FIGÉ — NE JAMAIS INSÉRER AU MILIEU.               ║
 * ║                                                                          ║
 * ║  Chaque appel à `rng()` ci-dessous alimente un paramètre précis. Insérer  ║
 * ║  un tirage entre deux lignes décale tout ce qui suit et change           ║
 * ║  rétroactivement TOUTES les plantes déjà générées — sans la moindre       ║
 * ║  erreur visible. Un mot offert il y a six mois ne rendrait plus la même   ║
 * ║  planche.                                                                ║
 * ║                                                                          ║
 * ║  Tout nouveau paramètre s'ajoute À LA FIN, après le n° 13.                ║
 * ║  `src/generator/determinism.test.ts` fait tomber la build sinon.          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Les fourchettes sont volontairement étroites : c'est ce qui garantit qu'aucune
 * plante n'est ratée. Cent variations dont zéro mauvaise valent mieux que mille
 * dont trois cents sont médiocres.
 *
 * @param wordLength longueur du mot normalisé, espaces exclus. Module `depth` et
 *   `density` : mot court = plante épurée, mot long = plante foisonnante.
 */
export function buildGenome(rng: Rng, wordLength: number): { genome: Genome; palette: Palette } {
  const portId = PORT_IDS[Math.floor(rng() * PORT_IDS.length)]! //  1 · port
  const angleBase = 18 + rng() * 17 //  2 · 18–35°, ouverture du branchement
  const angleJitter = 0.1 + rng() * 0.1 //  3 · 0.10–0.20, irrégularité des rotations
  const branchRatio = 0.62 + rng() * 0.16 //  4 · 0.62–0.78, décroissance longueur/épaisseur
  const depth = Math.min(11, Math.max(7, Math.round(6 + wordLength * 0.42 + rng() * 1.6))) //  5
  const curvature = rng() * 0.4 //  6 · 0–0.4, ondulation des segments
  const thickness = 6 + rng() * 4 //  7 · 6–10, épaisseur du tronc
  const phyllotaxy = PHYLLOTAXIES[Math.floor(rng() * PHYLLOTAXIES.length)]! //  8
  const leafType = LEAF_TYPES[Math.floor(rng() * LEAF_TYPES.length)]! //  9
  const margin = MARGINS[Math.floor(rng() * MARGINS.length)]! // 10
  const rootSpread = 45 + rng() * 25 // 11 · 45–70°, ouverture racinaire
  const palette = PALETTES[Math.floor(rng() * PALETTES.length)]! // 12
  const leafBend = jit(rng, 26) // 13 · courbure du limbe
  /* ─────────── fin de la chaîne de tirages · ajouter ici, jamais avant ─────────── */

  /* Dérivés — ne consomment rien. */
  const leafSize = thickness * 2.9

  /* L'organe réellement dessiné. Une graminée porte des limbes linéaires quel que
     soit `leafType` ; une fougère, des pennes lancéolées et dentées. Le détail
     agrandi de la planche utilise `organType`/`organMargin`, donc il montre
     toujours l'organe présent sur la plante. */
  const organType: LeafType =
    portId === 'graminee' ? 'lineaire' : portId === 'fougere' ? 'lanceolee' : leafType
  const organMargin: LeafMargin =
    portId === 'fougere'
      ? margin === 'entiere'
        ? 'dentee'
        : margin
      : portId === 'graminee'
        ? 'entiere'
        : margin

  const density = Math.min(1, 0.52 + wordLength / 22)

  return {
    genome: {
      portId,
      angleBase,
      angleJitter,
      branchRatio,
      depth,
      curvature,
      thickness,
      phyllotaxy,
      leafType,
      margin,
      rootSpread,
      leafBend,
      leafSize,
      organType,
      organMargin,
      density,
    },
    palette,
  }
}

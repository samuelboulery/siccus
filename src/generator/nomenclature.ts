import type { Rng } from './rng'
import type { DetailKind, Epithet, Genome } from '../lib/types'

/**
 * Le nom latin. Deux listes de fragments piochées par le seed, plus un épithète
 * DÉRIVÉ DES TRAITS RÉELS du génome : le nom décrit vraiment la plante affichée.
 * Personne ne le vérifiera ; tout le monde le sentira.
 *
 * Ces fragments ne sont pas traduits — le latin est la langue de l'herbier.
 */
const PREFIX = [
  'Vulpi',
  'Cirsi',
  'Anthe',
  'Lyco',
  'Sperma',
  'Draco',
  'Astra',
  'Cauli',
  'Nervi',
  'Umbri',
  'Salvi',
  'Thala',
  'Corni',
  'Erya',
] as const

const SUFFIX = [
  'anthus',
  'folia',
  'spina',
  'rhiza',
  'carpa',
  'phylla',
  'stemon',
  'nervia',
  'calyx',
  'pogon',
] as const

const DETAIL_KINDS: readonly DetailKind[] = ['coupe', 'graine', 'ombelle'] as const

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as const

/** Nombre d'entrées attendues côté contenu localisé. Le type `Content` les fige. */
export const LOCI_COUNT = 7
export const NOTES_COUNT = 8

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/** L'épithète décrit un trait mesurable de la plante, pas un tirage. */
function epithetOf(g: Genome): Epithet {
  if (g.curvature > 0.28) return 'contorta'
  if (g.depth <= 7) return 'nana'
  if (g.thickness < 7.5) return 'gracilis'
  if (g.phyllotaxy === 'alterne') return 'alterna'
  return 'robusta'
}

/** `04.VIII.2026` — mois en chiffres romains, convention d'herbier, sans langue. */
export function herbariumDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = ROMAN[date.getMonth()] ?? 'I'
  return `${day}.${month}.${date.getFullYear()}`
}

export type Nomenclature = {
  latin: string
  oldName: string
  family: string
  epithet: Epithet
  locusIndex: number
  altitude: number
  noteIndex: number
  note2Index: number
  detail2: DetailKind
  specimen: number
  folio: number
  stampAngle: number
}

/**
 * ⚠ ORDRE DE CONSOMMATION FIGÉ, suite de `buildGenome` puis de la croissance.
 * Les index renvoyés (`locusIndex`, `noteIndex`…) sont volontairement des nombres :
 * c'est ce qui rend la planche identique dans toutes les langues.
 */
export function buildNomenclature(rng: Rng, g: Genome, seed: number): Nomenclature {
  const prefix = PREFIX[Math.floor(rng() * PREFIX.length)]! // 1
  const genus = prefix + SUFFIX[Math.floor(rng() * SUFFIX.length)]! // 2
  const epithet = epithetOf(g) //   dérivé
  const oldGenus =
    PREFIX[Math.floor(rng() * PREFIX.length)]! + SUFFIX[Math.floor(rng() * SUFFIX.length)]! // 3, 4
  const locusIndex = Math.floor(rng() * LOCI_COUNT) // 5
  const altitude = 180 + Math.floor(rng() * 1900) // 6
  const noteIndex = Math.floor(rng() * NOTES_COUNT) // 7
  const note2Index = Math.floor(rng() * NOTES_COUNT) // 8
  const detail2 = DETAIL_KINDS[Math.floor(rng() * DETAIL_KINDS.length)]! // 9

  return {
    latin: `${capitalize(genus)} ${epithet}`,
    oldName: `${capitalize(oldGenus)} sp.`,
    family: `${prefix}aceae`,
    epithet,
    locusIndex,
    altitude,
    noteIndex,
    note2Index,
    detail2,
    /* Dérivés du hash, pas du flux : collectionnables sans base de données. */
    specimen: 1000 + (seed % 9000),
    folio: 1 + (seed % 240),
    stampAngle: -6 + (seed % 11),
  }
}

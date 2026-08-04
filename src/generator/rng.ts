/**
 * Socle déterministe de Siccus.
 *
 * RÈGLE ABSOLUE : `Math.random()` est interdit dans tout le projet (voir eslint.config.js).
 * Toute valeur aléatoire dérive de `xmur3(normalize(mot))` → `mulberry32(seed)`, et
 * l'instance `rng` est PASSÉE EN PARAMÈTRE à chaque fonction qui en a besoin.
 * Jamais de singleton global : deux plantes ne doivent jamais partager un flux.
 */

/** Un tirage dans [0, 1). Toujours reçu en paramètre, jamais construit à la volée. */
export type Rng = () => number

/**
 * `Éléa`, `elea`, `  ELÉA ` doivent donner exactement le même spécimen.
 * Sans cette normalisation, personne ne comprend pourquoi deux mots « identiques »
 * produisent deux plantes différentes.
 */
export function normalize(word: string): string {
  return String(word ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/** Hash de chaîne → entier 32 bits non signé. */
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

/** Générateur pseudo-aléatoire 32 bits, rapide et reproductible sur toute machine. */
export function mulberry32(a: number): Rng {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Seed principal d'un mot. */
export function seedOf(word: string): number {
  return xmur3(normalize(word) || 'siccus')()
}

/** Arrondi à 2 décimales — garde le SVG exporté léger et lisible chez l'imprimeur. */
export const r2 = (n: number): number => Math.round(n * 100) / 100

/** Perturbation symétrique dans [-a, +a]. */
export const jit = (rng: Rng, a: number): number => (rng() * 2 - 1) * a

/** Tirage d'un élément de tableau. Renvoie aussi l'index : le rendu localisé s'en sert. */
export function pickIndex(rng: Rng, length: number): number {
  return Math.floor(rng() * length)
}

export const RAD = Math.PI / 180

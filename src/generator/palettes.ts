import type { Palette } from '../lib/types'

/**
 * Cinq palettes de séchoir, fermées, choisies par le seed. Aucune n'est éditable.
 *
 * Référent : une plante SÉCHÉE, collée sur papier ancien. Aucun vert saturé —
 * un vert vif ouvre le fichier et referme le projet.
 *
 * Les noms affichés vivent dans `src/content/*`, pas ici : ce fichier ne contient
 * que des couleurs, il n'a pas de langue.
 */
export const PALETTES: readonly Palette[] = [
  {
    id: 'sepia',
    ink: '#4a3520',
    foliage: '#a3824e',
    paper: '#f0e6d1',
    hand: '#5b4126',
    hand2: '#3f4a54',
    stamp: '#6b4a2e',
  },
  {
    id: 'olive',
    ink: '#3b402c',
    foliage: '#8b8a5e',
    paper: '#f1ecda',
    hand: '#48462f',
    hand2: '#3d4a4a',
    stamp: '#5c5c38',
  },
  {
    id: 'encre',
    ink: '#2b3340',
    foliage: '#798492',
    paper: '#e7e6e0',
    hand: '#33404f',
    hand2: '#4a4038',
    stamp: '#3d4b5c',
  },
  {
    id: 'tabac',
    ink: '#4d3524',
    foliage: '#a9713f',
    paper: '#eee1ca',
    hand: '#5f3f24',
    hand2: '#414a44',
    stamp: '#7a4c28',
  },
  {
    id: 'fusain',
    ink: '#2e2e2c',
    foliage: '#84837e',
    paper: '#f1f0ea',
    hand: '#3a3a37',
    hand2: '#4b4640',
    stamp: '#43423e',
  },
] as const

import { describe, expect, test } from 'vitest'
import { CONTENT, LOCALES } from './index'
import { fill } from './fill'
import { LOCI_COUNT, NOTES_COUNT } from '../generator/nomenclature'
import { PORT_IDS } from '../generator/genome'
import { PALETTES } from '../generator/palettes'
import type { Content } from './types'

/**
 * Le contenu est la seule pièce que quelqu'un éditera sans lire le reste du code.
 * Ces tests attrapent ce que le typage ne voit pas : une chaîne oubliée vide, un
 * gabarit dont on a traduit le nom de variable, une liste dépareillée.
 */

/** Chemins de toutes les feuilles de texte d'un contenu, en notation pointée. */
function leaves(node: unknown, path = ''): [string, string][] {
  if (typeof node === 'string') return [[path, node]]
  if (Array.isArray(node)) return node.flatMap((v, i) => leaves(v, `${path}[${i}]`))
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k))
  }
  return []
}

const placeholders = (text: string): string[] =>
  (text.match(/\{(\w+)\}/g) ?? []).sort()

describe.each(LOCALES)('contenu %s', (locale) => {
  const content: Content = CONTENT[locale]

  test('aucune chaîne vide', () => {
    const empty = leaves(content)
      .filter(([, value]) => value.trim() === '')
      .map(([path]) => path)
    expect(empty).toEqual([])
  })

  test('les listes tirées par le seed ont la bonne longueur', () => {
    expect(content.loci).toHaveLength(LOCI_COUNT)
    expect(content.notes).toHaveLength(NOTES_COUNT)
  })

  test('chaque port, palette, phyllotaxie et marge a un libellé', () => {
    for (const id of PORT_IDS) expect(content.ports[id]).toBeTruthy()
    for (const palette of PALETTES) expect(content.palettes[palette.id]).toBeTruthy()
  })
})

describe('parité entre langues', () => {
  const reference = CONTENT.fr
  const others = LOCALES.filter((l) => l !== 'fr').map((l) => CONTENT[l])

  test('mêmes clés partout', () => {
    const expected = leaves(reference).map(([path]) => path)
    for (const content of others) {
      expect(leaves(content).map(([path]) => path)).toEqual(expected)
    }
  })

  test('mêmes espaces réservés dans les gabarits', () => {
    const expected = new Map(leaves(reference).map(([path, text]) => [path, placeholders(text)]))
    for (const content of others) {
      for (const [path, text] of leaves(content)) {
        expect({ path, placeholders: placeholders(text) }).toEqual({
          path,
          placeholders: expected.get(path),
        })
      }
    }
  })
})

describe('fill', () => {
  test('remplace les valeurs fournies', () => {
    expect(fill('f. {folio} · n° {specimen}', { folio: 12, specimen: 4471 })).toBe(
      'f. 12 · n° 4471',
    )
  })

  test('laisse visible un espace réservé sans valeur plutôt que d’imprimer undefined', () => {
    expect(fill('n° {specimen}', {})).toBe('n° {specimen}')
  })
})

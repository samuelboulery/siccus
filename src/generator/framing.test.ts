import { describe, expect, test } from 'vitest'
import { buildPlate } from './buildPlate'
import { SUBJECT_AREA } from './framing'
import { PORT_IDS } from './genome'
import type { PortId } from '../lib/types'

/**
 * « Aucune plante laide » ne se teste pas automatiquement. Ce qui se teste, c'est
 * qu'aucune ne déborde, n'explose en nombre de traits, ni ne dégénère — les trois
 * façons dont une planche devient objectivement inutilisable.
 */

/** Plafond du PRD : au-delà, le SVG fige le navigateur et l'imprimeur. */
const MAX_STROKES = 4000

const WORDS = Array.from({ length: 60 }, (_, i) =>
  ['a', 'zoe', 'Éléa', 'Adrien', 'Constantinople', 'jean-baptiste de la tour'][i % 6]!.concat(
    i < 6 ? '' : String(i),
  ),
)

describe('cadrage', () => {
  test.each(WORDS)('« %s » tient dans la zone du sujet', (word) => {
    const { framing, strokes, organs } = buildPlate(word)

    expect(Number.isFinite(framing.scale)).toBe(true)
    expect(framing.scale).toBeGreaterThan(0)
    expect(Number.isFinite(framing.tx)).toBe(true)
    expect(Number.isFinite(framing.ty)).toBe(true)

    /* Le centre du cadrage est celui de la zone réservée : le sujet ne peut pas
       dériver sous le cartouche ni sur la colonne des détails. */
    expect(framing.tx).toBeGreaterThan(SUBJECT_AREA.x - SUBJECT_AREA.w)
    expect(framing.tx).toBeLessThan(SUBJECT_AREA.x + SUBJECT_AREA.w * 2)
    expect(framing.ty).toBeGreaterThan(SUBJECT_AREA.y)
    expect(framing.ty).toBeLessThan(SUBJECT_AREA.y + SUBJECT_AREA.h)

    expect(strokes.length).toBeGreaterThan(0)
    expect(strokes.length).toBeLessThan(MAX_STROKES)
    expect(organs.length).toBeLessThan(MAX_STROKES)
  })
})

describe('couverture des ports', () => {
  test('les cinq morphologies sortent sur un échantillon de mots courants', () => {
    const seen = new Set<PortId>(WORDS.map((w) => buildPlate(w).genome.portId))
    expect([...seen].sort()).toEqual([...PORT_IDS].sort())
  })

  test('chaque planche porte un binôme, un numéro et une date', () => {
    for (const word of WORDS.slice(0, 12)) {
      const plate = buildPlate(word, { now: new Date('2026-08-04T12:00:00Z') })
      expect(plate.latin).toMatch(/^[A-Z][a-z]+ [a-z]+$/)
      expect(plate.specimen).toBeGreaterThanOrEqual(1000)
      expect(plate.specimen).toBeLessThan(10000)
      expect(plate.date).toBe('04.VIII.2026')
    }
  })
})

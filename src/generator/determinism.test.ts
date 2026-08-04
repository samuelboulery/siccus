import { createHash } from 'node:crypto'
import { describe, expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { buildPlate } from './buildPlate'
import { normalize, seedOf } from './rng'
import { PlateSvg } from '../components/plate/PlateSvg'
import { resolvePlateText, type PlateTextOverrides } from '../lib/plateText'
import { fr } from '../content/fr'
import { en } from '../content/en'
import fixtures from './determinism.fixtures.json'

/**
 * Le test qui porte le produit.
 *
 * La promesse de Siccus est qu'un mot rende toujours exactement la même planche —
 * aujourd'hui, dans deux ans, sur n'importe quelle machine. Cette promesse casse
 * SILENCIEUSEMENT : insérer un `rng()` au milieu de la chaîne de tirages ne
 * produit aucune erreur, seulement des plantes différentes que personne ne
 * remarque avant qu'un utilisateur retape son prénom des mois plus tard.
 *
 * Les empreintes de `determinism.fixtures.json` ont été validées une fois par
 * comparaison octet à octet avec l'ébauche d'origine (`_legacy/Siccus v2.dc.html`),
 * sur les cinq ports et 3,6 Mo de géométrie. Elles ne doivent plus jamais bouger.
 *
 * SI CE TEST TOMBE : ce n'est pas le test qui a tort. Un tirage a été déplacé,
 * inséré ou supprimé quelque part dans generator/. Voir l'encadré de genome.ts.
 */

/** Date figée : la date de récolte est la seule part de la planche qui dépend du jour. */
const COLLECTED_ON = new Date('2026-08-04T12:00:00Z')

function markupOf(word: string, content = fr, overrides: PlateTextOverrides = {}): string {
  const plate = buildPlate(word, { now: COLLECTED_ON })
  const { text } = resolvePlateText(plate, content, overrides)
  return renderToStaticMarkup(
    PlateSvg({ plate, text, variant: 'mounted', animated: false, textured: true }),
  )
}

const hash = (input: string): string =>
  createHash('sha256').update(input).digest('hex').slice(0, 16)

/** Ne garde que la géométrie : les `d=` des chemins et les cercles. */
function pathsOnly(markup: string): string {
  return (markup.match(/ d="[^"]*"|<circle[^>]*>/g) ?? []).join('')
}

describe('normalisation', () => {
  test('accents, casse et espaces désignent le même spécimen', () => {
    const variants = ['Éléa', 'elea', 'ELÉA', '  Éléa  ']
    expect(new Set(variants.map(seedOf)).size).toBe(1)
  })

  test('les espaces internes sont réduits, pas supprimés', () => {
    expect(normalize('deux   mots')).toBe('deux mots')
    expect(seedOf('deux mots')).not.toBe(seedOf('deuxmots'))
  })

  test('un mot vide retombe sur un spécimen stable', () => {
    expect(seedOf('')).toBe(seedOf('   '))
    expect(buildPlate('').latin).toBe(buildPlate('siccus').latin)
  })
})

describe('reproductibilité', () => {
  test('deux générations du même mot donnent le même balisage', () => {
    for (const word of ['Éléa', 'Constantinople', 'zzz']) {
      expect(markupOf(word)).toBe(markupOf(word))
    }
  })

  test('la langue ne change ni la géométrie, ni le nom, ni le numéro', () => {
    for (const word of Object.keys(fixtures.plates)) {
      const plate = buildPlate(word, { now: COLLECTED_ON })
      const frMarkup = markupOf(word, fr)
      const enMarkup = markupOf(word, en)

      /* Les annotations diffèrent… */
      expect(frMarkup).not.toBe(enMarkup)
      /* …mais pas un seul point de la géométrie. */
      expect(hash(pathsOnly(frMarkup))).toBe(hash(pathsOnly(enMarkup)))
      expect(enMarkup).toContain(plate.latin)
      expect(enMarkup).toContain(String(plate.specimen))
    }
  })
})

describe('surcharges de contenu', () => {
  /* Le panneau d'édition ouvre TOUT le texte de la planche, y compris le binôme
     et le n° de spécimen. Il ne doit pouvoir toucher que du texte. */
  test('éditer un texte ne déplace pas un trait', () => {
    const reference = markupOf('Éléa')
    const edited = markupOf('Éléa', fr, {
      latin: 'Rosa canina',
      collector: 'A. de Jussieu',
      locus: 'in horto botanico Parisiensi',
      header: 'MON HERBIER',
      note1: '',
    })

    expect(edited).not.toBe(reference)
    expect(hash(pathsOnly(edited))).toBe(hash(pathsOnly(reference)))
    expect(edited).toContain('Rosa canina')
    expect(edited).toContain('A. de Jussieu')
  })

  test('surcharger le binôme met à jour la ligne de révision', () => {
    const edited = markupOf('Éléa', fr, { latin: 'Rosa canina' })
    expect(edited).toContain('→ Rosa canina')
  })

  test('surcharger la date met à jour la révision et le tampon', () => {
    const edited = markupOf('Éléa', fr, { date: '12.III.1897' })
    expect(edited).toContain('rev. 12.III.1897')
    /* Deux fois au moins : le champ DIES et le tampon. */
    expect(edited.split('12.III.1897').length - 1).toBeGreaterThanOrEqual(3)
  })

  test('une chaîne vide efface le texte au lieu de rendre la valeur tirée', () => {
    const { text } = resolvePlateText(buildPlate('Éléa', { now: COLLECTED_ON }), fr, {
      note1: '',
    })
    expect(text.note1).toBe('')
  })
})

describe('empreintes figées', () => {
  test.each(Object.entries(fixtures.plates))('%s', (word, expected) => {
    const plate = buildPlate(word, { now: COLLECTED_ON })
    expect({
      seed: plate.seed,
      port: plate.genome.portId,
      palette: plate.palette.id,
      latin: plate.latin,
      specimen: plate.specimen,
      markup: hash(markupOf(word)),
    }).toEqual(expected)
  })
})

import { describe, expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { buildPlate } from './buildPlate'
import { PORT_IDS } from './genome'
import { hatchLevelOf, shadeSideOf } from './light'
import { PlateSvg } from '../components/plate/PlateSvg'
import { resolvePlateText } from '../lib/plateText'
import { fr } from '../content/fr'
import type { PortId } from '../lib/types'

/**
 * Ce que la refonte de structure et de rendu a promis.
 *
 * Ces tests ne jugent pas la beauté — elle ne se teste pas. Ils verrouillent les
 * propriétés dont on a fait un argument : hiérarchie des axes, raccourci des
 * limbes, cohérence de l'éclairage, absence d'aplat, et poids du fichier.
 */

const NOW = new Date('2026-08-04T12:00:00Z')

const WORDS = [
  'Éléa',
  'Adrien',
  'Ana',
  'Constantinople',
  'siccus',
  'olive',
  'Marie',
  'zzz',
  'abcdefghijklmnop',
  'Marie-Christine de Beauregard',
  'anticonstitutionnellement',
  'a',
]

/** Un mot par port, pour couvrir les cinq morphologies. */
const BY_PORT = (() => {
  const found = new Map<PortId, string>()
  for (const word of [...WORDS, 'iris', 'foin', 'luna', 'pollen', 'seigle', 'carex']) {
    const port = buildPlate(word, { now: NOW }).genome.portId
    if (!found.has(port)) found.set(port, word)
  }
  return found
})()

function markupOf(word: string): string {
  const plate = buildPlate(word, { now: NOW })
  const { text } = resolvePlateText(plate, fr, {})
  return renderToStaticMarkup(
    PlateSvg({ plate, text, variant: 'mounted', animated: false, textured: true }),
  )
}

describe('hiérarchie des axes', () => {
  test('les cinq ports sortent tous', () => {
    expect([...BY_PORT.keys()].sort()).toEqual([...PORT_IDS].sort())
  })

  /* Seuls les ports à axe dominant se prêtent à ce test : une rosette n'a pas de
     tronc, son trait le plus épais est la hampe florale, qui part tard et c'est
     normal. */
  const MONOPODIAL = WORDS.filter((w) => {
    const port = buildPlate(w, { now: NOW }).genome.portId
    return port === 'arbustif' || port === 'grimpant'
  })

  test.each(MONOPODIAL)('« %s » — le trait le plus épais est à la base', (word) => {
    const { strokes } = buildPlate(word, { now: NOW })
    expect(strokes.length).toBeGreaterThan(0)

    const widest = strokes.reduce((a, b) => (b.w > a.w ? b : a))
    const earliest = Math.min(...strokes.map((s) => s.wave))
    /* Un axe fondateur démarre dans les toutes premières vagues. S'il démarrait
       tard, c'est que la dominance apicale ne tient plus : une branche serait
       devenue plus grosse que le tronc qui la porte. */
    expect(widest.wave).toBeLessThanOrEqual(earliest + 2)
  })

  test.each([...BY_PORT.values()])('« %s » — un axe épais est modelé, pas rempli', (word) => {
    const { strokes } = buildPlate(word, { now: NOW })
    const thick = strokes.filter((s) => s.w >= 2.2)
    for (const stroke of thick) {
      /* Au-delà du seuil, un axe doit être un contour vide plus ses hachures de
         volume — jamais un aplat. */
      expect(['cyl', 'shade']).toContain(stroke.kind)
    }
  })
})

describe('raccourci phyllotaxique', () => {
  test.each([...BY_PORT.entries()].filter(([port]) => port !== 'fougere' && port !== 'graminee'))(
    '%s — les limbes ne sont pas tous vus de face',
    (_port, word) => {
      const { organs } = buildPlate(word, { now: NOW })
      if (organs.length < 5) return

      const scales = organs.map((o) => o.widthScale)
      const spread = Math.max(...scales) - Math.min(...scales)
      /* S'il n'y a aucune dispersion, toutes les feuilles sont dans le plan de
         la feuille de papier — et le feuillage se lit comme des autocollants. */
      expect(spread).toBeGreaterThan(0.25)
      expect(Math.min(...scales)).toBeGreaterThanOrEqual(0.18)
      expect(Math.max(...scales)).toBeLessThanOrEqual(1.01)
    },
  )
})

describe('éclairage', () => {
  test('une même orientation donne toujours le même côté d’ombre', () => {
    for (let angle = -180; angle < 180; angle += 17) {
      expect(shadeSideOf(angle)).toBe(shadeSideOf(angle + 360))
    }
  })

  test('un organe tourné vers la source est plus clair que son opposé', () => {
    const towardLight = hatchLevelOf(-132, false, 1)
    const awayFromLight = hatchLevelOf(48, false, 1)
    expect(towardLight).toBeLessThan(awayFromLight)
  })

  test('une face inférieure n’est jamais plus claire que la face supérieure', () => {
    for (let angle = -180; angle < 180; angle += 23) {
      expect(hatchLevelOf(angle, true, 1)).toBeGreaterThanOrEqual(hatchLevelOf(angle, false, 1))
    }
  })
})

describe('gravure', () => {
  test.each([...BY_PORT.values()])('« %s » — aucun aplat de lavis sur le sujet', (word) => {
    const plate = buildPlate(word, { now: NOW })
    const markup = markupOf(word)

    /* Une gravure n'a pas d'aplat : la valeur vient de la densité du trait. La
       couleur de feuillage, qui servait de lavis, ne doit plus apparaître nulle
       part comme remplissage. */
    expect(markup).not.toContain(`fill="${plate.palette.foliage}"`)
    expect(markup).not.toContain('fill-opacity="0.22"')
    expect(markup).not.toContain('fill-opacity="0.18"')
  })

  test.each([...BY_PORT.values()])('« %s » — le tramé est bien référencé', (word) => {
    expect(markupOf(word)).toMatch(/fill="url\(#sic-hatch-[1-4]\)"/)
  })

  test('le tramé survit à la sérialisation de l’export', () => {
    const markup = markupOf('Éléa')
    /* C'est le point où un export peut silencieusement perdre ses hachures : si
       les `<pattern>` n'étaient pas sérialisés, les feuilles sortiraient vides
       chez l'imprimeur sans qu'aucune erreur ne le signale. */
    for (const level of [1, 2, 3, 4]) {
      expect(markup).toContain(`id="sic-hatch-${level}"`)
      expect(markup).toContain(`id="sic-detail-hatch-${level}"`)
    }
  })

  test('l’export n’émet aucun masque de croissance', () => {
    /* Les masques n'existent que pour l'animation. Les laisser dans le fichier
       exporté l'alourdirait et risquerait de masquer le dessin chez un lecteur
       SVG qui n'applique pas les animations CSS. */
    expect(markupOf('Éléa')).not.toContain('<mask')
  })
})

describe('poids du fichier', () => {
  /** Budget du balisage seul. Les polices inlinées ajoutent ~185 Ko à l'export. */
  const MAX_MARKUP = 420 * 1024

  test.each(WORDS)('« %s » tient dans le budget', (word) => {
    expect(markupOf(word).length).toBeLessThan(MAX_MARKUP)
  })
})

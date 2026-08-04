import { fill, type Content } from '../content'
import { detail2Scale, DETAIL_SCALES, SCALE_BAR } from '../components/plate/layout'
import type { Plate } from './types'

/**
 * Le texte de la planche, résolu.
 *
 * Un seul endroit calcule chaque chaîne réellement imprimée : les composants
 * n'appellent plus `fill()` ni ne lisent `content` — ils affichent `text.locus`.
 * C'est ce qui rend chaque mot de la feuille surchargeable sans disperser la
 * logique dans six fichiers.
 */

export type PlateTextKey = (typeof PLATE_TEXT_FIELDS)[number]['key']
export type PlateText = Record<PlateTextKey, string>
export type PlateTextOverrides = Partial<PlateText>

export type PlateTextSection =
  | 'header'
  | 'details'
  | 'determination'
  | 'collection'
  | 'notes'
  | 'footer'
  | 'interface'

/**
 * `specimen` : la valeur vient du tirage du mot. Une surcharge ne vaut que pour
 * ce spécimen-là et retombe sur le tirage dès qu'on tape un autre mot.
 * `global` : c'est ton herbier — le nom du récolteur, les en-têtes, le tampon.
 * La surcharge suit tous les spécimens et survit au rechargement.
 */
export type PlateTextScope = 'specimen' | 'global'

export const PLATE_TEXT_FIELDS = [
  { key: 'header', section: 'header', scope: 'global' },
  { key: 'headerRight', section: 'header', scope: 'global' },
  { key: 'tagline', section: 'header', scope: 'global' },
  { key: 'folioLine', section: 'header', scope: 'specimen' },
  { key: 'spine', section: 'header', scope: 'specimen' },

  { key: 'detail1', section: 'details', scope: 'specimen' },
  { key: 'detail2', section: 'details', scope: 'specimen' },
  { key: 'scaleLabel', section: 'details', scope: 'global' },
  { key: 'scaleZero', section: 'details', scope: 'global' },
  { key: 'scaleMax', section: 'details', scope: 'global' },
  { key: 'notaLabel', section: 'details', scope: 'global' },

  { key: 'word', section: 'determination', scope: 'specimen' },
  { key: 'latin', section: 'determination', scope: 'specimen' },
  { key: 'diagnosis', section: 'determination', scope: 'specimen' },
  { key: 'oldName', section: 'determination', scope: 'specimen' },
  { key: 'revision', section: 'determination', scope: 'specimen' },
  { key: 'revisedOn', section: 'determination', scope: 'global' },

  { key: 'labelFamilia', section: 'collection', scope: 'global' },
  { key: 'family', section: 'collection', scope: 'specimen' },
  { key: 'labelLocus', section: 'collection', scope: 'global' },
  { key: 'locus', section: 'collection', scope: 'specimen' },
  { key: 'labelAltitudo', section: 'collection', scope: 'global' },
  { key: 'altitude', section: 'collection', scope: 'specimen' },
  { key: 'labelDeterminavit', section: 'collection', scope: 'global' },
  { key: 'labelDies', section: 'collection', scope: 'global' },
  { key: 'date', section: 'collection', scope: 'global' },
  { key: 'labelLegit', section: 'collection', scope: 'global' },
  { key: 'collector', section: 'collection', scope: 'global' },
  { key: 'labelHerbNo', section: 'collection', scope: 'global' },
  { key: 'herbNo', section: 'collection', scope: 'specimen' },

  { key: 'note1', section: 'notes', scope: 'specimen' },
  { key: 'note2', section: 'notes', scope: 'specimen' },
  { key: 'marginNote', section: 'notes', scope: 'global' },
  { key: 'stampTitle', section: 'notes', scope: 'global' },
  { key: 'stampSubtitle', section: 'notes', scope: 'global' },

  { key: 'footer', section: 'footer', scope: 'global' },

  { key: 'kicker', section: 'interface', scope: 'global' },
  { key: 'placeholder', section: 'interface', scope: 'global' },
] as const satisfies readonly {
  key: string
  section: PlateTextSection
  scope: PlateTextScope
}[]

export const PLATE_TEXT_SECTIONS: readonly PlateTextSection[] = [
  'header',
  'details',
  'determination',
  'collection',
  'notes',
  'footer',
  'interface',
]

const SCOPE_OF = new Map<string, PlateTextScope>(
  PLATE_TEXT_FIELDS.map((field) => [field.key, field.scope]),
)

export const scopeOf = (key: PlateTextKey): PlateTextScope => SCOPE_OF.get(key) ?? 'global'

export const isPlateTextKey = (value: unknown): value is PlateTextKey =>
  typeof value === 'string' && SCOPE_OF.has(value)

/**
 * Calcule le texte de la planche, et ce qu'il vaudrait sans surcharge.
 *
 * Le panneau d'édition a besoin des deux : la valeur affichée, et la valeur
 * tirée, pour proposer le retour en arrière.
 *
 * ⚠ Aucune de ces chaînes n'entre dans le calcul du dessin. Surcharger le
 * binôme latin ne déplace pas une branche : la planche est décidée avant.
 */
export function resolvePlateText(
  plate: Plate,
  content: Content,
  overrides: PlateTextOverrides = {},
): { text: PlateText; defaults: PlateText } {
  const t = content.plate
  const h = content.handwriting

  /* Ces deux-là sont réinjectés dans d'autres lignes : la révision cite le
     binôme, le tampon et la mention « rev. » citent la date. On les résout donc
     en premier, surcharge comprise, pour qu'éditer le nom mette aussi à jour la
     ligne de révision. */
  const latin = overrides.latin ?? plate.latin
  const date = overrides.date ?? plate.date

  const defaults: PlateText = {
    header: t.header,
    headerRight: t.headerRight,
    tagline: t.tagline,
    folioLine: fill(t.folioLine, { folio: plate.folio, specimen: plate.specimen }),
    spine: fill(t.spine, {
      specimen: plate.specimen,
      palette: content.palettes[plate.palette.id].toLocaleUpperCase(content.htmlLang),
    }),

    detail1: fill(plate.genome.organType === 'lineaire' ? t.detail1Sheathing : t.detail1, {
      scale: DETAIL_SCALES.leaf,
    }),
    detail2: fill(t.detail2, {
      kind: t.detailKinds[plate.detail2],
      scale: detail2Scale(plate.detail2),
    }),
    scaleLabel: t.scaleLabel,
    scaleZero: t.scaleZero,
    scaleMax: fill(t.scaleMax, { cm: SCALE_BAR.centimetres }),
    notaLabel: t.notaLabel,

    word: plate.word.toLocaleUpperCase(content.htmlLang),
    latin: plate.latin,
    diagnosis: fill(t.diagnosis, {
      port: content.ports[plate.genome.portId],
      phyllotaxy: content.phyllotaxies[plate.genome.phyllotaxy],
      margin: content.margins[plate.genome.margin],
    }),
    oldName: plate.oldName,
    revision: fill(h.revision, { latin }),
    revisedOn: fill(h.revisedOn, { date }),

    labelFamilia: t.fields.familia,
    family: plate.family,
    labelLocus: t.fields.locus,
    locus: content.loci[plate.locusIndex] ?? '',
    labelAltitudo: t.fields.altitudo,
    altitude: fill(h.altitude, { altitude: plate.altitude }),
    labelDeterminavit: t.fields.determinavit,
    labelDies: t.fields.dies,
    date: plate.date,
    labelLegit: t.fields.legit,
    collector: h.collector,
    labelHerbNo: t.fields.herbNo,
    herbNo: fill(h.herbNo, { specimen: plate.specimen }),

    note1: content.notes[plate.noteIndex] ?? '',
    note2: content.notes[plate.note2Index] ?? '',
    marginNote: h.marginNote,
    stampTitle: content.stamp.title,
    stampSubtitle: content.stamp.subtitle,

    footer: t.footer,

    kicker: content.ui.kicker,
    placeholder: content.ui.placeholder,
  }

  return { defaults, text: { ...defaults, ...overrides } }
}

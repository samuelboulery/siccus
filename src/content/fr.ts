import type { Content } from './types'

export const fr: Content = {
  locale: 'fr',
  nativeName: 'Français',
  shortName: 'FR',
  htmlLang: 'fr',
  documentTitle: 'Siccus — hortus siccus',

  ui: {
    kicker: 'Siccus · hortus siccus',
    placeholder: 'un mot',
    defaultWord: 'Éléa',
    exportSvg: 'SVG',
    exportPng: 'PNG',
    variants: {
      mounted: 'Planche montée',
      bare: 'Feuille nue',
      grid: 'Papier quadrillé',
    },
    caption: '{port} — palette {palette}',
    languageLabel: 'Langue',
  },

  plate: {
    header: 'HERBARIUM SICCUS',
    headerRight: 'HORTUS SICCUS DIGITALIS · PL. A3',
    tagline: 'Collection déterministe — un mot, un spécimen',
    folioLine: 'f. {folio} · n° {specimen}',
    spine: 'SICCUS · SPECIMEN N° {specimen} · {palette}',
    detail1: '1. FEUILLE ISOLÉE, FACE INFÉRIEURE — ×{scale}',
    detail1Sheathing: '1. LIMBE ISOLÉ, BASE ENGAINANTE — ×{scale}',
    detail2: '2. {kind} — ×{scale}',
    detailKinds: {
      coupe: 'COUPE DE TIGE',
      graine: 'GRAINE MÛRE',
      ombelle: 'INFLORESCENCE',
    },
    scaleLabel: 'ÉCHELLE DU SUJET',
    scaleZero: '0',
    scaleMax: '{cm} cm',
    notaLabel: 'NOTA',
    diagnosis: '{port} · phyllotaxie {phyllotaxy} · marge {margin}',
    fields: {
      familia: 'FAMILIA',
      locus: 'LOCUS',
      altitudo: 'ALTITUDO',
      determinavit: 'DETERMINAVIT',
      dies: 'DIES',
      legit: 'LEGIT',
      herbNo: 'HERB. N°',
    },
    footer:
      'Planche générée par Siccus — le mot est la seule entrée ; le même mot rend le même spécimen. Ne pas exposer à la lumière directe.',
  },

  handwriting: {
    altitude: '{altitude} m, exposition sud',
    collector: 'S. Boulery',
    herbNo: '{specimen} bis',
    revision: '→ {latin}',
    revisedOn: 'rev. {date}',
    marginNote: 'planche à remonter',
  },

  stamp: {
    title: 'HERB. SICCUS',
    subtitle: 'ENTRÉ AU FICHIER',
  },

  palettes: {
    sepia: 'sépia',
    olive: 'olive séché',
    encre: 'encre froide',
    tabac: 'tabac',
    fusain: 'fusain',
  },

  ports: {
    arbustif: 'port arbustif, rameux',
    rosette: 'port en rosette, hampe florale',
    graminee: 'port graminoïde, touffe',
    grimpant: 'port grimpant, vrilles',
    fougere: 'port en frondes pennées',
  },

  phyllotaxies: {
    alterne: 'alterne',
    opposee: 'opposée',
    verticillee: 'verticillée',
  },

  margins: {
    entiere: 'entière',
    dentee: 'dentée',
    lobee: 'lobée',
  },

  /* Stations de récolte — latin d'herbier, volontairement identique d'une langue
     à l'autre. Exactement 7 : le seed tire un index dans cette liste. */
  loci: [
    'in rupibus calcareis, Vallis Umbrosa',
    'ad ripas fluminis Aquae Nigrae',
    'in pascuis siccis supra Montem Cinereum',
    'in fissuris muri antiqui, Hortus Vetus',
    'ad margines silvae, Saltus Boreus',
    'in arenosis maritimis, Litus Album',
    'in dumetis umbrosis prope Fontem Frigidam',
  ],

  /* Notes du collecteur. Exactement 8 : le seed tire deux index dans cette liste. */
  notes: [
    'stipules caduques, à peine visibles',
    'odeur résineuse au froissement',
    'nervation saillante en dessous',
    'racine pivotante, très amère',
    'fleurs non observées sur ce pied',
    'exsiccatum légèrement décoloré',
    'limbe un peu charnu, sec cassant',
    'port couché à la base, redressé',
  ],
}

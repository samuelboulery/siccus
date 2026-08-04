/** Modèle de données de Siccus. Tout est décidé en une passe, avant l'affichage. */

export type PortId = 'arbustif' | 'rosette' | 'graminee' | 'grimpant' | 'fougere'
export type Phyllotaxy = 'alterne' | 'opposee' | 'verticillee'
export type LeafType = 'ovale' | 'lanceolee' | 'cordee' | 'spatulee' | 'obovale' | 'lineaire'
export type LeafMargin = 'entiere' | 'dentee' | 'lobee'
export type PaletteId = 'sepia' | 'olive' | 'encre' | 'tabac' | 'fusain'
export type DetailKind = 'coupe' | 'graine' | 'ombelle'
export type Epithet = 'contorta' | 'nana' | 'gracilis' | 'alterna' | 'robusta'

export type Point = [number, number]

/** Présentation de la planche. Le dessin ne change pas, seul son montage. */
export type Variant = 'mounted' | 'bare' | 'grid'

export type Palette = {
  id: PaletteId
  /** Trait principal. */
  ink: string
  /** Lavis du feuillage. */
  foliage: string
  paper: string
  /** Encre de la première main. */
  hand: string
  /** Encre de la main du réviseur. */
  hand2: string
  stamp: string
}

export type Genome = {
  portId: PortId
  angleBase: number
  angleJitter: number
  branchRatio: number
  depth: number
  curvature: number
  thickness: number
  phyllotaxy: Phyllotaxy
  leafType: LeafType
  margin: LeafMargin
  rootSpread: number
  leafBend: number
  /** Dérivé de `thickness`, pas tiré. */
  leafSize: number
  /** L'organe réellement dessiné : le détail agrandi doit montrer le même. */
  organType: LeafType
  organMargin: LeafMargin
  /** Dérivé de la longueur du mot : mot court = plante épurée. */
  density: number
}

/** Un trait d'encre. `wave` = vague de profondeur, unité de groupement de l'animation. */
export type Stroke = {
  d: string
  w: number
  wave: number
  /** 0 = passe principale, 1 = repasse claire par-dessus. */
  pass: number
  /** Limbe de graminée : rempli du lavis de feuillage. */
  fillBlade?: boolean
}

/** Un organe foliaire dessiné : contour, marge, nervures, hachures. */
export type LeafShape = {
  outline: string
  /** Second contour tremblé. Absent sur les petits organes, où il ne se voit pas. */
  outline2?: string
  midrib: string
  veins: string[]
  hatch: string[]
}

export type Organ = {
  x: number
  y: number
  /** Direction dans laquelle pointe la feuille, en degrés. */
  ang: number
  size: number
  wave: number
  /** Angle phyllotaxique cumulé au nœud porteur. Décide du raccourci. */
  roll: number
  /**
   * Raccourci de la largeur du limbe, 0,18 à 1. Une feuille qui pointe vers
   * l'observateur se voit de profil — c'est ce facteur qui empêche le feuillage
   * de se lire comme une planche d'autocollants.
   */
  widthScale: number
  /** La feuille montre sa face inférieure : nervures saillantes, hachures pâles. */
  underside: boolean
  shape: LeafShape
}

export type Dot = { x: number; y: number; r: number; wave: number }
export type Mark = { d: string; wave: number }

/** Cadrage calculé APRÈS génération — jamais de viewBox en dur. */
export type Framing = { scale: number; tx: number; ty: number; groundY: number }

/**
 * Une planche entièrement décidée. L'animation ne fait que la révéler.
 *
 * IMPORTANT — déterminisme × i18n : ce type ne contient AUCUN texte localisé.
 * Le seed choisit des index (`locusIndex`, `noteIndex`…) ; la couche de rendu va
 * chercher la chaîne dans `content[locale]`. La géométrie, la palette, le binôme
 * latin et le n° de spécimen sont donc identiques dans toutes les langues.
 */
export type Plate = {
  word: string
  seed: number
  genome: Genome
  palette: Palette

  strokes: Stroke[]
  organs: Organ[]
  dots: Dot[]
  marks: Mark[]
  maxWave: number
  framing: Framing

  /** Binôme retenu, ex. `Lycospina contorta`. Langue-neutre. */
  latin: string
  /** Ancien nom barré sur l'étiquette, ex. `Cirsicarpa sp.`. */
  oldName: string
  family: string
  epithet: Epithet

  locusIndex: number
  noteIndex: number
  note2Index: number
  /** Altitude en mètres ; l'unité et la mention d'exposition viennent du contenu. */
  altitude: number

  detail2: DetailKind
  specimen: number
  folio: number
  /** Format d'herbier `04.VIII.2026` — chiffres romains, langue-neutre. */
  date: string
  stampAngle: number
}

export type BuildOptions = {
  /** Injectable pour que les tests soient reproductibles. Défaut : maintenant. */
  now?: Date
}

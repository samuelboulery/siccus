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
  /**
   * Emprise du trait — sa largeur géométrique. C'est elle, et non l'épaisseur du
   * filet, qui dimensionne le masque de croissance : un contour de 0,2 masqué
   * sur 0,2 laisserait invisible le cylindre de 5 qu'il dessine.
   */
  w: number
  /** Épaisseur du filet au rendu. Par défaut `w` — sauf pour un contour modelé. */
  lineWidth?: number
  wave: number
  /**
   * `nib` — contour fermé d'un trait d'épaisseur variable, rendu en `fill`.
   * `cyl` — même contour, mais laissé vide : au-delà d'une certaine épaisseur un
   *   axe ne se dessine plus en plein, il se modèle. Le papier reste visible du
   *   côté éclairé, et c'est ce qui le fait tourner.
   * `shade` — les hachures transversales qui donnent ce volume.
   * `hair` — trait fin d'épaisseur constante. Sous ~0,4 unité un ruban serait
   *   invisible et deux fois plus lourd : radicelles, vrilles, épillets.
   */
  kind: 'nib' | 'cyl' | 'shade' | 'hair'
  /**
   * Ligne médiane du trait. Ne sert qu'à l'animation : `stroke-dashoffset` ne
   * s'applique pas à un remplissage, donc la croissance passe par un masque
   * construit sur cette médiane. Absente à l'export, qui n'anime rien.
   */
  spine?: string
  /** Limbe de graminée : contour rempli du lavis de feuillage. */
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
  /**
   * Pli de presse. Le spécimen a été écrasé : un limbe sur dix se replie et
   * montre sa face inférieure — plus pâle, nervures saillantes. C'est ce qui
   * distingue une plante mise à plat d'une plante dessinée.
   */
  fold?: {
    /** Le rabat, rabattu en miroir par-dessus le limbe. */
    flap: string
    /** L'arête du pli. */
    crease: string
  }
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
  /**
   * Densité du tramé, 1 (clair) à 4 (croisé). Dérivée d'une source de lumière
   * unique pour toute la planche : c'est la cohérence de cet éclairage qui fait
   * qu'un feuillage se lit comme un volume et non comme une collection de
   * silhouettes.
   */
  hatchLevel: 1 | 2 | 3 | 4
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

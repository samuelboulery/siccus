/**
 * Géométrie de la planche, en unités du viewBox A3 (297 × 420).
 *
 * Tout nombre qui positionne quelque chose sur la feuille vit ici : les
 * composants n'en écrivent aucun en dur, sinon déplacer le cartouche de deux
 * millimètres devient une chasse au trésor dans cinq fichiers.
 */
import type { DetailKind } from '../../lib/types'

export const SHEET = { w: 297, h: 420 } as const

/** Cadre du montage et coins coupés. */
export const MOUNT = { x: 10, y: 10, w: 277, h: 400 } as const

/**
 * Marque de cuvette : l'empreinte en creux laissée par le bord de la plaque de
 * cuivre, écrasée dans le papier humide sous la presse. Aucune autre technique
 * ne la produit — c'est la signature d'une taille-douce, et le premier détail
 * qu'un œil averti cherche.
 */
export const PLATEMARK = { x: 6.5, y: 6.5, w: 284, h: 407 } as const

/** Filet double sous l'en-tête. */
export const HEAD_RULE = { x0: 20, x1: 277, y: 28.5, y2: 30.6 } as const

/** Zone quadrillée de la variante « papier quadrillé ». */
export const GRID_AREA = { x: 14, y: 34, w: 269, h: 278 } as const

/** Colonne de droite : les deux détails agrandis. */
export const DETAIL_BOXES = [
  { x: 196, y: 50, w: 82, h: 78, cx: 237, cy: 89, labelY: 46 },
  { x: 196, y: 140, w: 82, h: 78, cx: 237, cy: 179, labelY: 136 },
] as const

/**
 * Équerres d'angle des figures, en remplacement d'un encadré au pointillé.
 *
 * Un cadre met la figure en cage et se lit comme un guide de maquette. Quatre
 * repères aux coins la situent et disparaissent — c'est ce que trace un graveur
 * pour caler sa plaque.
 */
export const CORNER_TICK = 4.2

/**
 * Chiffre de la figure, posé À GAUCHE de son angle supérieur — dans la gouttière
 * entre le sujet et la colonne. Sous l'angle inférieur, il percutait la légende
 * de la figure suivante.
 */
export const FIGURE_NUMERAL_OFFSET = { x: -5.5, y: 4 } as const

/** Grossissements annoncés dans les légendes des détails. */
export const DETAIL_SCALES = { leaf: 8, coupe: 8, ombelle: 8, graine: 4 } as const

export const detail2Scale = (kind: DetailKind): number => DETAIL_SCALES[kind]

/** Barre d'échelle graduée : 45 unités du viewBox = 5 cm sur le sujet. */
export const SCALE_BAR = {
  x: 196,
  y: 292,
  length: 45,
  centimetres: 5,
  ticks: [0, 9, 18, 27, 36, 45],
  labelY: 285,
  legendY: 300.5,
} as const

/** Filet double séparant le sujet du cartouche, et refend vertical. */
export const FOOT_RULE = { x0: 20, x1: 277, y: 316, y2: 318, splitX: 182 } as const

/** Cartouche : colonne gauche (détermination) et colonne droite (récolte). */
export const CARTOUCHE = {
  left: 20,
  right: 192,
  wordY: 331,
  latinY: 346,
  diagnosisY: 358,
  rows: [372, 383, 394] as const,
  leaderLeft: { x: 44, w: 122 },
  leaderRight: { x: 210, w: 67 },
  footerY: 405.5,
} as const

export const NOTA = { x: 196, labelY: 228, lines: [236, 245.5] as const } as const

export const STAMP = { x: 237, y: 266 } as const

/** Texte vertical dans la marge gauche. */
export const SPINE = { x: 14.5, y: 220 } as const

/**
 * Les quatre familles de la planche. Auto-hébergées (`@fontsource`) et non
 * chargées depuis un CDN : l'export SVG/PNG passe par une image détachée du
 * document, qui ne peut résoudre aucune police externe. Voir lib/exportPlate.ts,
 * qui les réinjecte en base64 dans le fichier produit.
 */
export const FONTS = {
  /** Titres et binôme latin. */
  display: "'Cormorant Garamond', 'Times New Roman', serif",
  /** Texte imprimé du cartouche. */
  body: "'Lora', Georgia, serif",
  /** Première main : le collecteur. */
  hand: "'Petit Formal Script', cursive",
  /** Seconde main : le réviseur. */
  hand2: "'Cedarville Cursive', cursive",
} as const

/** Familles à inliner dans les exports, avec les graisses réellement utilisées. */
export const EMBEDDED_FONTS = [
  { family: 'Cormorant Garamond', weights: [400] as const, italic: true },
  { family: 'Lora', weights: [400] as const, italic: true },
  { family: 'Petit Formal Script', weights: [400] as const, italic: false },
  { family: 'Cedarville Cursive', weights: [400] as const, italic: false },
] as const

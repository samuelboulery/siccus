import type {
  DetailKind,
  LeafMargin,
  PaletteId,
  Phyllotaxy,
  PortId,
  Variant,
} from '../lib/types'
import type { PlateTextKey, PlateTextSection } from '../lib/plateText'

export type Locale = 'fr' | 'en'

/**
 * Tout le texte de Siccus vit ici. Aucune chaîne visible n'est écrite dans un
 * composant : changer un mot de l'interface ou de la planche, c'est éditer une
 * ligne de `fr.ts` ou `en.ts`.
 *
 * ─── Déterminisme ────────────────────────────────────────────────────────────
 * `notes` et `loci` sont typés en TUPLES DE LONGUEUR FIXE. Le seed tire un index
 * dans ces listes ; si une traduction en comptait un de moins, l'index tiré
 * pourrait ne désigner personne et deux langues ne montreraient plus la même
 * planche. Un `en.ts` mal dimensionné ne compile pas — c'est voulu.
 *
 * ─── Gabarits ────────────────────────────────────────────────────────────────
 * Les chaînes contenant `{quelquechose}` sont remplies par `fill()` (voir fill.ts).
 * Les noms de variables entre accolades ne se traduisent pas.
 */
export type Content = {
  locale: Locale
  /** Nom de la langue dans la langue elle-même, pour le sélecteur. */
  nativeName: string
  /** Code court affiché dans le sélecteur : `FR`, `EN`. */
  shortName: string
  /** Valeur de l'attribut `lang` du document. */
  htmlLang: string
  /** Titre de l'onglet. */
  documentTitle: string

  ui: {
    kicker: string
    placeholder: string
    /** Mot proposé au premier chargement. Change la planche d'accueil. */
    defaultWord: string
    exportSvg: string
    exportPng: string
    variants: Record<Variant, string>
    /** Ligne sous les boutons. Gabarit : `{port}`, `{palette}`. */
    caption: string
    /** Étiquette d'accessibilité du sélecteur de langue. */
    languageLabel: string
  }

  /**
   * Le panneau d'édition du contenu de la planche.
   *
   * `fields` doit couvrir toutes les clés de `PlateText` : ajouter un texte à la
   * planche sans lui donner de libellé ici ne compile pas.
   */
  editor: {
    open: string
    title: string
    close: string
    /** Bouton de retour à la valeur tirée, sur un champ surchargé. */
    revert: string
    resetAll: string
    /** Confirmation avant remise à zéro complète. */
    resetAllConfirm: string
    /** Mention sous le titre : ce que l'édition ne touche pas. */
    hint: string
    /** Repère sur les champs qui reviennent au tirage au prochain mot. */
    specimenScope: string
    sections: Record<PlateTextSection, string>
    fields: Record<PlateTextKey, string>
  }

  plate: {
    header: string
    headerRight: string
    tagline: string
    /** Gabarit : `{folio}`, `{specimen}`. */
    folioLine: string
    /** Texte vertical dans la marge. Gabarit : `{specimen}`, `{palette}`. */
    spine: string
    /** Légende du détail ① selon l'organe. Gabarit : `{scale}`. */
    detail1: string
    /** Variante quand l'organe est un limbe engainant de graminée. */
    detail1Sheathing: string
    /** Légende du détail ②. Gabarit : `{kind}`, `{scale}`. */
    detail2: string
    detailKinds: Record<DetailKind, string>
    scaleLabel: string
    scaleZero: string
    /** Gabarit : `{cm}`. */
    scaleMax: string
    notaLabel: string
    /** Ligne de diagnose sous le binôme. Gabarit : `{port}`, `{phyllotaxy}`, `{margin}`. */
    diagnosis: string
    /** Étiquettes latines du cartouche. */
    fields: {
      familia: string
      locus: string
      altitudo: string
      determinavit: string
      dies: string
      legit: string
      herbNo: string
    }
    footer: string
  }

  handwriting: {
    /** Gabarit : `{altitude}`. */
    altitude: string
    /** Nom porté au champ LEGIT. */
    collector: string
    /** Gabarit : `{specimen}`. */
    herbNo: string
    /** Gabarit : `{latin}`. */
    revision: string
    /** Gabarit : `{date}`. */
    revisedOn: string
    /** Annotation dans la marge, sous le sujet. */
    marginNote: string
  }

  stamp: {
    title: string
    subtitle: string
  }

  /** Noms affichés des palettes. Les couleurs, elles, sont dans generator/palettes.ts. */
  palettes: Record<PaletteId, string>
  ports: Record<PortId, string>
  phyllotaxies: Record<Phyllotaxy, string>
  margins: Record<LeafMargin, string>

  /** Stations de récolte, en latin d'herbier. Exactement 7 — voir LOCI_COUNT. */
  loci: readonly [string, string, string, string, string, string, string]
  /** Notes manuscrites du collecteur. Exactement 8 — voir NOTES_COUNT. */
  notes: readonly [string, string, string, string, string, string, string, string]
}

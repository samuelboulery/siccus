import { r2 } from '../../generator/rng'

/**
 * Les tramés de hachures.
 *
 * Une gravure n'a pas d'aplat : la valeur vient de la densité du trait. Mais une
 * plante dense porte plus de mille feuilles, et douze hachures dessinées dans
 * chacune feraient exploser le fichier.
 *
 * D'où ces quatre motifs, définis UNE fois et référencés par toutes les feuilles :
 * `fill="url(#sic-hatch-3)"`. Mille feuilles partagent quatre motifs — le
 * remplissage devient du trait sans coûter un octet de plus.
 *
 * `patternUnits="userSpaceOnUse"` : le motif hérite de la rotation du groupe de
 * la feuille, donc les hachures courent selon l'axe de l'organe. C'est ce que
 * fait un graveur, et cela évite que toute la planche soit striée dans le même
 * sens comme un papier peint.
 */

/** Pas des hachures en unités de la planche (≈ mm sur un A3), du plus clair au plus dense. */
const STEPS = [1.2, 0.82, 0.58, 0.58] as const

/**
 * Épaisseur du trait de hachure, en unités de la planche.
 *
 * Une taille douce sur acier a du NOIR : sous 0,14 mm le tramé se dilue en gris
 * et la planche perd le contraste qui la fait reconnaître comme une gravure.
 */
const HAIRLINE = 0.15

export const HATCH_LEVELS = [1, 2, 3, 4] as const
export type HatchLevel = (typeof HATCH_LEVELS)[number]

type HatchPatternsProps = {
  idPrefix: string
  ink: string
  /**
   * Échelle du sujet. Les motifs sont référencés depuis l'intérieur du groupe
   * mis à l'échelle : on divise le pas par elle pour que la densité reste
   * constante SUR LA PLANCHE, quelle que soit la taille de la plante.
   */
  scale: number
}

export function HatchPatterns({ idPrefix, ink, scale }: HatchPatternsProps) {
  const safeScale = scale > 0.01 ? scale : 1

  return (
    <>
      {HATCH_LEVELS.map((level) => {
        const step = r2((STEPS[level - 1] ?? 1) / safeScale)
        const width = r2(HAIRLINE / safeScale)
        /* Le niveau 4 croise un second système : c'est la manière dont une taille
           douce obtient ses ombres les plus profondes. */
        const crossed = level === 4

        return (
          <pattern
            key={level}
            id={`${idPrefix}-hatch-${level}`}
            patternUnits="userSpaceOnUse"
            width={step}
            height={step}
          >
            <path
              d={`M0,${step} L${step},0 M${r2(-step / 2)},${r2(step / 2)} L${r2(step / 2)},${r2(-step / 2)} M${r2(step / 2)},${r2(step * 1.5)} L${r2(step * 1.5)},${r2(step / 2)}`}
              stroke={ink}
              strokeWidth={width}
              fill="none"
            />
            {crossed && (
              <path
                d={`M0,0 L${step},${step} M${r2(-step / 2)},${r2(step / 2)} L${r2(step / 2)},${r2(step * 1.5)} M${r2(step / 2)},${r2(-step / 2)} L${r2(step * 1.5)},${r2(step / 2)}`}
                stroke={ink}
                strokeWidth={width}
                fill="none"
                opacity={0.85}
              />
            )}
          </pattern>
        )
      })}
    </>
  )
}

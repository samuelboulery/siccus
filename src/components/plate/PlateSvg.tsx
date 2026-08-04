import type { Ref } from 'react'
import { Subject } from './Subject'
import { DetailPlates } from './DetailPlates'
import { Cartouche } from './Cartouche'
import { Annotations, Stamp } from './Annotations'
import { HatchPatterns } from './HatchPatterns'
import { Leader } from './Leader'
import { buildLeader } from './leaders'
import { plateAnchors } from './anchors'
import {
  CORNER_TICK,
  DETAIL_BOXES,
  FIGURE_NUMERAL_OFFSET,
  FOOT_RULE,
  GRID_AREA,
  HEAD_RULE,
  MOUNT,
  PLATEMARK,
  SCALE_BAR,
  SHEET,
} from './layout'
import { FONTS } from '../../lib/fonts'
import type { PlateText } from '../../lib/plateText'
import type { Plate, Point, Variant } from '../../lib/types'

/** Fond du support, sous le papier de la palette. Ne change jamais. */
const MOUNT_BOARD = '#eee8db'

type PlateSvgProps = {
  plate: Plate
  /** Texte déjà résolu, surcharges comprises — voir lib/plateText.ts. */
  text: PlateText
  variant: Variant
  /** Faux à l'export : la planche doit être complète dès le premier pixel. */
  animated: boolean
  /**
   * Texture d'encre et grain de papier. Ils ne tournent JAMAIS pendant la
   * croissance — deux filtres `feTurbulence` en pleine animation font tomber à
   * 5 fps. Ils s'appliquent en fondu à l'arrêt : l'encre semble se déposer.
   */
  textured: boolean
  svgRef?: Ref<SVGSVGElement>
  /** Identifiants des filtres, préfixés pour cohabiter avec un autre rendu. */
  idPrefix?: string
  /** Dimensions physiques. `100%` à l'écran, `297mm × 420mm` à l'export. */
  width?: string
  height?: string
  /**
   * `@font-face` en base64, injectés à l'export uniquement : un SVG détaché du
   * document ne peut résoudre aucune police, et le texte retomberait en serif
   * système — inutilisable à l'impression.
   */
  fontCss?: string
}

export function PlateSvg({
  plate,
  text,
  variant,
  animated,
  textured,
  svgRef,
  idPrefix = 'sic',
  width = '100%',
  height = '100%',
  fontCss,
}: PlateSvgProps) {
  const { palette } = plate
  const inkFilter = `${idPrefix}-ink`
  const grainFilter = `${idPrefix}-grain`
  const gridPattern = `${idPrefix}-grid`

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SHEET.w} ${SHEET.h}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${plate.word} — ${text.latin}`}
      style={{ display: 'block', color: palette.ink }}
    >
      {fontCss && <style dangerouslySetInnerHTML={{ __html: fontCss }} />}

      <defs>
        {/* Deux jeux de motifs : le sujet vit dans un groupe mis à l'échelle du
            cadrage, les détails agrandis non. Sans le second jeu, les hachures
            des détails auraient un pas divisé par l'échelle du sujet — grossier
            sur une petite plante, invisible sur une grande. */}
        <HatchPatterns idPrefix={idPrefix} ink={palette.ink} scale={plate.framing.scale} />
        <HatchPatterns idPrefix={`${idPrefix}-detail`} ink={palette.ink} scale={1} />

        <pattern id={gridPattern} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 0 H8 M0 0 V8" fill="none" stroke="currentColor" strokeWidth={0.12} opacity={0.55} />
        </pattern>

        {/* Le mordant de l'acide dans le métal : le trait n'est jamais
            parfaitement net, mais une taille douce reste NETTE. L'irrégularité
            vient maintenant du trait lui-même — épaisseur variable, tremblé de
            la médiane — pas d'un tremblement d'ensemble. On tord donc deux fois
            moins qu'avant, et à une fréquence plus haute. */}
        <filter id={inkFilter}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.14"
            numOctaves={2}
            seed={plate.seed % 997}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={0.32}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Grain du papier, désaturé et posé en multiply sur toute la feuille. */}
        <filter id={grainFilter}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={11} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      <rect x={0} y={0} width={SHEET.w} height={SHEET.h} fill={MOUNT_BOARD} />
      <rect x={0} y={0} width={SHEET.w} height={SHEET.h} fill={palette.paper} />

      {/* La cuvette : deux filets, l'un clair l'autre sombre, décalés d'un quart
          de millimètre. C'est un creux, pas un trait — il ne se voit que parce
          qu'il attrape la lumière d'un côté et l'ombre de l'autre. */}
      <g fill="none">
        <rect
          x={PLATEMARK.x + 0.28}
          y={PLATEMARK.y + 0.28}
          width={PLATEMARK.w}
          height={PLATEMARK.h}
          stroke="#fff"
          strokeWidth={0.5}
          opacity={0.55}
        />
        <rect
          x={PLATEMARK.x}
          y={PLATEMARK.y}
          width={PLATEMARK.w}
          height={PLATEMARK.h}
          stroke={palette.ink}
          strokeWidth={0.45}
          opacity={0.13}
        />
      </g>

      {variant === 'grid' && (
        <rect
          x={GRID_AREA.x}
          y={GRID_AREA.y}
          width={GRID_AREA.w}
          height={GRID_AREA.h}
          fill={`url(#${gridPattern})`}
          opacity={0.5}
        />
      )}

      {variant === 'mounted' && (
        <g stroke="currentColor" fill="none" opacity={0.45}>
          <rect x={MOUNT.x} y={MOUNT.y} width={MOUNT.w} height={MOUNT.h} strokeWidth={0.45} />
          <path d="M10 32 L32 10 M287 32 L265 10 M10 388 L32 410 M287 388 L265 410" strokeWidth={0.45} />
        </g>
      )}

      <g stroke="currentColor" fill="none" opacity={0.7}>
        <path d={`M${HEAD_RULE.x0} ${HEAD_RULE.y} H${HEAD_RULE.x1}`} strokeWidth={0.8} />
        <path d={`M${HEAD_RULE.x0} ${HEAD_RULE.y2} H${HEAD_RULE.x1}`} strokeWidth={0.25} />
      </g>

      <Cartouche text={text} animated={animated} />
      <Subject plate={plate} animated={animated} inked={textured} idPrefix={idPrefix} />
      <DetailPlates plate={plate} animated={animated} idPrefix={idPrefix} />

      {/* Équerres d'angle des deux figures, et le filet qui relie chacune à
          l'endroit du sujet dont elle est tirée. Sans ce renvoi les figures
          flottent : rien ne dit d'où elles viennent. */}
      <g stroke="currentColor" fill="none" opacity={0.42} strokeWidth={0.32}>
        {DETAIL_BOXES.map((box) => (
          <path key={box.y} d={cornerTicks(box)} />
        ))}
      </g>

      <g fill="currentColor" fontFamily={FONTS.body} fontSize={3.4} opacity={0.6}>
        {DETAIL_BOXES.map((box, i) => (
          <text
            key={box.y}
            x={box.x + FIGURE_NUMERAL_OFFSET.x}
            y={box.y + FIGURE_NUMERAL_OFFSET.y}
            letterSpacing={0.3}
          >
            {i + 1}
          </text>
        ))}
      </g>

      <FigureLeaders plate={plate} animated={animated} />

      <ScaleBar />

      <g stroke="currentColor" fill="none" opacity={0.65}>
        <path d={`M${FOOT_RULE.x0} ${FOOT_RULE.y} H${FOOT_RULE.x1}`} strokeWidth={0.7} />
        <path d={`M${FOOT_RULE.x0} ${FOOT_RULE.y2} H${FOOT_RULE.x1}`} strokeWidth={0.22} />
        <path d={`M${FOOT_RULE.splitX} 324 V404`} strokeWidth={0.22} opacity={0.55} />
      </g>

      <Annotations plate={plate} text={text} animated={animated} />
      <Stamp plate={plate} text={text} animated={animated} />

      <rect
        x={0}
        y={0}
        width={SHEET.w}
        height={SHEET.h}
        filter={`url(#${grainFilter})`}
        style={{
          opacity: textured ? 0.13 : 0,
          transition: animated ? 'opacity 0.5s ease-out' : undefined,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />
    </svg>
  )
}

/** Quatre équerres, une par coin, en un seul chemin. */
function cornerTicks(box: { x: number; y: number; w: number; h: number }): string {
  const t = CORNER_TICK
  const { x, y, w, h } = box
  return [
    `M${x} ${y + t} V${y} H${x + t}`,
    `M${x + w - t} ${y} H${x + w} V${y + t}`,
    `M${x + w} ${y + h - t} V${y + h} H${x + w - t}`,
    `M${x + t} ${y + h} H${x} V${y + h - t}`,
  ].join(' ')
}

/**
 * Les filets de renvoi : chaque figure agrandie montre d'où elle a été prélevée.
 *
 * Ils partent du chiffre de la figure et vont toucher un organe réel du sujet,
 * avec un chiffre jumeau posé sur la cible. C'est ce que fait une planche
 * d'étude, et c'est ce qui manquait le plus à la colonne de droite.
 */
function FigureLeaders({ plate, animated }: { plate: Plate; animated: boolean }) {
  const anchors = plateAnchors(plate)
  const targets = [anchors.figureOne, anchors.figureTwo]

  return (
    <g style={animated ? { animation: 'sic-in 1s ease-out 2.6s both' } : undefined}>
      {DETAIL_BOXES.map((box, i) => {
        const target = targets[i]
        if (!target) return null
        const from: Point = [box.x - 1.5, box.y + box.h * 0.5]
        /* Les deux filets bombent en sens contraire : leurs cibles peuvent être
           dans l'ordre inverse de leurs figures, et sans cet écartement ils se
           croiseraient au milieu de la planche. */
        const bow = i === 0 ? 0.075 : -0.075
        const { tip, direction } = buildLeader({ from, to: target, bow })
        /* Le chiffre se pose EN ARRIÈRE de la pointe et légèrement de côté :
           collé sur la cible, il tombait dans le feuillage et devenait illisible. */
        const label: Point = [
          tip[0] - direction[0] * 5 - direction[1] * 2.4,
          tip[1] - direction[1] * 5 + direction[0] * 2.4,
        ]

        return (
          <g key={box.y}>
            <Leader from={from} to={target} bow={bow} ink={plate.palette.ink} opacity={0.5} />
            {/* Le chiffre jumeau, posé au bout du filet, sur le sujet. */}
            <text
              x={label[0]}
              y={label[1]}
              fill={plate.palette.ink}
              fontFamily={FONTS.body}
              fontSize={3.6}
              opacity={0.75}
            >
              {i + 1}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** Barre d'échelle graduée : elle ancre le dessin dans le réel. */
function ScaleBar() {
  const { x, y, length, ticks } = SCALE_BAR
  /* Graduations : hautes aux extrémités, moyennes aux quarts, courtes ailleurs. */
  const heights = [3.5, 2, 2.5, 2, 2.5, 3.5]

  return (
    <g stroke="currentColor" fill="none" strokeWidth={0.35} opacity={0.65}>
      <path d={`M${x} ${y} H${x + length}`} />
      {ticks.map((offset, i) => {
        const h = heights[i] ?? 2
        return <path key={offset} d={`M${x + offset} ${y - h} V${y + h}`} />
      })}
    </g>
  )
}

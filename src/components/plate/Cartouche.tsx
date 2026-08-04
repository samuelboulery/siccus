import { FONTS } from '../../lib/fonts'
import { CARTOUCHE, DETAIL_BOXES, NOTA, SCALE_BAR, SPINE } from './layout'
import type { PlateText } from '../../lib/plateText'

type CartoucheProps = {
  text: PlateText
  animated: boolean
}

/**
 * Tout le texte IMPRIMÉ de la planche : en-tête, légendes des détails, échelle,
 * étiquettes latines du cartouche, mention de pied.
 *
 * Aucune chaîne n'est composée ici — elles arrivent déjà résolues depuis
 * `resolvePlateText`, surcharges comprises. Ce composant ne fait que les poser.
 */
export function Cartouche({ text, animated }: CartoucheProps) {
  return (
    <g
      fill="currentColor"
      style={animated ? { animation: 'sic-in 0.6s ease-out both' } : undefined}
    >
      {/* ── en-tête ── */}
      <text
        x={CARTOUCHE.left}
        y={25}
        fontFamily={FONTS.display}
        fontSize={5.6}
        letterSpacing={1.9}
        opacity={0.9}
      >
        {text.header}
      </text>
      <text
        x={277}
        y={25}
        fontFamily={FONTS.body}
        fontSize={3.2}
        letterSpacing={0.5}
        textAnchor="end"
        opacity={0.6}
      >
        {text.headerRight}
      </text>
      <text
        x={CARTOUCHE.left}
        y={36.6}
        fontFamily={FONTS.body}
        fontSize={3.1}
        fontStyle="italic"
        opacity={0.5}
      >
        {text.tagline}
      </text>
      <text
        x={277}
        y={36.6}
        fontFamily={FONTS.body}
        fontSize={3.1}
        letterSpacing={0.4}
        textAnchor="end"
        opacity={0.55}
      >
        {text.folioLine}
      </text>

      {/* ── marge : cote d'archive ── */}
      <text
        transform={`translate(${SPINE.x},${SPINE.y}) rotate(-90)`}
        fontFamily={FONTS.body}
        fontSize={2.9}
        letterSpacing={1.5}
        opacity={0.45}
        textAnchor="middle"
      >
        {text.spine}
      </text>

      {/* ── légendes des deux détails ── */}
      <text
        x={DETAIL_BOXES[0].x}
        y={DETAIL_BOXES[0].labelY}
        fontFamily={FONTS.body}
        fontSize={2.7}
        letterSpacing={0.35}
        opacity={0.6}
      >
        {text.detail1}
      </text>
      <text
        x={DETAIL_BOXES[1].x}
        y={DETAIL_BOXES[1].labelY}
        fontFamily={FONTS.body}
        fontSize={2.7}
        letterSpacing={0.35}
        opacity={0.6}
      >
        {text.detail2}
      </text>

      {/* ── échelle ── */}
      <text
        x={SCALE_BAR.x}
        y={SCALE_BAR.labelY}
        fontFamily={FONTS.body}
        fontSize={2.6}
        letterSpacing={0.4}
        opacity={0.5}
      >
        {text.scaleLabel}
      </text>
      <text
        x={SCALE_BAR.x}
        y={SCALE_BAR.legendY}
        fontFamily={FONTS.body}
        fontSize={2.6}
        opacity={0.55}
        textAnchor="middle"
      >
        {text.scaleZero}
      </text>
      <text
        x={SCALE_BAR.x + SCALE_BAR.length}
        y={SCALE_BAR.legendY}
        fontFamily={FONTS.body}
        fontSize={2.6}
        opacity={0.55}
        textAnchor="middle"
      >
        {text.scaleMax}
      </text>

      <text
        x={NOTA.x}
        y={NOTA.labelY}
        fontFamily={FONTS.body}
        fontSize={2.7}
        letterSpacing={0.6}
        opacity={0.55}
      >
        {text.notaLabel}
      </text>

      {/* ── détermination ── */}
      <text
        x={CARTOUCHE.left}
        y={CARTOUCHE.wordY}
        fontFamily={FONTS.display}
        fontSize={6.2}
        letterSpacing={2.1}
        opacity={0.85}
      >
        {text.word}
      </text>
      <text
        x={CARTOUCHE.left}
        y={CARTOUCHE.latinY}
        fontFamily={FONTS.display}
        fontSize={12}
        fontStyle="italic"
        opacity={0.95}
      >
        {text.latin}
      </text>
      <text
        x={CARTOUCHE.left}
        y={CARTOUCHE.diagnosisY}
        fontFamily={FONTS.body}
        fontSize={3}
        fontStyle="italic"
        opacity={0.55}
      >
        {text.diagnosis}
      </text>

      {/* ── champs remplis à la main ── */}
      <FieldRow
        label={text.labelFamilia}
        x={CARTOUCHE.left}
        y={CARTOUCHE.rows[0]}
        leader={CARTOUCHE.leaderLeft}
      />
      <FieldRow
        label={text.labelLocus}
        x={CARTOUCHE.left}
        y={CARTOUCHE.rows[1]}
        leader={CARTOUCHE.leaderLeft}
      />
      <FieldRow
        label={text.labelAltitudo}
        x={CARTOUCHE.left}
        y={CARTOUCHE.rows[2]}
        leader={CARTOUCHE.leaderLeft}
      />
      <FieldRow label={text.labelDeterminavit} x={CARTOUCHE.right} y={CARTOUCHE.wordY} />
      <FieldRow
        label={text.labelDies}
        x={CARTOUCHE.right}
        y={CARTOUCHE.rows[0]}
        leader={CARTOUCHE.leaderRight}
      />
      <FieldRow
        label={text.labelLegit}
        x={CARTOUCHE.right}
        y={CARTOUCHE.rows[1]}
        leader={CARTOUCHE.leaderRight}
      />
      <FieldRow
        label={text.labelHerbNo}
        x={CARTOUCHE.right}
        y={CARTOUCHE.rows[2]}
        leader={{ x: 214, w: 63 }}
      />

      <text
        x={CARTOUCHE.left}
        y={CARTOUCHE.footerY}
        fontFamily={FONTS.body}
        fontSize={2.4}
        opacity={0.4}
      >
        {text.footer}
      </text>
    </g>
  )
}

type FieldRowProps = {
  label: string
  x: number
  y: number
  /** Ligne de conduite pointillée, absente pour les champs sans valeur manuscrite. */
  leader?: { x: number; w: number }
}

function FieldRow({ label, x, y, leader }: FieldRowProps) {
  return (
    <>
      <text x={x} y={y} fontFamily={FONTS.body} fontSize={2.8} letterSpacing={0.55} opacity={0.6}>
        {label}
      </text>
      {leader && (
        <path
          d={`M${leader.x} ${y} H${leader.x + leader.w}`}
          stroke="currentColor"
          strokeWidth={0.25}
          strokeDasharray="0.5 1.1"
          opacity={0.42}
          fill="none"
        />
      )}
    </>
  )
}

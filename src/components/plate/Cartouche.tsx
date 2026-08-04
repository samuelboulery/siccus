import { fill, type Content } from '../../content'
import { FONTS } from '../../lib/fonts'
import { CARTOUCHE, DETAIL_BOXES, NOTA, SCALE_BAR, SPINE } from './layout'
import { detail2Scale, DETAIL_SCALES } from './DetailPlates'
import type { Plate } from '../../lib/types'

type CartoucheProps = {
  plate: Plate
  content: Content
  animated: boolean
}

/**
 * Tout le texte IMPRIMÉ de la planche : en-tête, légendes des détails, échelle,
 * étiquettes latines du cartouche, mention de pied.
 *
 * Aucune chaîne n'est écrite ici — elles viennent toutes de `content`, ce qui
 * rend la planche traduisible sans toucher au dessin.
 */
export function Cartouche({ plate, content, animated }: CartoucheProps) {
  const { plate: t } = content
  const g = plate.genome
  const detail1 = g.organType === 'lineaire' ? t.detail1Sheathing : t.detail1

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
        {t.header}
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
        {t.headerRight}
      </text>
      <text x={CARTOUCHE.left} y={36.6} fontFamily={FONTS.body} fontSize={3.1} fontStyle="italic" opacity={0.5}>
        {t.tagline}
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
        {fill(t.folioLine, { folio: plate.folio, specimen: plate.specimen })}
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
        {fill(t.spine, {
          specimen: plate.specimen,
          palette: content.palettes[plate.palette.id].toLocaleUpperCase(content.htmlLang),
        })}
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
        {fill(detail1, { scale: DETAIL_SCALES.leaf })}
      </text>
      <text
        x={DETAIL_BOXES[1].x}
        y={DETAIL_BOXES[1].labelY}
        fontFamily={FONTS.body}
        fontSize={2.7}
        letterSpacing={0.35}
        opacity={0.6}
      >
        {fill(t.detail2, {
          kind: t.detailKinds[plate.detail2],
          scale: detail2Scale(plate.detail2),
        })}
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
        {t.scaleLabel}
      </text>
      <text
        x={SCALE_BAR.x}
        y={SCALE_BAR.legendY}
        fontFamily={FONTS.body}
        fontSize={2.6}
        opacity={0.55}
        textAnchor="middle"
      >
        {t.scaleZero}
      </text>
      <text
        x={SCALE_BAR.x + SCALE_BAR.length}
        y={SCALE_BAR.legendY}
        fontFamily={FONTS.body}
        fontSize={2.6}
        opacity={0.55}
        textAnchor="middle"
      >
        {fill(t.scaleMax, { cm: SCALE_BAR.centimetres })}
      </text>

      <text x={NOTA.x} y={NOTA.labelY} fontFamily={FONTS.body} fontSize={2.7} letterSpacing={0.6} opacity={0.55}>
        {t.notaLabel}
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
        {plate.word.toLocaleUpperCase(content.htmlLang)}
      </text>
      <text
        x={CARTOUCHE.left}
        y={CARTOUCHE.latinY}
        fontFamily={FONTS.display}
        fontSize={12}
        fontStyle="italic"
        opacity={0.95}
      >
        {plate.latin}
      </text>
      <text
        x={CARTOUCHE.left}
        y={CARTOUCHE.diagnosisY}
        fontFamily={FONTS.body}
        fontSize={3}
        fontStyle="italic"
        opacity={0.55}
      >
        {fill(t.diagnosis, {
          port: content.ports[g.portId],
          phyllotaxy: content.phyllotaxies[g.phyllotaxy],
          margin: content.margins[g.margin],
        })}
      </text>

      {/* ── champs à remplir à la main ── */}
      <FieldRow label={t.fields.familia} x={CARTOUCHE.left} y={CARTOUCHE.rows[0]} leader={CARTOUCHE.leaderLeft} />
      <FieldRow label={t.fields.locus} x={CARTOUCHE.left} y={CARTOUCHE.rows[1]} leader={CARTOUCHE.leaderLeft} />
      <FieldRow label={t.fields.altitudo} x={CARTOUCHE.left} y={CARTOUCHE.rows[2]} leader={CARTOUCHE.leaderLeft} />
      <FieldRow label={t.fields.determinavit} x={CARTOUCHE.right} y={CARTOUCHE.wordY} />
      <FieldRow label={t.fields.dies} x={CARTOUCHE.right} y={CARTOUCHE.rows[0]} leader={CARTOUCHE.leaderRight} />
      <FieldRow label={t.fields.legit} x={CARTOUCHE.right} y={CARTOUCHE.rows[1]} leader={CARTOUCHE.leaderRight} />
      <FieldRow
        label={t.fields.herbNo}
        x={CARTOUCHE.right}
        y={CARTOUCHE.rows[2]}
        leader={{ x: 214, w: 63 }}
      />

      <text x={CARTOUCHE.left} y={CARTOUCHE.footerY} fontFamily={FONTS.body} fontSize={2.4} opacity={0.4}>
        {t.footer}
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

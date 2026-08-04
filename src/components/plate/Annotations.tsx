import { r2 } from '../../generator/rng'
import { FONTS } from '../../lib/fonts'
import { CARTOUCHE, NOTA, STAMP } from './layout'
import type { PlateText } from '../../lib/plateText'
import type { Plate } from '../../lib/types'

type AnnotationsProps = {
  plate: Plate
  text: PlateText
  animated: boolean
}

/**
 * Ce qui a été ajouté À LA MAIN sur la planche, après l'impression : la
 * détermination du collecteur, la révision d'une seconde main qui barre l'ancien
 * nom, les notes de terrain, et le tampon d'entrée au fichier.
 *
 * C'est cette couche qui fait basculer le rendu de « joli » à « trouvé dans un
 * carton ». Elle arrive en dernier dans l'animation, une fois l'encre sèche.
 */
export function Annotations({ plate, text, animated }: AnnotationsProps) {
  const { hand, hand2 } = plate.palette
  const fade = (delay: number) =>
    animated ? { animation: `sic-in 0.9s ease-out ${delay}s both` } : undefined

  /* La flèche part de la note et pointe vers le sujet ; elle suit donc le cadrage. */
  const arrowX = r2(Math.min(178, plate.framing.tx + 70))
  const arrowY = r2(plate.framing.groundY - 46)

  return (
    <g aria-hidden="true">
      {/* ── première main : la récolte ── */}
      <g fill={hand} fontFamily={FONTS.hand} style={fade(3.2)}>
        <text x={CARTOUCHE.leaderLeft.x + 2} y={CARTOUCHE.rows[0] + 0.6} fontSize={5.4}>
          {text.family}
        </text>
        <text x={CARTOUCHE.leaderLeft.x + 2} y={CARTOUCHE.rows[1] + 0.6} fontSize={4.6}>
          {text.locus}
        </text>
        <text x={CARTOUCHE.leaderLeft.x + 2} y={CARTOUCHE.rows[2] + 0.6} fontSize={4.6}>
          {text.altitude}
        </text>
        <text x={CARTOUCHE.leaderRight.x + 2} y={CARTOUCHE.rows[0] + 0.6} fontSize={5}>
          {text.date}
        </text>
        <text x={CARTOUCHE.leaderRight.x + 2} y={CARTOUCHE.rows[1] + 0.6} fontSize={5}>
          {text.collector}
        </text>
        <text x={CARTOUCHE.leaderRight.x + 6} y={CARTOUCHE.rows[2] + 0.6} fontSize={5}>
          {text.herbNo}
        </text>
      </g>

      {/* ── seconde main : la révision, l'ancien nom barré ── */}
      <g style={fade(3.7)}>
        <text
          x={CARTOUCHE.right}
          y={342}
          fill={hand}
          fontFamily={FONTS.hand}
          fontSize={6.4}
          opacity={0.75}
        >
          {text.oldName}
        </text>
        {/* La rature suit la longueur du nom : un nom court ne se fait pas barrer
            dix millimètres de vide. */}
        <path
          d={`M191 340 L${r2(CARTOUCHE.right + text.oldName.length * 2.6)} 339.2`}
          stroke={hand}
          strokeWidth={0.4}
          opacity={0.75}
          fill="none"
        />
        <text x={194} y={353} fill={hand2} fontFamily={FONTS.hand2} fontSize={5.2}>
          {text.revision}
        </text>
        <text x={194} y={361.5} fill={hand2} fontFamily={FONTS.hand2} fontSize={3.6} opacity={0.8}>
          {text.revisedOn}
        </text>
      </g>

      {/* ── notes de terrain, reliées au sujet ── */}
      <g style={fade(4)}>
        <text x={NOTA.x} y={NOTA.lines[0]} fill={hand2} fontFamily={FONTS.hand2} fontSize={4.2}>
          {text.note1}
        </text>
        <text x={NOTA.x} y={NOTA.lines[1]} fill={hand2} fontFamily={FONTS.hand2} fontSize={4.2}>
          {text.note2}
        </text>
        <path
          d={`M194 232 Q168 224 ${arrowX} ${arrowY}`}
          stroke={hand2}
          strokeWidth={0.35}
          fill="none"
          opacity={0.65}
        />
        <path d={`M${arrowX} ${arrowY} l3 -1.6 l-0.4 3.2 z`} fill={hand2} opacity={0.65} />
        <text x={26} y={322.5} fill={hand2} fontFamily={FONTS.hand2} fontSize={3.6} opacity={0.7}>
          {text.marginNote}
        </text>
      </g>
    </g>
  )
}

/** Le tampon d'entrée au fichier. Son inclinaison est dérivée du hash du mot. */
export function Stamp({ plate, text, animated }: AnnotationsProps) {
  const { stamp } = plate.palette
  return (
    <g
      transform={`translate(${STAMP.x},${STAMP.y}) rotate(${plate.stampAngle})`}
      opacity={0.34}
      fill={stamp}
      aria-hidden="true"
      style={animated ? { animation: 'sic-in 0.7s ease-out 4.3s both' } : undefined}
    >
      <rect
        x={-32}
        y={-13}
        width={64}
        height={26}
        fill="none"
        stroke={stamp}
        strokeWidth={0.8}
        rx={1}
      />
      <rect
        x={-29.6}
        y={-10.6}
        width={59.2}
        height={21.2}
        fill="none"
        stroke={stamp}
        strokeWidth={0.3}
        rx={1}
      />
      <text x={0} y={-3} textAnchor="middle" fontFamily={FONTS.body} fontSize={4} letterSpacing={1.1}>
        {text.stampTitle}
      </text>
      <text
        x={0}
        y={3.4}
        textAnchor="middle"
        fontFamily={FONTS.body}
        fontSize={2.6}
        letterSpacing={0.6}
      >
        {text.stampSubtitle}
      </text>
      <text
        x={0}
        y={9}
        textAnchor="middle"
        fontFamily={FONTS.body}
        fontSize={3.2}
        letterSpacing={0.8}
      >
        {text.date}
      </text>
    </g>
  )
}

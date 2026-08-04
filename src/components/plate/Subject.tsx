import { r2 } from '../../generator/rng'
import type { Organ, Plate, Stroke } from '../../lib/types'

/** Durée totale de la croissance. Sous 3 s l'effet est invisible, au-delà on cesse de tester des mots. */
const GROWTH_SPAN = 3.1
const WAVE_DURATION = 0.55

type SubjectProps = {
  plate: Plate
  /** Faux à l'export : la planche doit être entière dès le premier pixel. */
  animated: boolean
  /** Filtre d'encre — jamais pendant la croissance, il coûte 55 fps. */
  inked: boolean
  /** Préfixe des identifiants de masque, pour cohabiter avec un autre rendu. */
  idPrefix: string
}

/**
 * Le sujet : partie aérienne et racinaire, dessinées à l'échelle et à la position
 * décidées par le cadrage.
 *
 * La croissance est acropète — du tronc vers les extrémités. Les traits sont
 * GROUPÉS PAR VAGUE DE PROFONDEUR (une dizaine de groupes) et non animés
 * individuellement : quatre mille chemins avec chacun son `transition-delay`
 * créent quatre mille couches de composition et tuent le navigateur.
 */
export function Subject({ plate, animated, inked, idPrefix }: SubjectProps) {
  const { framing, palette, genome } = plate
  const waves = Math.max(1, plate.maxWave)
  const delayOf = (wave: number): number => r2(Math.min(wave, waves) * (GROWTH_SPAN / waves))

  const grow = (wave: number) =>
    animated
      ? { animation: `sic-grow ${WAVE_DURATION}s linear ${delayOf(wave)}s both` }
      : undefined
  const fade = (delay: number, duration = 0.8) =>
    animated ? { animation: `sic-in ${duration}s ease-out ${r2(delay)}s both` } : undefined

  const byWave = new Map<number, Stroke[]>()
  for (const stroke of plate.strokes) {
    const group = byWave.get(stroke.wave)
    if (group) group.push(stroke)
    else byWave.set(stroke.wave, [stroke])
  }

  return (
    <g>
      {/* Les masques de croissance. `stroke-dashoffset` ne s'applique pas à un
          remplissage : un trait de burin est une forme, pas un `stroke`. On le
          révèle donc à travers un masque construit sur sa ligne médiane, qui,
          elle, est bien un `stroke` animable.
          Rien de tout ceci n'existe à l'export, qui n'anime pas. */}
      {animated && (
        <defs>
          {[...byWave].map(([wave, strokes]) => (
            <mask
              key={wave}
              id={`${idPrefix}-grow-${wave}`}
              maskUnits="userSpaceOnUse"
              x={-2000}
              y={-2000}
              width={4000}
              height={4000}
            >
              <g
                stroke="#fff"
                fill="none"
                strokeLinecap="round"
                style={grow(wave)}
                pathLength={1}
              >
                {strokes.map((s, i) =>
                  s.spine ? (
                    <path
                      key={i}
                      d={s.spine}
                      /* Assez large pour couvrir le ruban qu'elle révèle. */
                      strokeWidth={r2(s.w * 1.9 + 1.2)}
                      pathLength={1}
                      strokeDasharray="1"
                    />
                  ) : null,
                )}
              </g>
            </mask>
          ))}
        </defs>
      )}

      <g
        transform={`translate(${r2(framing.tx)},${r2(framing.ty)}) scale(${r2(framing.scale)})`}
        filter={inked ? 'url(#sic-ink)' : undefined}
      >
        {[...byWave].map(([wave, strokes]) => {
          const masked = strokes.filter((s) => s.kind !== 'hair')
          const hairs = strokes.filter((s) => s.kind === 'hair')
          return (
            <g key={wave}>
              {/* Traits de burin, contours modelés et hachures de volume : tout
                  ce qui n'est pas un simple `stroke` animable est révélé par le
                  masque de sa vague. */}
              {masked.length > 0 && (
                <g mask={animated ? `url(#${idPrefix}-grow-${wave})` : undefined}>
                  {masked.map((s, i) =>
                    s.kind === 'nib' ? (
                      <path
                        key={i}
                        d={s.d}
                        fill={s.fillBlade ? `url(#${idPrefix}-hatch-2)` : palette.ink}
                        stroke={s.fillBlade ? palette.ink : 'none'}
                        strokeWidth={s.fillBlade ? r2(s.w) : undefined}
                      />
                    ) : (
                      <path
                        key={i}
                        d={s.d}
                        fill="none"
                        stroke={palette.ink}
                        strokeWidth={r2(s.lineWidth ?? s.w)}
                        strokeLinecap={s.kind === 'shade' ? 'round' : 'butt'}
                        strokeLinejoin="round"
                        opacity={s.kind === 'shade' ? 0.85 : 1}
                      />
                    ),
                  )}
                </g>
              )}

              {/* Cheveux : trop fins pour un contour, ils restent des `stroke`
                  et gardent l'animation par `stroke-dashoffset`. */}
              {hairs.length > 0 && (
                <g stroke={palette.ink} fill="none" style={grow(wave)}>
                  {hairs.map((s, i) => (
                    <path
                      key={i}
                      d={s.d}
                      strokeWidth={r2(s.w)}
                      /* `pathLength=1` normalise la longueur : un seul dasharray
                         pour tous les traits, quelle que soit leur longueur. */
                      pathLength={1}
                      strokeDasharray="1"
                    />
                  ))}
                </g>
              )}
            </g>
          )
        })}

        <g stroke={palette.ink} fill="none">
          {plate.marks.map((m, i) => (
            <path
              key={i}
              d={m.d}
              strokeWidth={r2(genome.thickness * 0.1)}
              opacity={0.85}
              pathLength={1}
              strokeDasharray="1"
              style={
                animated
                  ? { animation: `sic-grow 0.6s linear ${delayOf(m.wave)}s both` }
                  : undefined
              }
            />
          ))}
        </g>

        <g>
          {plate.dots.map((d, i) => (
            <circle
              key={i}
              cx={r2(d.x)}
              cy={r2(d.y)}
              r={r2(d.r)}
              /* Bouton ou épillet : tramé comme le reste, jamais un aplat. */
              fill={`url(#${idPrefix}-hatch-2)`}
              stroke={palette.ink}
              strokeWidth={0.24}
              style={fade(delayOf(d.wave) + 0.2, 0.5)}
            />
          ))}
        </g>

        <g>
          {plate.organs.map((organ, i) => (
            <LeafOrganEl
              key={i}
              organ={organ}
              ink={palette.ink}
              idPrefix={idPrefix}
              /* Léger décalage par feuille : elles ne se posent pas toutes ensemble. */
              style={fade(delayOf(organ.wave) + 0.3 + (i % 7) * 0.05)}
            />
          ))}
        </g>
      </g>

      {/* Ligne de sol : la plante a été arrachée, on marque où elle affleurait. */}
      <path
        d={`M26 ${r2(framing.groundY)} H180`}
        stroke={palette.ink}
        strokeWidth={0.4}
        opacity={0.45}
        fill="none"
        strokeDasharray="5 2.4"
        style={fade(0.1, 1)}
      />
    </g>
  )
}

type LeafOrganElProps = {
  organ: Organ
  ink: string
  idPrefix: string
  style: React.CSSProperties | undefined
}

function LeafOrganEl({ organ, ink, idPrefix, style }: LeafOrganElProps) {
  const { shape } = organ
  /* L'épaisseur du trait suit la taille de l'organe : une penne de fougère ne se
     dessine pas au même calibre qu'une feuille de rosette. */
  const k = Math.max(0.16, organ.size * 0.016)

  return (
    <g
      transform={`translate(${r2(organ.x)},${r2(organ.y)}) rotate(${r2(organ.ang + 90)})`}
      style={style}
    >
      {/* Tramé et trait de contour sur UN seul chemin. Le remplissage n'est plus
          un aplat de lavis mais un motif de hachures : une gravure n'a pas
          d'aplat, sa valeur vient de la densité du trait. Le contour est de loin
          le plus long des `d` d'un organe, et l'émettre deux fois doublait le
          poids du fichier sur une plante à mille feuilles. */}
      <path
        d={shape.outline}
        fill={`url(#${idPrefix}-hatch-${organ.hatchLevel})`}
        stroke={ink}
        strokeWidth={r2(k * 1.2)}
        strokeOpacity={0.9}
        strokeLinejoin="round"
      />
      {shape.hatch.length > 0 && (
        <path
          d={shape.hatch.join(' ')}
          fill="none"
          stroke={ink}
          strokeWidth={r2(k * 0.5)}
          opacity={0.42}
        />
      )}
      <path
        d={shape.veins.join(' ')}
        fill="none"
        stroke={ink}
        strokeWidth={r2(k * 0.68)}
        opacity={0.7}
      />
      <path d={shape.midrib} fill="none" stroke={ink} strokeWidth={r2(k * 1.2)} opacity={0.88} />

      {/* Le rabat de presse : la face inférieure du limbe, plus pâle d'un cran
          puisqu'elle a été retournée à l'ombre, et son arête bien marquée. */}
      {shape.fold && (
        <>
          <path
            d={shape.fold.flap}
            fill={`url(#${idPrefix}-hatch-${Math.max(1, organ.hatchLevel - 1)})`}
            stroke={ink}
            strokeWidth={r2(k * 1.1)}
            strokeLinejoin="round"
          />
          <path d={shape.fold.crease} fill="none" stroke={ink} strokeWidth={r2(k * 1.35)} />
        </>
      )}
      {shape.outline2 && (
        <path
          d={shape.outline2}
          fill="none"
          stroke={ink}
          strokeWidth={r2(k * 0.6)}
          opacity={0.45}
          strokeLinejoin="round"
        />
      )}
    </g>
  )
}

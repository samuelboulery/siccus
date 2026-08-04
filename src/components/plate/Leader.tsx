import { buildLeader, type LeaderSpec } from './leaders'

type LeaderProps = LeaderSpec & {
  /** Encre du filet. Les renvois de figures sont imprimés, la flèche des notes manuscrite. */
  ink: string
  opacity?: number
}

/**
 * Un filet de renvoi et sa pointe.
 *
 * Filet et pointe sont deux formes REMPLIES, pas des `stroke` : c'est ce qui
 * permet au trait d'enfler vers la pointe, comme tout trait de burin. Un filet
 * dégénéré rend des chemins vides et disparaît proprement.
 */
export function Leader({ ink, opacity = 0.7, ...spec }: LeaderProps) {
  const { shaft, head } = buildLeader(spec)
  if (!shaft) return null

  return (
    <g fill={ink} stroke="none" opacity={opacity} aria-hidden="true">
      <path d={shaft} />
      <path d={head} />
    </g>
  )
}

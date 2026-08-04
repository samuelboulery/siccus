import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { Content } from '../content'

type WordInputProps = {
  value: string
  content: Content
  onChange: (value: string) => void
  /** Appelé quand la saisie est validée : Entrée, ou perte du focus. */
  onCommit: () => void
}

/**
 * Le champ. Nu, centré, gros corps, sans bordure : c'est la seule entrée du
 * produit, il ne doit ressembler à aucun formulaire.
 *
 * Il ne se vide jamais seul — un mot déjà tapé reste lisible pendant qu'on
 * regarde sa planche.
 */
export function WordInput({ value, content, onChange, onCommit }: WordInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  return (
    <div className="word">
      <div className="kicker">{content.ui.kicker}</div>
      <input
        ref={ref}
        className="word__input"
        type="text"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        aria-label={content.ui.placeholder}
        placeholder={content.ui.placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCommit}
      />
      <div className="word__rule" />
    </div>
  )
}

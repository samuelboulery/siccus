import { useEffect, useRef, type KeyboardEvent } from 'react'

type WordInputProps = {
  value: string
  /** Textes déjà résolus : ils sont éditables comme le reste de la page. */
  kicker: string
  placeholder: string
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
export function WordInput({ value, kicker, placeholder, onChange, onCommit }: WordInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  return (
    <div className="word">
      <div className="kicker">{kicker}</div>
      <input
        ref={ref}
        className="word__input"
        type="text"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCommit}
      />
      <div className="word__rule" />
    </div>
  )
}

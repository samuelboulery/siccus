import { useEffect, useId, useRef, useState } from 'react'
import {
  PLATE_TEXT_FIELDS,
  PLATE_TEXT_SECTIONS,
  type PlateText,
  type PlateTextKey,
  type PlateTextOverrides,
  type PlateTextSection,
} from '../lib/plateText'
import type { Content } from '../content'

/** Sections ouvertes au premier affichage : celles qu'on vient personnaliser. */
const OPEN_BY_DEFAULT: readonly PlateTextSection[] = ['determination', 'collection']

/** Champs assez longs pour mériter une zone de texte plutôt qu'une ligne. */
const LONG_FIELDS = new Set<PlateTextKey>(['footer', 'tagline', 'locus', 'note1', 'note2'])

type ContentPanelProps = {
  content: Content
  /** Valeurs affichées, surcharges comprises. */
  text: PlateText
  /** Ce que le mot avait tiré, pour l'invite et le retour en arrière. */
  defaults: PlateText
  overrides: PlateTextOverrides
  dirty: boolean
  onChange: (key: PlateTextKey, value: string) => void
  onRevert: (key: PlateTextKey) => void
  onResetAll: () => void
  onClose: () => void
}

/**
 * Le panneau d'édition du contenu.
 *
 * Il ne touche jamais au dessin : la planche est décidée par le mot seul, et
 * toutes ces valeurs sont rendues par-dessus. C'est ce qui permet de tout
 * ouvrir à l'édition sans abîmer la promesse de déterminisme.
 */
export function ContentPanel({
  content,
  text,
  defaults,
  overrides,
  dirty,
  onChange,
  onRevert,
  onResetAll,
  onClose,
}: ContentPanelProps) {
  const { editor } = content
  const [open, setOpen] = useState<ReadonlySet<PlateTextSection>>(
    () => new Set(OPEN_BY_DEFAULT),
  )
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()

  /* Le focus se pose sur le panneau lui-même, UNE seule fois, à l'ouverture.
     Le remettre à chaque rendu le volerait au champ qu'on est en train de
     remplir — et s'il atterrissait sur « Fermer », la frappe suivante
     refermerait le panneau. */
  useEffect(() => {
    panel.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggle = (section: PlateTextSection): void =>
    setOpen((previous) => {
      const next = new Set(previous)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })

  return (
    <aside className="panel" ref={panel} tabIndex={-1} aria-labelledby={titleId}>
      <header className="panel__head">
        <h2 className="panel__title" id={titleId}>
          {editor.title}
        </h2>
        <button type="button" className="panel__close" onClick={onClose}>
          {editor.close}
        </button>
      </header>

      <p className="panel__hint">{editor.hint}</p>

      <div className="panel__body">
        {PLATE_TEXT_SECTIONS.map((section) => {
          const fields = PLATE_TEXT_FIELDS.filter((field) => field.section === section)
          const changed = fields.some((field) => field.key in overrides)
          const expanded = open.has(section)

          return (
            <section className="group" key={section}>
              <button
                type="button"
                className="group__head"
                aria-expanded={expanded}
                onClick={() => toggle(section)}
              >
                <span className="group__caret" aria-hidden="true">
                  {expanded ? '▾' : '▸'}
                </span>
                {editor.sections[section]}
                {changed && (
                  <span className="group__dot" aria-hidden="true">
                    ·
                  </span>
                )}
              </button>

              {expanded && (
                <div className="group__fields">
                  {fields.map((field) => (
                    <Field
                      key={field.key}
                      label={editor.fields[field.key]}
                      value={text[field.key]}
                      placeholder={defaults[field.key]}
                      overridden={field.key in overrides}
                      scopeNote={field.scope === 'specimen' ? editor.specimenScope : undefined}
                      revertLabel={editor.revert}
                      long={LONG_FIELDS.has(field.key)}
                      onChange={(value) => onChange(field.key, value)}
                      onRevert={() => onRevert(field.key)}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <footer className="panel__foot">
        <button
          type="button"
          className="panel__reset"
          disabled={!dirty}
          onClick={() => {
            if (window.confirm(editor.resetAllConfirm)) onResetAll()
          }}
        >
          ⟲ {editor.resetAll}
        </button>
      </footer>
    </aside>
  )
}

type FieldProps = {
  label: string
  value: string
  placeholder: string
  overridden: boolean
  scopeNote: string | undefined
  revertLabel: string
  long: boolean
  onChange: (value: string) => void
  onRevert: () => void
}

function Field({
  label,
  value,
  placeholder,
  overridden,
  scopeNote,
  revertLabel,
  long,
  onChange,
  onRevert,
}: FieldProps) {
  const id = useId()
  const shared = {
    id,
    className: 'field__input',
    value,
    placeholder,
    spellCheck: false,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
  }

  return (
    <div className="field" data-overridden={overridden}>
      <div className="field__row">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        {overridden && (
          <button type="button" className="field__revert" title={revertLabel} onClick={onRevert}>
            ⟲<span className="visually-hidden"> {revertLabel}</span>
          </button>
        )}
      </div>
      {long ? <textarea {...shared} rows={2} /> : <input type="text" {...shared} />}
      {/* L'avertissement n'a d'intérêt qu'une fois le champ modifié — le
          répéter sous chaque ligne intacte noierait le panneau. */}
      {overridden && scopeNote && <p className="field__scope">{scopeNote}</p>}
    </div>
  )
}

import { CONTENT, fill, LOCALES, type Content, type Locale } from '../content'
import type { Variant } from '../lib/types'

const VARIANTS: readonly Variant[] = ['mounted', 'bare', 'grid'] as const

type ActionBarProps = {
  content: Content
  locale: Locale
  variant: Variant
  /** Ligne de légende : port et palette de la planche affichée. */
  caption: { port: string; palette: string }
  busy: boolean
  onVariantChange: (variant: Variant) => void
  onLocaleChange: (locale: Locale) => void
  onExportSvg: () => void
  onExportPng: () => void
}

/** Le bas de l'écran : exports, montage, langue. Faible opacité — rien ne doit concurrencer la planche. */
export function ActionBar({
  content,
  locale,
  variant,
  caption,
  busy,
  onVariantChange,
  onLocaleChange,
  onExportSvg,
  onExportPng,
}: ActionBarProps) {
  return (
    <div className="actions">
      <div className="actions__row actions__row--export">
        <button type="button" className="act act--export" onClick={onExportSvg} disabled={busy}>
          {content.ui.exportSvg}
        </button>
        <span className="actions__sep" aria-hidden="true" />
        <button type="button" className="act act--export" onClick={onExportPng} disabled={busy}>
          {content.ui.exportPng}
        </button>
      </div>

      <div className="actions__row">
        {VARIANTS.map((id) => (
          <button
            key={id}
            type="button"
            className="act act--option"
            aria-pressed={variant === id}
            data-active={variant === id}
            onClick={() => onVariantChange(id)}
          >
            {content.ui.variants[id]}
          </button>
        ))}
      </div>

      <div className="actions__row" role="group" aria-label={content.ui.languageLabel}>
        {LOCALES.map((id) => (
          <button
            key={id}
            type="button"
            className="act act--option"
            lang={CONTENT[id].htmlLang}
            aria-pressed={locale === id}
            data-active={locale === id}
            onClick={() => onLocaleChange(id)}
          >
            {CONTENT[id].shortName}
          </button>
        ))}
      </div>

      <p className="caption">{fill(content.ui.caption, caption)}</p>
    </div>
  )
}

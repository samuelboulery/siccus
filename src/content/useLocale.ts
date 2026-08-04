import { useCallback, useEffect, useState } from 'react'
import { CONTENT, DEFAULT_LOCALE, isLocale, type Content, type Locale } from './index'

const STORAGE_KEY = 'siccus.locale'

/**
 * Choix initial : ce que l'utilisateur a déjà retenu, sinon la langue du
 * navigateur, sinon le français. Aucune de ces sources n'est fiable — un
 * `localStorage` peut contenir n'importe quoi et lever en navigation privée.
 */
function detectLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    /* localStorage indisponible : on retombe sur la langue du navigateur. */
  }

  const preferred = window.navigator.languages ?? [window.navigator.language]
  for (const tag of preferred) {
    const base = tag.slice(0, 2).toLowerCase()
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}

export type LocaleState = {
  locale: Locale
  content: Content
  setLocale: (next: Locale) => void
}

export function useLocale(): LocaleState {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* Le choix ne survivra pas au rechargement — sans conséquence sur la planche. */
    }
  }, [])

  const content = CONTENT[locale]

  useEffect(() => {
    document.documentElement.lang = content.htmlLang
    document.title = content.documentTitle
  }, [content])

  return { locale, content, setLocale }
}

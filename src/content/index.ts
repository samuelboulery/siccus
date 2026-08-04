import { fr } from './fr'
import { en } from './en'
import type { Content, Locale } from './types'

export const CONTENT: Record<Locale, Content> = { fr, en }
export const LOCALES: readonly Locale[] = ['fr', 'en'] as const
export const DEFAULT_LOCALE: Locale = 'fr'

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

export type { Content, Locale }
export { fill } from './fill'

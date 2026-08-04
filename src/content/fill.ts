/**
 * Remplit un gabarit de contenu : `'f. {folio} · n° {specimen}'`.
 *
 * Un espace réservé sans valeur est laissé tel quel plutôt que remplacé par
 * `undefined` — un `{specimen}` visible sur la planche se repère, un `undefined`
 * imprimé en A3 se découvre chez l'imprimeur.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}

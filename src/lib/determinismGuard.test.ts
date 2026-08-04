import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

/**
 * Piège n°1 du cahier des charges : un `Math.random()` oublié quelque part.
 *
 * Le déterminisme casserait sans la moindre erreur — visible seulement en
 * retapant un mot des jours plus tard. ESLint le refuse déjà (`no-restricted-
 * properties`), mais un lint peut se désactiver en commentaire ; ce test-ci
 * relit le code source et ne peut pas être neutralisé localement.
 */

const SRC = new URL('..', import.meta.url).pathname

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    /* Les tests sont exclus : celui-ci cite les motifs qu'il interdit, et les
       autres ont le droit de comparer des sources aléatoires entre elles. */
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : []
  })
}

/** Les commentaires ont le droit de nommer ce qui est interdit — c'est même leur rôle. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

test('aucune source non déterministe dans src/', () => {
  /* Motifs construits à l'exécution : les écrire en clair ferait échouer ce
     fichier sur lui-même. */
  const forbidden = [
    { label: 'Math.random', pattern: new RegExp(['Math', '\\.', 'random', '\\('].join('')) },
    { label: 'crypto.getRandomValues', pattern: new RegExp(['getRandom', 'Values'].join('')) },
    { label: 'Date.now', pattern: new RegExp(['Date', '\\.', 'now', '\\('].join('')) },
  ]

  const offenders: string[] = []
  for (const file of sourceFiles(SRC)) {
    const source = stripComments(readFileSync(file, 'utf8'))
    for (const { label, pattern } of forbidden) {
      if (pattern.test(source)) offenders.push(`${file.slice(SRC.length)} → ${label}`)
    }
  }

  expect(offenders).toEqual([])
})

import { mulberry32, normalize, seedOf } from './rng'
import { buildGenome } from './genome'
import { createSketch } from './sketch'
import { growPort } from './ports'
import { growRoots } from './roots'
import { frameSubject } from './framing'
import { buildNomenclature, herbariumDate } from './nomenclature'
import type { BuildOptions, Plate } from '../lib/types'

/**
 * Un mot → une planche entièrement décidée.
 *
 * Tout est généré en UNE PASSE, avant l'affichage : l'animation ne fait que
 * révéler une planche déjà décidée, aucun calcul pendant la croissance.
 *
 * Ordre de consommation de `rng`, dans cet ordre et jamais un autre :
 *   1. génome (13 tirages)  → src/generator/genome.ts
 *   2. partie aérienne      → src/generator/ports.ts
 *   3. système racinaire    → src/generator/roots.ts
 *   4. nomenclature (9)     → src/generator/nomenclature.ts
 * Le cadrage ne consomme rien : il relit la géométrie déjà produite.
 *
 * La planche ne contient AUCUN texte localisé — voir `Plate` dans lib/types.ts.
 */
export function buildPlate(word: string, options: BuildOptions = {}): Plate {
  const normalized = normalize(word) || 'siccus'
  const seed = seedOf(word)
  const rng = mulberry32(seed)
  const wordLength = normalized.replace(/\s/g, '').length

  const { genome, palette } = buildGenome(rng, wordLength)

  const sketch = createSketch(genome, rng)
  const maxWave = growPort(sketch, genome, rng)
  growRoots(sketch, genome, rng)

  const framing = frameSubject(sketch.strokes, sketch.organs)
  const nomenclature = buildNomenclature(rng, genome, seed)

  return {
    word,
    seed,
    genome,
    palette,
    strokes: sketch.strokes,
    organs: sketch.organs,
    dots: sketch.dots,
    marks: sketch.marks,
    maxWave: Math.max(2, maxWave),
    framing,
    date: herbariumDate(options.now ?? new Date()),
    ...nomenclature,
  }
}

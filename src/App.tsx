import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WordInput } from './components/WordInput'
import { ActionBar } from './components/ActionBar'
import { PlateSvg } from './components/plate/PlateSvg'
import { buildPlate } from './generator/buildPlate'
import { useLocale } from './content/useLocale'
import type { Variant } from './lib/types'

/**
 * Durée après laquelle la planche est considérée « posée » : la croissance dure
 * 3,1 s, les dernières annotations manuscrites arrivent à 4,3 s. La texture ne
 * s'applique qu'ensuite — jamais pendant l'animation.
 */
const SETTLE_DELAY_MS = 5200

export function App() {
  const { locale, content, setLocale } = useLocale()

  const [word, setWord] = useState(content.ui.defaultWord)
  const [committed, setCommitted] = useState(content.ui.defaultWord)
  const [variant, setVariant] = useState<Variant>('mounted')
  const [settled, setSettled] = useState(false)
  /** Incrémenté à chaque nouveau mot : remonte le SVG et relance la croissance. */
  const [run, setRun] = useState(0)
  const [busy, setBusy] = useState(false)

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setSettled(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSettled(true), SETTLE_DELAY_MS)
    return () => clearTimeout(timer.current)
  }, [run])

  /* La planche est décidée en une passe. La langue n'entre pas dans le calcul :
     changer FR/EN ne redessine rien, cela relit seulement les textes. */
  const plate = useMemo(() => buildPlate(committed), [committed])

  const commit = useCallback(() => {
    const next = word.trim()
    if (!next || next === committed) return
    setCommitted(next)
    setRun((n) => n + 1)
  }, [word, committed])

  const runExport = useCallback(
    async (kind: 'svg' | 'png') => {
      setBusy(true)
      try {
        /* Chargé à la demande : `react-dom/server` et les six polices ne pèsent
           sur personne tant qu'on n'a pas cliqué. */
        const { exportSvg, exportPng } = await import('./lib/exportPlate')
        const input = { plate, content, variant }
        await (kind === 'svg' ? exportSvg(input) : exportPng(input))
      } catch (error) {
        /* Un export raté ne doit pas casser l'écran : la planche reste là, et le
           bouton redevient actif. */
        window.alert(error instanceof Error ? error.message : String(error))
      } finally {
        setBusy(false)
      }
    },
    [plate, content, variant],
  )

  return (
    <main className="screen">
      <WordInput value={word} content={content} onChange={setWord} onCommit={commit} />

      <div className="sheet">
        <PlateSvg
          key={run}
          plate={plate}
          content={content}
          variant={variant}
          animated
          textured={settled}
        />
      </div>

      <ActionBar
        content={content}
        locale={locale}
        variant={variant}
        busy={busy}
        caption={{
          port: content.ports[plate.genome.portId],
          palette: content.palettes[plate.palette.id],
        }}
        onVariantChange={setVariant}
        onLocaleChange={setLocale}
        onExportSvg={() => void runExport('svg')}
        onExportPng={() => void runExport('png')}
      />
    </main>
  )
}

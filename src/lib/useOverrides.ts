import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  isPlateTextKey,
  scopeOf,
  type PlateTextKey,
  type PlateTextOverrides,
} from './plateText'

const STORAGE_KEY = 'siccus.overrides'

/**
 * Les surcharges de contenu, en deux portées.
 *
 * `global` — le nom du récolteur, les en-têtes, le tampon : c'est ton herbier,
 * pas ce spécimen-ci. Retenu en `localStorage`, suit tous les mots.
 *
 * `specimen` — le binôme, la station, les notes : ce que le mot a tiré. Retenu en
 * mémoire seulement, et remis au tirage dès qu'on tape un autre mot. Sinon une
 * planche neuve hériterait d'annotations qui ne la concernent pas.
 */
export type OverridesState = {
  overrides: PlateTextOverrides
  /** Vrai si au moins un champ est surchargé. */
  dirty: boolean
  set: (key: PlateTextKey, value: string) => void
  revert: (key: PlateTextKey) => void
  resetAll: () => void
}

function readStored(): PlateTextOverrides {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    /* Le contenu de `localStorage` n'est jamais digne de confiance : il peut
       dater d'une version où un champ s'appelait autrement, ou avoir été bricolé
       à la main. On ne garde que des clés connues portant des chaînes. */
    const clean: PlateTextOverrides = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isPlateTextKey(key) && typeof value === 'string' && scopeOf(key) === 'global') {
        clean[key] = value
      }
    }
    return clean
  } catch {
    return {}
  }
}

export function useOverrides(word: string): OverridesState {
  const [global, setGlobal] = useState<PlateTextOverrides>(readStored)
  const [specimen, setSpecimen] = useState<PlateTextOverrides>({})

  /* Nouveau mot, nouveau spécimen : ce qui décrivait le précédent s'efface. */
  useEffect(() => {
    setSpecimen({})
  }, [word])

  useEffect(() => {
    try {
      if (Object.keys(global).length === 0) window.localStorage.removeItem(STORAGE_KEY)
      else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(global))
    } catch {
      /* Navigation privée ou quota plein : les surcharges ne survivront pas au
         rechargement, mais la session en cours reste intacte. */
    }
  }, [global])

  const set = useCallback((key: PlateTextKey, value: string) => {
    const update = (previous: PlateTextOverrides): PlateTextOverrides => ({
      ...previous,
      [key]: value,
    })
    if (scopeOf(key) === 'global') setGlobal(update)
    else setSpecimen(update)
  }, [])

  const revert = useCallback((key: PlateTextKey) => {
    const drop = (previous: PlateTextOverrides): PlateTextOverrides => {
      const rest = { ...previous }
      delete rest[key]
      return rest
    }
    if (scopeOf(key) === 'global') setGlobal(drop)
    else setSpecimen(drop)
  }, [])

  const resetAll = useCallback(() => {
    setGlobal({})
    setSpecimen({})
  }, [])

  const overrides = useMemo(() => ({ ...global, ...specimen }), [global, specimen])

  return {
    overrides,
    dirty: Object.keys(overrides).length > 0,
    set,
    revert,
    resetAll,
  }
}

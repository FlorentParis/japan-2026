import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dateISO, journeeDu } from '../lib/aujourdhui'
import { usePersistentState } from '../lib/usePersistentState'
import { MODE_ORDER } from '../lib/modes'
import type { Currency } from '../lib/format'
import type { TransportMode } from '../types'
import { TripContext, type Selection, type ThemeMode, type TripState, type ViewId } from './trip-state'

/**
 * Section ouverte au chargement.
 *
 * Pendant le séjour, c'est « Aujourd'hui » : sur place, la question n'est pas
 * comment le voyage est bâti mais quel train part maintenant. Avant et après, la
 * journée en cours n'a rien à montrer et l'aperçu reprend sa place — c'est la
 * même règle que partout ici, ne rien afficher qu'on n'ait à afficher.
 */
function vueInitiale(): ViewId {
  return journeeDu(dateISO(new Date())).phase === 'pendant' ? 'aujourdhui' : 'apercu'
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>(null)
  const [view, setView] = useState<ViewId>(vueInitiale)
  const [visibleModes, setVisibleModes] = useState<TransportMode[]>([...MODE_ORDER])
  const [currency, setCurrency] = usePersistentState<Currency>('devise', 'jpy')
  const [theme, setTheme] = usePersistentState<ThemeMode>('theme', 'auto')

  // Reflète le réglage sur <html data-theme> — la même règle que le script en
  // tête d'index.html, qui a déjà posé l'attribut avant ce premier rendu. En
  // mode « auto », on suit les changements de préférence système en direct
  // (bascule jour/nuit de l'OS) ; sinon il n'y a rien à écouter.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const appliquer = () => {
      const sombre = theme === 'dark' || (theme !== 'light' && mq.matches)
      document.documentElement.dataset.theme = sombre ? 'dark' : 'light'
    }
    appliquer()
    if (theme !== 'auto') return
    mq.addEventListener('change', appliquer)
    return () => mq.removeEventListener('change', appliquer)
  }, [theme])

  const selectDestination = useCallback((id: string) => {
    // Re-cliquer la même étape la désélectionne : la carte revient au parcours entier.
    setSelection((current) =>
      current?.kind === 'destination' && current.id === id ? null : { kind: 'destination', id },
    )
  }, [])

  const selectJourney = useCallback((id: string, legId?: string) => {
    setSelection((current) =>
      current?.kind === 'journey' && current.id === id && current.legId === legId
        ? null
        : { kind: 'journey', id, legId },
    )
  }, [])

  const clearSelection = useCallback(() => setSelection(null), [])

  const goTo = useCallback((next: ViewId, nextSelection?: Selection) => {
    setView(next)
    if (nextSelection !== undefined) setSelection(nextSelection)
  }, [])

  const toggleMode = useCallback((mode: TransportMode) => {
    setVisibleModes((current) =>
      current.includes(mode)
        ? current.filter((m) => m !== mode)
        : MODE_ORDER.filter((m) => m === mode || current.includes(m)),
    )
  }, [])

  const resetModes = useCallback(() => setVisibleModes([...MODE_ORDER]), [])

  const value = useMemo<TripState>(
    () => ({
      selection,
      selectDestination,
      selectJourney,
      clearSelection,
      goTo,
      view,
      setView,
      visibleModes,
      toggleMode,
      resetModes,
      currency,
      setCurrency,
      theme,
      setTheme,
    }),
    [
      selection,
      selectDestination,
      selectJourney,
      clearSelection,
      goTo,
      view,
      visibleModes,
      toggleMode,
      resetModes,
      currency,
      setCurrency,
      theme,
      setTheme,
    ],
  )

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

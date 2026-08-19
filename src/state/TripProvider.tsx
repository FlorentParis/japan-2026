import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { usePersistentState } from '../lib/usePersistentState'
import { MODE_ORDER } from '../lib/modes'
import type { Currency } from '../lib/format'
import type { TransportMode } from '../types'
import { TripContext, type Selection, type TripState, type ViewId } from './trip-state'

export function TripProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>(null)
  const [view, setView] = useState<ViewId>('apercu')
  const [visibleModes, setVisibleModes] = useState<TransportMode[]>([...MODE_ORDER])
  const [currency, setCurrency] = usePersistentState<Currency>('devise', 'jpy')

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
    ],
  )

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

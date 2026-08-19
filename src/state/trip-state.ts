/**
 * État partagé du site : ce qui est sélectionné, quelle vue est ouverte,
 * quels modes de transport sont affichés, en quelle devise.
 *
 * La sélection est unique et partagée : cliquer une ville sur la carte,
 * un jour dans la timeline ou un trajet dans la liste des transports désigne
 * toujours le même objet. C'est ce qui synchronise carte et frise chronologique.
 */
import { createContext, useContext } from 'react'
import type { Currency } from '../lib/format'
import type { TransportMode } from '../types'

export type Selection =
  | { kind: 'destination'; id: string }
  | { kind: 'journey'; id: string; legId?: string }
  | null

export const VIEWS = [
  { id: 'apercu', label: 'Aperçu', icon: '🏯' },
  { id: 'carte', label: 'Carte', icon: '🗺️' },
  { id: 'itineraire', label: 'Itinéraire', icon: '📅' },
  { id: 'hotels', label: 'Hôtels', icon: '🏨' },
  { id: 'activites', label: 'Activités', icon: '🎌' },
  { id: 'budget', label: 'Budget', icon: '💴' },
  { id: 'transports', label: 'Transports', icon: '🚆' },
] as const

export type ViewId = (typeof VIEWS)[number]['id']

export type TripState = {
  selection: Selection
  selectDestination: (id: string) => void
  selectJourney: (id: string, legId?: string) => void
  clearSelection: () => void
  /** Ouvre une vue, en sélectionnant éventuellement un élément au passage. */
  goTo: (view: ViewId, selection?: Selection) => void
  view: ViewId
  setView: (view: ViewId) => void
  visibleModes: TransportMode[]
  toggleMode: (mode: TransportMode) => void
  resetModes: () => void
  currency: Currency
  setCurrency: (currency: Currency) => void
}

export const TripContext = createContext<TripState | null>(null)

export function useTrip(): TripState {
  const state = useContext(TripContext)
  if (!state) throw new Error('useTrip() doit être appelé à l’intérieur de <TripProvider>.')
  return state
}

/** Vrai si cette étape est l'élément sélectionné. */
export function isDestinationSelected(selection: Selection, id: string): boolean {
  return selection?.kind === 'destination' && selection.id === id
}

export function isJourneySelected(selection: Selection, id: string): boolean {
  return selection?.kind === 'journey' && selection.id === id
}

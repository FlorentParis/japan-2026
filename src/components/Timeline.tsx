/**
 * FRISE CHRONOLOGIQUE, dans l'ordre du voyage.
 *
 * Elle alterne étapes et trajets : entre deux villes, il y a toujours le
 * déplacement, avec ses modes et sa durée — jamais un saut inexpliqué.
 *
 * Synchronisation avec la carte : sélectionner une ligne recadre la carte, et
 * cliquer sur la carte fait défiler la frise jusqu'à l'élément correspondant.
 * La sélection est unique et partagée (`state/trip-state.ts`).
 */
import { useEffect, useRef } from 'react'
import { DESTINATIONS } from '../data/destinations'
import { JOURNEYS } from '../data/journeys'
import { journeyTotals } from '../lib/derive'
import { STAY_LABEL, formatDateRange, formatMinutes, formatPartialAmount } from '../lib/format'
import { MODE_STYLES } from '../lib/modes'
import { scrollBehavior } from '../lib/motion'
import { useTrip } from '../state/trip-state'
import type { Journey } from '../types'
import { DestinationCard } from './DestinationCard'
import { JourneyCard } from './JourneyCard'
import { CertaintyBadge } from './ui'

/** « 3 tronçons · 2 correspondances » */
function describeLegs(journey: Journey): string {
  const legs = `${journey.legs.length} tronçon${journey.legs.length > 1 ? 's' : ''}`
  const count = journey.connections?.length ?? 0
  if (count === 0) return legs
  return `${legs} · ${count} correspondance${count > 1 ? 's' : ''}`
}

export function Timeline({ compact }: { compact?: boolean }) {
  const { selection, selectDestination, selectJourney, currency } = useTrip()
  const listRef = useRef<HTMLOListElement>(null)
  const itemsRef = useRef(new Map<string, HTMLElement>())

  // La sélection peut venir de la carte : on amène l'élément dans le champ de vision.
  useEffect(() => {
    if (!selection) return
    const key = `${selection.kind}:${selection.id}`
    itemsRef.current.get(key)?.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() })
  }, [selection])

  const register = (key: string) => (element: HTMLElement | null) => {
    if (element) itemsRef.current.set(key, element)
    else itemsRef.current.delete(key)
  }

  return (
    <ol className={`timeline${compact ? ' timeline--compact' : ''}`} ref={listRef}>
      {DESTINATIONS.map((dest, index) => {
        const journey = JOURNEYS[index]
        const destSelected = selection?.kind === 'destination' && selection.id === dest.id
        const journeySelected = journey && selection?.kind === 'journey' && selection.id === journey.id
        const totals = journey ? journeyTotals(journey) : undefined
        const dates = formatDateRange(dest.dates.start, dest.dates.end)

        return (
          <li key={dest.id} className="timeline__group">
            <div
              className={`timeline__step${destSelected ? ' is-selected' : ''}`}
              ref={register(`destination:${dest.id}`)}
            >
              <button
                type="button"
                className="timeline__step-button"
                onClick={() => selectDestination(dest.id)}
                aria-expanded={destSelected}
              >
                <span className="timeline__order" aria-hidden="true">
                  {dest.order}
                </span>
                <span className="timeline__step-text">
                  <span className="timeline__name">
                    {dest.name}
                    {dest.nameJa && <span className="timeline__name-ja" lang="ja"> {dest.nameJa}</span>}
                  </span>
                  <span className="timeline__region">{dest.region}</span>
                  <span className="timeline__dates">
                    {dates ?? <span className="to-fill">dates à compléter</span>}
                    <span className="timeline__stay"> · {STAY_LABEL[dest.stay]}</span>
                  </span>
                </span>
              </button>
              {destSelected && <DestinationCard dest={dest} />}
            </div>

            {journey && totals && (
              <div
                className={`timeline__journey${journeySelected ? ' is-selected' : ''}`}
                ref={register(`journey:${journey.id}`)}
              >
                <button
                  type="button"
                  className="timeline__journey-button"
                  onClick={() => selectJourney(journey.id)}
                  aria-expanded={Boolean(journeySelected)}
                >
                  <span className="timeline__modes" aria-hidden="true">
                    {journey.legs.map((leg, i) => (
                      <span
                        key={leg.id}
                        className="timeline__mode"
                        style={{ color: MODE_STYLES[leg.mode].color }}
                      >
                        {i > 0 && <span className="timeline__mode-sep">›</span>}
                        {MODE_STYLES[leg.mode].icon}
                      </span>
                    ))}
                  </span>
                  <span className="timeline__journey-text">
                    <span className="timeline__journey-figures">
                      {formatMinutes(totals.minutes)} ·{' '}
                      {formatPartialAmount(totals.jpy, totals.unpriced, currency)}
                      <CertaintyBadge
                        certainty={totals.unpriced > 0 ? 'todo' : 'estimate'}
                        label={totals.unpriced > 0 ? 'tarif manquant' : 'est.'}
                      />
                    </span>
                    <span className="timeline__journey-legs">{describeLegs(journey)}</span>
                  </span>
                </button>
                {journeySelected && <JourneyCard journey={journey} />}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

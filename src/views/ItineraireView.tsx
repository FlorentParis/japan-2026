/**
 * VUE ITINÉRAIRE — le carnet, étape par étape, tout déplié.
 *
 * Chaque étape est suivie du déplacement qui mène à la suivante : il n'y a donc
 * aucun saut entre deux villes. C'est la version « à lire » de la frise.
 */
import { DestinationCard } from '../components/DestinationCard'
import { JourneyCard } from '../components/JourneyCard'
import { SectionTitle } from '../components/ui'
import { DESTINATIONS } from '../data/destinations'
import { JOURNEYS } from '../data/journeys'
import { journeyLabel, journeyTotals } from '../lib/derive'
import { STAY_LABEL, formatMinutes, formatPartialAmount } from '../lib/format'
import { MODE_STYLES } from '../lib/modes'
import { useTrip } from '../state/trip-state'

export function ItineraireView() {
  const { currency, goTo } = useTrip()

  return (
    <div className="view view--itineraire">
      <SectionTitle eyebrow="Étape par étape" title="Itinéraire complet">
        <p>
          {DESTINATIONS.length} étapes, {JOURNEYS.length} déplacements. Chaque déplacement est
          détaillé tronçon par tronçon : aucun trajet n’est résumé par un trait entre deux villes.
        </p>
      </SectionTitle>

      <ol className="itinerary">
        {DESTINATIONS.map((dest, index) => {
          const journey = JOURNEYS[index]
          const totals = journey ? journeyTotals(journey) : null

          return (
            <li key={dest.id} className="itinerary__item">
              <section className="itinerary__step">
                <header className="itinerary__step-head">
                  <span className="itinerary__order">{dest.order}</span>
                  <div>
                    <h3>
                      {dest.name}
                      {dest.nameJa && <span className="itinerary__ja" lang="ja"> {dest.nameJa}</span>}
                    </h3>
                    <p className="itinerary__region">
                      {dest.region} · {STAY_LABEL[dest.stay]}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => goTo('carte', { kind: 'destination', id: dest.id })}
                  >
                    Sur la carte
                  </button>
                </header>
                <DestinationCard dest={dest} />
              </section>

              {journey && totals && (
                <section className="itinerary__journey">
                  <header className="itinerary__journey-head">
                    <span className="itinerary__journey-modes" aria-hidden="true">
                      {[...new Set(journey.legs.map((l) => l.mode))]
                        .map((m) => MODE_STYLES[m].icon)
                        .join(' ')}
                    </span>
                    <h4>{journeyLabel(journey)}</h4>
                    <p>
                      {formatMinutes(totals.minutes)} ·{' '}
                      {formatPartialAmount(totals.jpy, totals.unpriced, currency)}
                      {totals.unpriced > 0
                        ? ` — ${totals.unpriced} tronçon(s) sans tarif relevé`
                        : ' estimés'}
                    </p>
                  </header>
                  <JourneyCard journey={journey} />
                </section>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

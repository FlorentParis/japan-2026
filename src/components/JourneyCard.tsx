/**
 * DÉTAIL D'UN TRAJET, tronçon par tronçon.
 *
 * Exigence de départ : aucun déplacement flou. Chaque tronçon indique son mode,
 * son service, son point de départ et d'arrivée, sa durée, son coût et sa
 * couverture par un pass. Les correspondances sont nommées, avec le temps de
 * battement. Un trajet Nagano → Kurashiki n'est donc jamais un simple trait.
 */
import { place } from '../data/places'
import { journeyTotals } from '../lib/derive'
import {
  PASS_COVERAGE_LABEL,
  PASS_COVERAGE_SHORT,
  formatDuration,
  formatKm,
  formatMinutes,
  formatMoney,
  formatPartialAmount,
} from '../lib/format'
import { legDistanceKm } from '../lib/geo'
import { MODE_STYLES } from '../lib/modes'
import { useTrip } from '../state/trip-state'
import type { Journey, Leg } from '../types'
import { CertaintyBadge, Warnings } from './ui'

function LegRow({ leg, journey }: { leg: Leg; journey: Journey }) {
  const { currency, selection, selectJourney } = useTrip()
  const style = MODE_STYLES[leg.mode]
  const active = selection?.kind === 'journey' && selection.legId === leg.id
  const connection = journey.connections?.find((c) => c.place === leg.toPlace)

  return (
    <li className={`leg${active ? ' is-active' : ''}`}>
      <button
        type="button"
        className="leg__main"
        onClick={() => selectJourney(journey.id, active ? undefined : leg.id)}
        aria-pressed={active}
      >
        <span className="leg__mode" style={{ color: style.color }} aria-hidden="true">
          {style.icon}
        </span>
        <span className="leg__body">
          <span className="leg__route">
            {place(leg.fromPlace).name} <span aria-hidden="true">→</span>{' '}
            {place(leg.toPlace).name}
          </span>
          <span className="leg__service">
            {leg.service ?? style.label}
            {leg.line && <span className="leg__line"> · {leg.line}</span>}
          </span>
          {leg.note && <span className="leg__note">{leg.note}</span>}
        </span>
        <span className="leg__figures">
          <span className="leg__duration">{formatDuration(leg.duration)}</span>
          <span className="leg__cost">
            {leg.cost ? formatMoney(leg.cost, currency) : <em>inclus</em>}
          </span>
          <span className={`leg__pass leg__pass--${leg.passCoverage}`} title={PASS_COVERAGE_LABEL[leg.passCoverage]}>
            {PASS_COVERAGE_SHORT[leg.passCoverage]}
          </span>
        </span>
      </button>

      {leg.cost?.note && <p className="leg__cost-note">{leg.cost.note}</p>}
      <p className="leg__meta">{formatKm(legDistanceKm(leg))} de tracé</p>

      {connection && (
        <p className="leg__connection">
          <span aria-hidden="true">⇄</span> Correspondance à {place(connection.place).name} —{' '}
          {connection.note}
        </p>
      )}
    </li>
  )
}

export function JourneyCard({ journey }: { journey: Journey }) {
  const { currency } = useTrip()
  const totals = journeyTotals(journey)

  return (
    <article className="journey-card">
      <div className="journey-card__totals">
        <div>
          <span className="journey-card__figure">
            {totals.minutesComplete ? formatMinutes(totals.minutes) : `≥ ${formatMinutes(totals.minutes)}`}
          </span>
          <span className="journey-card__caption">de transport</span>
        </div>
        <div>
          <span className="journey-card__figure">
            {formatPartialAmount(totals.jpy, totals.unpriced, currency)}
          </span>
          <span className="journey-card__caption">
            {totals.unpriced > 0 ? (
              <>
                par personne — {totals.unpriced} tronçon(s) sans tarif relevé{' '}
                <CertaintyBadge certainty="todo" />
              </>
            ) : (
              <>
                par personne <CertaintyBadge certainty="estimate" />
              </>
            )}
          </span>
        </div>
        <div>
          <span className="journey-card__figure">{formatKm(totals.km)}</span>
          <span className="journey-card__caption">
            {journey.geometryKind === 'great-circle' ? 'arc géodésique' : 'tracé schématique'}
          </span>
        </div>
      </div>

      <ol className="legs">
        {journey.legs.map((leg) => (
          <LegRow key={leg.id} leg={leg} journey={journey} />
        ))}
      </ol>

      <Warnings items={journey.warnings ?? []} />
    </article>
  )
}

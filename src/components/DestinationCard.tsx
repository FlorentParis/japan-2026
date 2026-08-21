/**
 * DÉTAIL D'UNE ÉTAPE.
 *
 * Les champs non fournis (dates, nuits, hôtel, activités) sont affichés comme
 * champs vides à compléter, avec le fichier à éditer. Rien n'est deviné : pas de
 * date plausible, pas d'hôtel « typique », pas de programme inventé.
 * Les `repères` sont des lieux publics servant à situer la ville sur la carte —
 * ils ne prétendent pas être un programme de visite.
 */
import type { ReactNode } from 'react'
import { journeysAround } from '../lib/derive'
import { STAY_LABEL, formatDateRange, formatMoney } from '../lib/format'
import { useTrip } from '../state/trip-state'
import type { Certainty, Destination } from '../types'
import { Hebergement } from './Hebergement'
import { PhotoCarrousel } from './PhotoCarrousel'
import { CertaintyBadge, ToFill, Warnings } from './ui'

function Field({
  label,
  children,
  certainty,
}: {
  label: string
  children: ReactNode
  certainty?: Certainty
}) {
  return (
    <div className="field">
      <dt className="field__label">
        {label}
        {certainty && <CertaintyBadge certainty={certainty} />}
      </dt>
      <dd className="field__value">{children}</dd>
    </div>
  )
}

export function DestinationCard({ dest }: { dest: Destination }) {
  const { currency, selectJourney, goTo } = useTrip()
  const { arrival, departure } = journeysAround(dest)
  const dates = formatDateRange(dest.dates.start, dest.dates.end)
  const hotel = dest.accommodation

  return (
    <article className="dest-card">
      {/* Toute la galerie de l'étape, et non plus une seule vue : une ville se
          laisse mal résumer par une photo. Un clic ouvre l'image en grand. */}
      <PhotoCarrousel
        destId={dest.id}
        name={dest.name}
        photoId={dest.photoId}
        ratio="16 / 9"
        className="dest-card__photo"
        sizes="(max-width: 700px) 92vw, 640px"
      />

      <p className="dest-card__blurb">{dest.blurb}</p>

      <dl className="fields">
        <Field label="Dates" certainty={dest.dates.certainty}>
          {dates ?? <ToFill />}
        </Field>

        <Field label="Nuits" certainty={dest.nights?.certainty ?? 'todo'}>
          {dest.nights ? `${dest.nights.count}` : <ToFill />}
          <span className="field__aside"> — {STAY_LABEL[dest.stay]}</span>
        </Field>

        <Field label="Hébergement" certainty={hotel.status}>
          {hotel.name ? (
            <>
              {hotel.bookingUrl ? (
                <a href={hotel.bookingUrl} target="_blank" rel="noreferrer noopener">
                  {hotel.name}
                </a>
              ) : (
                hotel.name
              )}
              {hotel.room && <span className="field__aside"> · {hotel.room}</span>}
              {hotel.price && (
                <span className="field__aside"> · {formatMoney(hotel.price, currency)}</span>
              )}
            </>
          ) : (
            <ToFill />
          )}
          {hotel.note && <p className="field__note">{hotel.note}</p>}
          {/* Adresse, lien Maps, horaires et photos de l'établissement — rien du
              tout tant que l'étape n'a pas d'hébergement réservé. */}
          <Hebergement hotel={hotel} ratio="4 / 3" sizes="(max-width: 700px) 92vw, 420px" />
        </Field>

        <Field label="Activités" certainty={dest.activitiesStatus}>
          {dest.activities.length > 0 ? (
            <ul className="chips">
              {dest.activities.map((a) => (
                <li key={a.id} className="chip">
                  {a.name}
                </li>
              ))}
            </ul>
          ) : (
            <ToFill>aucune activité renseignée</ToFill>
          )}
        </Field>
      </dl>

      {dest.spots && dest.spots.length > 0 && (
        <div className="dest-card__spots">
          <p className="dest-card__spots-title">Repères sur la carte</p>
          <ul className="chips">
            {dest.spots.map((spot) => (
              <li key={spot.name} className="chip chip--quiet">
                {spot.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Warnings items={dest.warnings ?? []} />

      <div className="dest-card__actions">
        <button type="button" className="link-button" onClick={() => goTo('carte', { kind: 'destination', id: dest.id })}>
          Situer sur la carte
        </button>
        {arrival && (
          <button
            type="button"
            className="link-button"
            onClick={() => selectJourney(arrival.id)}
          >
            Trajet d’arrivée
          </button>
        )}
        {departure && (
          <button
            type="button"
            className="link-button"
            onClick={() => selectJourney(departure.id)}
          >
            Trajet de départ
          </button>
        )}
      </div>
    </article>
  )
}

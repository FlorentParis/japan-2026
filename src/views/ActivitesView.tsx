/**
 * VUE ACTIVITÉS.
 *
 * Aucune activité n'a été fournie, et je n'en ai inventé aucune. Ce qui figure
 * ici sous « repères » sont des lieux publics vérifiables (monuments, jardins,
 * musées) servant à situer chaque ville sur la carte — ce n'est pas un programme
 * de visite, et c'est écrit noir sur blanc.
 */
import { SectionTitle, CertaintyBadge, PhotoFigure, ToFill } from '../components/ui'
import { DESTINATIONS } from '../data/destinations'
import { activityTotals } from '../lib/derive'
import { formatMoney } from '../lib/format'
import { useTrip } from '../state/trip-state'

const CATEGORY_ICON: Record<string, string> = {
  culture: '⛩️',
  nature: '🌿',
  food: '🍜',
  art: '🎨',
  onsen: '♨️',
  quartier: '🏘️',
  autre: '📍',
}

export function ActivitesView() {
  const { currency, goTo } = useTrip()
  const totals = activityTotals()

  return (
    <div className="view view--activites">
      <SectionTitle eyebrow="Sur place" title="Activités et visites">
        <p>
          {totals.count === 0 ? (
            <>
              Aucune activité n’a été fournie, et aucune n’a été inventée. Chaque étape attend son
              programme : ajoute-le dans <code>src/data/destinations.ts</code>, dans le tableau{' '}
              <code>activities</code> de l’étape.
            </>
          ) : (
            <>
              {totals.count} activités renseignées, dont {totals.withoutPrice} sans prix. Total des
              prix connus : {formatMoney({ jpy: totals.jpy, certainty: 'confirmed' }, currency)}.
            </>
          )}
        </p>
      </SectionTitle>

      <div className="activity-grid">
        {DESTINATIONS.map((dest) => (
          <article key={dest.id} className="activity-card">
            <PhotoFigure photoId={dest.photoId} alt={dest.name} ratio="3 / 2" />
            <div className="activity-card__body">
              <header className="activity-card__head">
                <h3>
                  <span className="activity-card__order">{dest.order}</span> {dest.name}
                </h3>
                <CertaintyBadge certainty={dest.activitiesStatus} />
              </header>

              <p className="activity-card__blurb">{dest.blurb}</p>

              {dest.activities.length > 0 ? (
                <ul className="activity-card__list">
                  {dest.activities.map((activity) => (
                    <li key={activity.id}>
                      <span className="activity-card__icon" aria-hidden="true">
                        {CATEGORY_ICON[activity.category] ?? '📍'}
                      </span>
                      <span>
                        <strong>{activity.name}</strong>
                        {activity.description && <span> — {activity.description}</span>}
                        {activity.price && (
                          <span className="activity-card__price">
                            {' '}
                            {formatMoney(activity.price, currency)}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="activity-card__empty">
                  <ToFill>programme à définir</ToFill>
                </p>
              )}

              {dest.spots && dest.spots.length > 0 && (
                <div className="activity-card__spots">
                  <p className="activity-card__spots-title">
                    Repères (lieux publics, pas un programme)
                  </p>
                  <ul className="chips">
                    {dest.spots.map((spot) => (
                      <li key={spot.name} className="chip chip--quiet">
                        <span aria-hidden="true">{CATEGORY_ICON[spot.kind ?? 'autre']}</span>{' '}
                        {spot.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                className="link-button"
                onClick={() => goTo('carte', { kind: 'destination', id: dest.id })}
              >
                Voir les repères sur la carte
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

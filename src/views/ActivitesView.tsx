/**
 * VUE ACTIVITÉS ET SPÉCIALITÉS.
 *
 * Distinction à ne pas perdre de vue : le voyageur n'a fourni ni activité, ni
 * spécialité. Il a demandé qu'on lui en propose. Ce qui s'affiche ici est donc
 * marqué `estimé` — des faits documentés sur des lieux publics, pas un programme
 * arrêté, pas une réservation, et volontairement sans prix : une grille tarifaire
 * récitée de mémoire serait une donnée inventée.
 *
 * Les « repères » restent ce qu'ils étaient : des points géographiques servant à
 * situer la ville sur la carte.
 */
import { CertaintyBadge, PhotoFigure, SectionTitle, ToFill } from '../components/ui'
import { DESTINATIONS } from '../data/destinations'
import { activityTotals, galleryCount, specialityTotals } from '../lib/derive'
import { formatMoney } from '../lib/format'
import { lotDeLaFiche } from '../lib/lots'
import { useTrip } from '../state/trip-state'
import type { SpecialityKind } from '../types'

const CATEGORY_ICON: Record<string, string> = {
  culture: '⛩️',
  nature: '🌿',
  food: '🍜',
  art: '🎨',
  onsen: '♨️',
  quartier: '🏘️',
  autre: '📍',
}

const SPECIALITY_ICON: Record<SpecialityKind, string> = {
  plat: '🍲',
  douceur: '🍡',
  boisson: '🍶',
  produit: '🐟',
  artisanat: '🎎',
}

export function ActivitesView() {
  const { currency, goTo } = useTrip()
  const totals = activityTotals()
  const specialites = specialityTotals()

  return (
    <div className="view view--activites">
      <SectionTitle eyebrow="Sur place" title="Activités et spécialités">
        <p>
          {totals.count === 0 ? (
            <>
              Aucune activité n’a été fournie, et aucune n’a été inventée. Chaque étape attend son
              programme : ajoute-le dans <code>src/data/destinations.ts</code>, dans le tableau{' '}
              <code>activities</code> de l’étape.
            </>
          ) : (
            <>
              {totals.count} activités et {specialites.count} spécialités locales, réparties sur{' '}
              {DESTINATIONS.length} étapes. <CertaintyBadge certainty="estimate" /> Ce sont des{' '}
              <strong>propositions</strong>, pas des choix déjà faits : tu n’en avais fourni aucune.
              Ce sont des lieux et des plats publics, documentés — mais rien n’est réservé, et rien
              n’est chiffré.
            </>
          )}
        </p>
        {totals.count > 0 && (
          <p className="section-head__note">
            Volontairement sans prix d’entrée : je n’ai pas relevé les grilles tarifaires, et un
            tarif de mémoire serait une donnée inventée. Le budget compte les activités par une
            enveloppe journalière, clairement estimée. Dis-moi les lieux que tu retiens et je vais
            chercher leurs tarifs réels.
            {totals.destinationsSansActivite > 0 &&
              ` ${totals.destinationsSansActivite} étape(s) restent sans proposition.`}
          </p>
        )}
        {specialites.count > 0 && (
          <p className="section-head__note">
            Les vignettes de plats illustrent la spécialité, pas une assiette servie à cette adresse :
            ce sont des photos libres de Wikimedia Commons, auteur et licence indiqués sur la même
            image dans la galerie de l’étape. Quand rien de convenable n’existe, l’entrée reste sans
            image — jamais avec la photo d’autre chose.
            {(totals.sansPhoto > 0 || specialites.sansPhoto > 0) &&
              ` C’est le cas de ${totals.sansPhoto + specialites.sansPhoto} entrée(s).`}
          </p>
        )}
      </SectionTitle>

      <div className="activity-grid">
        {DESTINATIONS.map((dest) => {
          // Toutes les photos de la fiche, dans l'ordre où elles y figurent : la
          // visionneuse les parcourt alors dans un ordre qui a un sens, et le
          // crédit d'une vignette de 3,5 rem — illisible ici — s'y affiche enfin.
          const lot = lotDeLaFiche(dest)
          return (
          <article key={dest.id} className="activity-card">
            <PhotoFigure
              photoId={dest.photoId}
              alt={dest.name}
              ratio="3 / 2"
              sizes="(max-width: 900px) 100vw, 420px"
              groupe={lot}
            />
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
                      <PhotoFigure
                        photoId={activity.id}
                        alt={activity.name}
                        ratio="1 / 1"
                        className="photo--thumb"
                        sizes="120px"
                        groupe={lot}
                      />
                      <span className="activity-card__text">
                        <strong>
                          <span className="activity-card__icon" aria-hidden="true">
                            {CATEGORY_ICON[activity.category] ?? '📍'}
                          </span>{' '}
                          {activity.name}
                        </strong>
                        {activity.description && <span> — {activity.description}</span>}
                        {activity.note && (
                          <span className="activity-card__note">{activity.note}</span>
                        )}
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

              {dest.specialities && dest.specialities.length > 0 && (
                <div className="specialities">
                  <p className="specialities__title">
                    Spécialités locales
                    {dest.specialitiesStatus && (
                      <CertaintyBadge certainty={dest.specialitiesStatus} />
                    )}
                  </p>
                  <ul className="specialities__list">
                    {dest.specialities.map((spec) => (
                      <li key={spec.id}>
                        <PhotoFigure
                          photoId={spec.id}
                          alt={spec.name}
                          ratio="1 / 1"
                          className="photo--thumb"
                          sizes="120px"
                          groupe={lot}
                        />
                        <span className="activity-card__text">
                          <strong>
                            <span aria-hidden="true">{SPECIALITY_ICON[spec.kind]}</span> {spec.name}
                          </strong>
                          {spec.nameJa && <span className="specialities__ja"> {spec.nameJa}</span>}
                          <span> — {spec.description}</span>
                          {spec.where && (
                            <span className="activity-card__note">Où : {spec.where}</span>
                          )}
                          {spec.note && <span className="activity-card__note">{spec.note}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
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

              <div className="activity-card__actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => goTo('carte', { kind: 'destination', id: dest.id })}
                >
                  Voir les repères sur la carte
                </button>
                {galleryCount(dest.id) > 0 && (
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => goTo('photos', { kind: 'destination', id: dest.id })}
                  >
                    {galleryCount(dest.id)} photos du lieu
                  </button>
                )}
              </div>
            </div>
          </article>
          )
        })}
      </div>
    </div>
  )
}

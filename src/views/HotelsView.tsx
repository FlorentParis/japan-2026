/**
 * VUE HÔTELS.
 *
 * Une ligne par étape où une nuit est possible. Les étapes réservées portent tout
 * ce que la réservation dit — adresse, lien Maps, horaires, photos de
 * l'établissement ; les autres restent des champs à remplir, avec le fichier à
 * éditer. C'est volontaire : un hôtel inventé serait pire qu'une case vide.
 *
 * Les quatre compteurs du bandeau viennent de `accommodationTotals()` : ils
 * suivent les réservations d'eux-mêmes, aucun chiffre n'est écrit ici.
 */
import { Hebergement } from '../components/Hebergement'
import { SectionTitle, CertaintyBadge, ToFill } from '../components/ui'
import { DESTINATIONS } from '../data/destinations'
import { accommodationTotals } from '../lib/derive'
import { STAY_LABEL, formatDateRange, formatMoney } from '../lib/format'
import { useTrip } from '../state/trip-state'

export function HotelsView() {
  const { currency, goTo } = useTrip()
  const totals = accommodationTotals()
  const candidates = DESTINATIONS.filter((d) => d.stay !== 'day')

  return (
    <div className="view view--hotels">
      <SectionTitle eyebrow="Hébergement" title="Où dormir">
        <p>
          {candidates.length} étapes peuvent demander une nuit ({DESTINATIONS.length - candidates.length}{' '}
          se font dans la journée). Tant qu’une étape n’est pas tranchée entre « nuit sur place » et
          « visite dans la journée », elle apparaît ici.
        </p>
      </SectionTitle>

      <div className="totals-bar">
        <div>
          <span className="totals-bar__value">
            {totals.jpy > 0 ? formatMoney({ jpy: totals.jpy, certainty: 'confirmed' }, currency) : <ToFill />}
          </span>
          <span className="totals-bar__label">Total hébergement</span>
        </div>
        <div>
          <span className="totals-bar__value">{totals.nights > 0 ? totals.nights : <ToFill />}</span>
          <span className="totals-bar__label">Nuits renseignées</span>
        </div>
        <div>
          <span className="totals-bar__value">
            {totals.perNight ? formatMoney({ jpy: totals.perNight, certainty: 'confirmed' }, currency) : <ToFill />}
          </span>
          <span className="totals-bar__label">Moyenne par nuit</span>
        </div>
        <div>
          <span className="totals-bar__value">{totals.missing}</span>
          <span className="totals-bar__label">Étapes à renseigner</span>
        </div>
      </div>

      <ul className="hotel-list">
        {candidates.map((dest) => {
          const hotel = dest.accommodation
          const dates = formatDateRange(dest.dates.start, dest.dates.end)
          return (
            <li key={dest.id} className={`hotel-row hotel-row--${hotel.status}`}>
              <div className="hotel-row__place">
                <span className="hotel-row__order">{dest.order}</span>
                <div>
                  <p className="hotel-row__city">{dest.name}</p>
                  <p className="hotel-row__region">{dest.region}</p>
                </div>
              </div>

              <div className="hotel-row__dates">
                {dates ?? <ToFill>dates</ToFill>}
                <span className="hotel-row__stay">{STAY_LABEL[dest.stay]}</span>
              </div>

              <div className="hotel-row__hotel">
                {hotel.name ? (
                  <>
                    <p className="hotel-row__name">{hotel.name}</p>
                    {hotel.area && <p className="hotel-row__area">{hotel.area}</p>}
                    {hotel.room && <p className="hotel-row__area">{hotel.room}</p>}
                  </>
                ) : (
                  <ToFill>hôtel, ryokan ou minshuku</ToFill>
                )}
                {hotel.note && <p className="hotel-row__note">{hotel.note}</p>}
              </div>

              <div className="hotel-row__price">
                {hotel.price ? formatMoney(hotel.price, currency) : <ToFill>prix</ToFill>}
                <CertaintyBadge certainty={hotel.status} />
              </div>

              <button
                type="button"
                className="link-button"
                onClick={() => goTo('itineraire', { kind: 'destination', id: dest.id })}
              >
                Détail
              </button>

              {/* Sous la ligne, sur toute sa largeur : les colonnes sont trop
                  étroites pour une adresse et un carrousel. Rien ne s'affiche
                  tant que l'étape n'est pas réservée. */}
              <Hebergement
                hotel={hotel}
                className="hotel-row__detail"
                ratio="16 / 10"
                // Largeur réelle d'une vignette de frise, pas celle du bloc :
                // annoncer 34 rem ferait télécharger treize images de pleine page.
                sizes="(max-width: 860px) 40vw, 12rem"
              />
            </li>
          )
        })}
      </ul>

      <p className="view__foot">
        Pour renseigner une nuit : ouvrir <code>src/data/destinations.ts</code>, trouver l’étape et
        compléter son objet <code>accommodation</code> — <code>name</code>, <code>area</code>,{' '}
        <code>price</code>, <code>nights</code>, <code>bookingUrl</code>, et pour une réservation
        faite <code>address</code>, <code>coord</code> (lien Maps et repère sur la carte),{' '}
        <code>checkIn</code>, <code>checkOut</code>. Les photos de l’établissement s’ajoutent à part,
        dans <code>src/data/hebergements.ts</code>, et se rattachent par <code>photosId</code>. Le
        total, la moyenne par nuit et le budget se recalculent seuls.
      </p>
    </div>
  )
}

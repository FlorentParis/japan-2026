/**
 * VUE D'ENSEMBLE — la page d'accueil du voyage.
 *
 * Tous les chiffres viennent de `lib/derive.ts`, aucun n'est écrit à la main.
 * Ce qui n'est pas connu est affiché comme tel : la durée du séjour reste vide
 * tant que les dates ne sont pas saisies, plutôt que d'afficher un nombre faux.
 */
import { DESTINATIONS } from '../data/destinations'
import { TRIP } from '../data/trip'
import { allWarnings, gaps, overview, tripDays } from '../lib/derive'
import { formatKm, formatMinutes, formatMoney, formatPeriod } from '../lib/format'
import { checkIntegrity } from '../lib/validate'
import { useTrip } from '../state/trip-state'
import { CertaintyBadge, PhotoFigure, SectionTitle, Stat, ToFill } from '../components/ui'

export function ApercuView() {
  const { currency, goTo } = useTrip()
  const stats = overview()
  const days = tripDays()
  const periode = formatPeriod(TRIP.period.start, TRIP.period.end)
  /** Étapes visitées dans la journée : elles expliquent l'écart jours / nuits. */
  const etapesSansNuit = DESTINATIONS.filter((d) => d.stay === 'day').map((d) => d.name)
  const missing = gaps()
  const warnings = allWarnings()
  /** Le vol qui porte le prix de l'aller-retour : le seul montant payé du voyage. */
  const volAller = TRIP.flights.find((f) => f.price !== undefined)
  const issues = checkIntegrity()
  const blocking = missing.filter((g) => g.severity === 'blocking')

  return (
    <div className="view view--apercu">
      <section className="hero">
        <PhotoFigure photoId={TRIP.heroPhotoId} alt="Kamikōchi, Alpes du Nord" eager className="hero__photo" />
        <div className="hero__text">
          <p className="hero__eyebrow">Carnet de route · Japon</p>
          <h1 className="hero__title">{TRIP.title}</h1>
          <p className="hero__subtitle">{TRIP.subtitle}</p>
          {periode && (
            <p className="hero__dates">
              <strong>{periode}</strong>
              <span>
                {days} jours · {stats.nights} nuits
              </span>
            </p>
          )}
          <p className="hero__route">
            {DESTINATIONS.map((d) => d.name).join(' · ')}
          </p>
          <div className="hero__actions">
            <button type="button" className="button" onClick={() => goTo('carte')}>
              Ouvrir la carte
            </button>
            <button type="button" className="button button--ghost" onClick={() => goTo('itineraire')}>
              Voir l’itinéraire
            </button>
          </div>
        </div>
      </section>

      {issues.length > 0 && (
        <section className="panel panel--alert">
          <h2 className="panel__title">Incohérences détectées dans les données</h2>
          <ul className="issues">
            {issues.map((issue) => (
              <li key={issue.where + issue.message}>
                <strong>{issue.where}</strong> — {issue.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="stats">
        <SectionTitle eyebrow="En un coup d’œil" title="Le voyage en chiffres" />
        <div className="stats__grid">
          <Stat
            value={days ? `${days} jours` : <ToFill />}
            label="Durée du séjour"
            hint={days ? 'Déduite des dates saisies' : 'Aucune date fournie : à renseigner'}
            muted={!days}
          />
          <Stat
            value={stats.nightsKnown ? `${stats.nights} nuits` : <ToFill />}
            label="Nuits sur place"
            hint={
              stats.nightsKnown
                ? `Somme des nuits de chaque étape — ${etapesSansNuit.length} visites sans nuit (${etapesSansNuit.join(', ')})`
                : 'Nombre de nuits par étape à renseigner'
            }
            muted={!stats.nightsKnown}
          />
          <Stat value={stats.uniquePlaces} label="Destinations" hint={`${stats.destinations} étapes, Tokyo au départ et à l’arrivée`} />
          <Stat value={formatKm(stats.km)} label="Distance des tracés" hint="Somme des tronçons dessinés sur la carte" />
          <Stat value={formatMinutes(stats.travelMinutes)} label="Temps en transport" hint="Hors correspondances et trajets urbains" />
          <Stat value={stats.trainLegs} label="Trajets en train" hint={`dont ${stats.shinkansenLegs} en Shinkansen`} />
          <Stat value={stats.ferryLegs} label="Traversées en ferry" hint="Mer intérieure de Seto" />
          <Stat value={stats.flightLegs} label="Vol intérieur" hint="Nagasaki → Tokyo" />
          <Stat value={stats.busLegs} label="Trajets en bus" hint="Alpes, Shirakawa-gō, route alpine" />
          <Stat
            value={stats.bookedStays > 0 ? stats.bookedStays : <ToFill />}
            label="Hébergements réservés"
            hint={`${stats.staysToBook} à trouver`}
            muted={stats.bookedStays === 0}
          />
          <Stat
            value={formatMoney(volAller?.price, currency)}
            label="Billets d’avion"
            hint={
              volAller?.price
                ? 'Aller-retour Europe ⇄ Tokyo, payé — le seul montant confirmé du voyage'
                : 'Prix non fourni'
            }
            muted={!volAller?.price}
          />
          <Stat
            value={formatMoney({ jpy: stats.transportJpy, certainty: 'estimate' }, currency)}
            label="Transports, par personne"
            hint={
              stats.unpricedLegs > 0
                ? `Total incomplet : ${stats.unpricedLegs} tronçon(s) sans tarif relevé. Hors pass et hors transports urbains.`
                : 'Estimation, hors pass et hors transports urbains'
            }
          />
        </div>
        <p className="stats__foot">
          <CertaintyBadge certainty="estimate" /> Les montants et durées de transport sont des
          estimations relevées sur les grilles tarifaires publiques.{' '}
          {/* Phrase déduite du nombre d'hébergements réservés, et non écrite en dur :
              elle restera vraie à la prochaine réservation. */}
          {stats.bookedStays === 0
            ? 'Hors billets d’avion, rien n’est réservé : ni hébergement, ni train, ni activité.'
            : `Hors billets d’avion, ${
                stats.bookedStays === 1
                  ? 'un seul hébergement est réservé'
                  : `${stats.bookedStays} hébergements sont réservés`
              } : il reste ${stats.staysToBook} étapes à trouver, et aucun train ni aucune activité n’est réservé.`}{' '}
          <button type="button" className="link-button" onClick={() => goTo('budget')}>
            Détail du budget
          </button>
        </p>
      </section>

      <div className="two-columns">
        <section className="panel panel--todo">
          <h2 className="panel__title">
            À compléter <span className="panel__count">{missing.length}</span>
          </h2>
          <p className="panel__intro">
            Ce qui n’a pas été fourni n’a pas été inventé. Chaque ligne indique le fichier à
            éditer : une seule saisie met à jour tout le site.
          </p>
          <ul className="todo-list">
            {missing.map((gap) => (
              <li key={gap.id} className={`todo-list__item todo-list__item--${gap.severity}`}>
                <span className="todo-list__scope">{gap.scope}</span>
                <span className="todo-list__label">{gap.label}</span>
                <code className="todo-list__file">{gap.file}</code>
              </li>
            ))}
          </ul>
          {blocking.length > 0 && (
            <p className="panel__foot">
              {blocking.length} de ces éléments bloquent des calculs (durée du séjour, budget par
              jour, rentabilité du pass).
            </p>
          )}
        </section>

        <section className="panel panel--warn">
          <h2 className="panel__title">
            Points de vigilance <span className="panel__count">{warnings.length}</span>
          </h2>
          <p className="panel__intro">
            Signalés, pas corrigés : ces éléments touchent à l’itinéraire lui-même et c’est à toi
            de trancher.
          </p>
          <ul className="warn-list">
            {warnings.map((w) => (
              <li key={w.scope + w.text}>
                <span className="warn-list__scope">{w.scope}</span>
                <span>{w.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

/**
 * VUE AUJOURD'HUI — le voyage réduit à la seule journée en cours.
 *
 * Les autres vues répondent à « comment est fait ce voyage ». Celle-ci répond à
 * « qu'est-ce que je fais maintenant », qui est la seule question qui se pose une
 * fois sur place : où je dors ce soir, quel train je prends, ce qui est fermé.
 * Tout le reste est écarté volontairement.
 *
 * Trois états, selon la date : avant le départ un compte à rebours et ce qui
 * reste à préparer ; pendant le séjour le programme du jour ; après, le voyage au
 * passé. Aucun d'eux n'invente quoi que ce soit — les journées sans hébergement
 * réservé le disent, comme partout ailleurs sur le site.
 *
 * La date se règle à la main (« jour simulé ») : sans cela, la vue serait
 * invérifiable jusqu'au 6 novembre et tout aussi invérifiable après le 5
 * décembre. Le bandeau dit alors franchement que la date affichée n'est pas
 * celle du jour.
 */
import { useState } from 'react'
import { ExpeditionCard } from '../components/Bagages'
import { Hebergement } from '../components/Hebergement'
import { JourneyCard } from '../components/JourneyCard'
import { CertaintyBadge, PhotoFigure, ToFill, Warnings } from '../components/ui'
import { place } from '../data/places'
import { TRIP } from '../data/trip'
import { alertesDuJour, departDeLaMaison, journeeDu, type Journee } from '../lib/aujourdhui'
import { bagagesDuJour, etape, jourAvecBagage } from '../lib/bagages'
import { gaps, journeyLabel, journeyTotals } from '../lib/derive'
import {
  ACTIVITY_ICON,
  STAY_LABEL,
  addDays,
  formatDateRange,
  formatJourSemaine,
  formatLongDate,
  formatMinutes,
  formatMoney,
  formatTime,
} from '../lib/format'
import { lotDeLaFiche } from '../lib/lots'
import { MODE_STYLES } from '../lib/modes'
import { useDateDuJour } from '../lib/useDateDuJour'
import { itineraire } from '../lib/vols'
import { useTrip } from '../state/trip-state'
import type { Destination, Flight, Transfer } from '../types'

/** « 3 jours », « 1 jour » — le pluriel d'un compte à rebours, sans « (s) ». */
function jours(n: number): string {
  return n === 1 ? '1 jour' : `${n} jours`
}

/**
 * Une journée résumée en une phrase, pour le bloc « demain ».
 *
 * Ni le programme ni les alertes : juste de quoi savoir s'il faut se lever tôt.
 */
function resume(journee: Journee): string {
  if (journee.phase === 'apres') return 'Le voyage est terminé.'
  if (journee.trajets.length > 0) {
    const trajets = journee.trajets.map((j) => journeyLabel(j)).join(', puis ')
    const minutes = journee.trajets.reduce((s, j) => s + journeyTotals(j).minutes, 0)
    return `Départ : ${trajets} — ${formatMinutes(minutes)} de transport.`
  }
  if (journee.nuit) return `Journée sur place à ${journee.nuit.name}, sans déplacement d’étape.`
  return 'Rien de prévu dans les données.'
}

/**
 * Un vol, tronçon par tronçon.
 *
 * Un aller-retour avec escale, c'est quatre avions : les résumer en « Paris →
 * Tokyo » ferait disparaître deux décollages, deux numéros de vol et le
 * battement de l'escale — précisément ce qu'on veut savoir le jour même.
 */
function Vol({ vol, date }: { vol: Flight; date?: string }) {
  const itin = itineraire(vol)
  return (
    <li className="today-move">
      <span className="today-move__icon" aria-hidden="true">
        {MODE_STYLES.plane.icon}
      </span>
      <span className="today-move__body">
        <strong>{vol.label}</strong>
        <span className="today-move__route">
          {itin.from ?? <ToFill>aéroport de départ</ToFill>} <span aria-hidden="true">→</span>{' '}
          {itin.to ?? <ToFill>aéroport d’arrivée</ToFill>}
        </span>

        {itin.segments.length > 0 ? (
          <span className="today-move__segments">
            {itin.segments.map((segment, index) => (
              <span key={segment.number} className="today-move__segment">
                <strong>
                  {segment.airline} {segment.number}
                </strong>{' '}
                {segment.from} <span aria-hidden="true">→</span> {segment.to}
                {formatTime(segment.departureTime) && ` · ${formatTime(segment.departureTime)}`}
                {/* Sans atterrissage, « · 12 h 25 » seul se lirait comme un
                    horaire complet : le trou est montré plutôt que masqué. */}
                {formatTime(segment.departureTime) &&
                  (formatTime(segment.arrivalTime) ? (
                    ` → ${formatTime(segment.arrivalTime)}`
                  ) : (
                    <>
                      {' '}
                      → <ToFill>atterrissage</ToFill>
                    </>
                  ))}
                {/* Le jour est rappelé dès qu'un tronçon ne se passe pas
                    entièrement dans la journée affichée : sans ça, l'horaire
                    d'un vol de nuit se lit comme s'il était pour aujourd'hui. */}
                {segment.arrivalDate && segment.arrivalDate !== segment.date && (
                  <> le lendemain</>
                )}
                {date && segment.date && segment.date !== date && (
                  <> (le {formatDateRange(segment.date)})</>
                )}
                {itin.escales[index]?.minutes !== undefined && (
                  <span className="today-move__escale">
                    escale de {formatMinutes(itin.escales[index].minutes as number)} à{' '}
                    {itin.escales[index].place}
                  </span>
                )}
              </span>
            ))}
          </span>
        ) : (
          <span className="today-move__figures">
            {formatTime(itin.departureTime) && <>Décollage {formatTime(itin.departureTime)}. </>}
            {formatTime(itin.arrivalTime) && <>Atterrissage {formatTime(itin.arrivalTime)}. </>}
            <>
              Compagnie et numéro <ToFill />
            </>
          </span>
        )}

        {vol.note && <span className="today-move__note">{vol.note}</span>}
      </span>
      <CertaintyBadge certainty={vol.certainty} />
    </li>
  )
}

/**
 * Un transfert d'aéroport. Ce n'est pas un `Journey` — il ne relie pas deux
 * étapes — donc pas de `JourneyCard` : ses tronçons sont listés ici tels quels.
 */
function Transfert({ transfert }: { transfert: Transfer }) {
  const { currency } = useTrip()
  return (
    <li className="today-move">
      <span className="today-move__icon" aria-hidden="true">
        🚉
      </span>
      <span className="today-move__body">
        <strong>{transfert.label}</strong>
        {transfert.legs.map((leg) => (
          <span key={leg.id} className="today-move__figures">
            {place(leg.fromPlace).name} <span aria-hidden="true">→</span>{' '}
            {place(leg.toPlace).name} · {leg.service ?? MODE_STYLES[leg.mode].label}
            {leg.duration && ` · ${formatMinutes(leg.duration.minutes)}`}
            {leg.cost && ` · ${formatMoney(leg.cost, currency)}`}
          </span>
        ))}
      </span>
      <CertaintyBadge certainty="estimate" />
    </li>
  )
}

/**
 * Où l'on dort, avec tout ce que la réservation apporte — ou le trou, dit
 * franchement.
 *
 * `quand` existe parce que ce bloc sert aussi à l'écran d'avant-départ, qui montre
 * la première nuit du séjour : « cette nuit » y serait faux, on n'a pas encore
 * décollé.
 */
function Nuit({ dest, quand = 'Cette nuit' }: { dest: Destination; quand?: string }) {
  const { currency, goTo } = useTrip()
  const hotel = dest.accommodation

  return (
    <section className="panel today-panel">
      <h2 className="panel__title">
        {quand} à {dest.name} <CertaintyBadge certainty={hotel.status} />
      </h2>
      {hotel.name ? (
        <>
          <p className="today-hotel__name">
            {hotel.bookingUrl ? (
              <a href={hotel.bookingUrl} target="_blank" rel="noreferrer noopener">
                {hotel.name}
              </a>
            ) : (
              hotel.name
            )}
            {hotel.room && <span className="today-hotel__aside"> · {hotel.room}</span>}
            {hotel.price && (
              <span className="today-hotel__aside"> · {formatMoney(hotel.price, currency)}</span>
            )}
          </p>
          {hotel.note && <p className="today-hotel__note">{hotel.note}</p>}
        </>
      ) : (
        <p className="panel__intro">
          <ToFill>hébergement non réservé</ToFill> — à renseigner dans{' '}
          <code>src/data/destinations.ts</code>, champ <code>accommodation</code> de l’étape.
        </p>
      )}

      {/* Adresse, lien Maps, heures d'arrivée et de départ, photos de
          l'établissement : le bloc rend `null` s'il n'a rien à dire. */}
      <Hebergement hotel={hotel} ratio="16 / 10" sizes="(max-width: 700px) 45vw, 14rem" />

      <div className="today-panel__actions">
        <button
          type="button"
          className="link-button"
          onClick={() => goTo('carte', { kind: 'destination', id: dest.id })}
        >
          Situer sur la carte
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => goTo('itineraire', { kind: 'destination', id: dest.id })}
        >
          Fiche complète de l’étape
        </button>
      </div>
    </section>
  )
}

/**
 * La valise, ce jour-là.
 *
 * C'est le seul poste du carnet qui demande une action irréversible à une heure
 * précise : une valise remise trop tard rate le ramassage du jour, et arrive alors
 * un jour après vous. Le bloc est donc placé avant l'hébergement, et il rend
 * `null` les vingt-cinq jours où il n'y a rien à en faire.
 */
function Bagage({ date }: { date: string }) {
  const jour = bagagesDuJour(date)
  if (!jourAvecBagage(jour)) return null

  /* Le jour du départ, l'envoi figure dans les deux listes : on ne le compte pas
     deux fois — « à remettre » dit déjà tout, et dit ce qu'il y a à faire. */
  const enRoute = jour.enRoute.filter((e) => !jour.aRemettre.includes(e))

  return (
    <section className="panel today-panel today-panel--bagage">
      <h2 className="panel__title">
        <span aria-hidden="true">🧳</span> La valise aujourd’hui
      </h2>

      {jour.aRemettre.length > 0 && (
        <>
          <p className="panel__intro">
            <strong>À remettre à la réception aujourd’hui.</strong> Un hôtel n’a qu’un ramassage par
            jour, souvent avant midi : le faire en descendant, pas en repartant.
          </p>
          {jour.aRemettre.map((expedition) => (
            <ExpeditionCard key={expedition.id} expedition={expedition} />
          ))}
        </>
      )}

      {jour.aRecevoir.map((expedition) => (
        <p key={expedition.id} className="panel__intro">
          <strong>La valise est livrée aujourd’hui</strong> à{' '}
          {etape(expedition.toDestination)?.accommodation.name ??
            `l’hôtel de ${etape(expedition.toDestination)?.name}`}
          . Vérifier à l’arrivée qu’elle est bien là avant de ressortir.
        </p>
      ))}

      {enRoute.map((expedition) => (
        <p key={expedition.id} className="panel__intro">
          <strong>Journée sans valise.</strong> Elle est en route vers{' '}
          {etape(expedition.toDestination)?.name}, livraison demandée pour le{' '}
          {formatJourSemaine(expedition.deliveredOn)}.
        </p>
      ))}
    </section>
  )
}

/** Les propositions d'activités d'une étape — des suggestions, et ça se voit. */
function Programme({ dest }: { dest: Destination }) {
  const lot = lotDeLaFiche(dest)

  return (
    <section className="panel today-panel">
      <h2 className="panel__title">
        À {dest.name} <CertaintyBadge certainty={dest.activitiesStatus} />
      </h2>
      <p className="panel__intro">
        {dest.region} · {STAY_LABEL[dest.stay]}
        {dest.dates.start && ` · ${formatDateRange(dest.dates.start, dest.dates.end)}`}
      </p>

      {dest.activities.length > 0 ? (
        <ul className="today-programme">
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
              <span className="today-programme__text">
                <strong>
                  <span aria-hidden="true">{ACTIVITY_ICON[activity.category]}</span>{' '}
                  {activity.name}
                </strong>
                {activity.description && <span> — {activity.description}</span>}
                {activity.note && (
                  <span className="today-programme__note">{activity.note}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel__intro">
          <ToFill>aucune activité renseignée</ToFill>
        </p>
      )}
    </section>
  )
}

export function AujourdhuiView({ date: dateImposee }: { date?: string }) {
  const { goTo } = useTrip()
  const reel = useDateDuJour()
  /** Date choisie à la main. `null` = on suit l'horloge. */
  const [choisie, setChoisie] = useState<string | null>(null)
  const date = choisie ?? dateImposee ?? reel
  const simule = date !== reel

  const journee = journeeDu(date)
  const demain = journeeDu(addDays(date, 1))
  const alertes = alertesDuJour(journee)
  const aPreparer = gaps().filter((g) => g.severity === 'blocking')
  /** Le premier jour du séjour au Japon, pour l'écran d'avant-départ. */
  const premierJour = TRIP.period.start ? journeeDu(TRIP.period.start) : undefined
  /** Le jour du décollage — la veille de l'arrivée, l'aller étant un vol de nuit. */
  const depart = departDeLaMaison()
  const jourDuDepart = depart ? journeeDu(depart) : undefined
  /**
   * Les vols de ces deux journées, sans doublon : l'aller touche les deux dates,
   * et il ne doit apparaître qu'une fois dans la liste.
   */
  const volsDuDepart = [
    ...(jourDuDepart?.vols ?? []),
    ...(premierJour?.vols ?? []).filter((vol) => !jourDuDepart?.vols.includes(vol)),
  ]

  return (
    <div className="view view--aujourdhui">
      <header className="today-head">
        <p className="today-head__eyebrow">
          {journee.phase === 'pendant' && journee.jour
            ? `Jour ${journee.jour} sur ${journee.total}`
            : journee.phase === 'avant'
              ? 'Avant le départ'
              : journee.phase === 'apres'
                ? 'Après le voyage'
                : 'Dates du voyage non renseignées'}
        </p>
        <h1 className="today-head__date">{formatLongDate(date)}</h1>

        {journee.phase === 'avant' && journee.joursAvant !== undefined && (
          <p className="today-head__compte">
            {journee.joursAvant === 0 ? (
              <strong>C’est aujourd’hui qu’on part.</strong>
            ) : (
              <>
                <strong>J−{journee.joursAvant}</strong>
                <span>
                  {jours(journee.joursAvant)} avant le départ, {journee.total} jours de voyage
                </span>
              </>
            )}
          </p>
        )}
        {journee.phase === 'apres' && journee.joursApres !== undefined && (
          <p className="today-head__compte">
            <strong>Rentré</strong>
            <span>
              {journee.joursApres === 0
                ? 'le voyage s’est achevé hier'
                : `il y a ${jours(journee.joursApres)}`}
            </span>
          </p>
        )}
        {journee.phase === 'pendant' && (
          <p className="today-head__compte">
            <strong>
              {journee.etapes.map((d) => d.name).join(' → ') || 'Étape non renseignée'}
            </strong>
            <span>
              {journee.trajets.length > 0
                ? `${journee.trajets.length} déplacement(s) aujourd’hui`
                : // Le dernier jour n'a aucun trajet d'étape à étape, mais un vol
                  // et un transfert : l'appeler « journée sur place » serait faux.
                  journee.vols.length > 0 || journee.transferts.length > 0
                  ? 'jour d’avion'
                  : 'journée sur place'}
            </span>
          </p>
        )}

        {/* Réglage de la date. Le bouton du milieu ne s'affiche que s'il a
            quelque chose à annuler — sinon il proposerait de revenir là où
            l'on est déjà. */}
        <nav className="today-nav" aria-label="Changer le jour affiché">
          <button type="button" className="button button--ghost" onClick={() => setChoisie(addDays(date, -1))}>
            <span aria-hidden="true">←</span> Veille
          </button>
          {simule && (
            <button type="button" className="button" onClick={() => setChoisie(null)}>
              Revenir à aujourd’hui
            </button>
          )}
          <button type="button" className="button button--ghost" onClick={() => setChoisie(addDays(date, 1))}>
            Lendemain <span aria-hidden="true">→</span>
          </button>
        </nav>

        {simule && (
          <p className="today-head__simule">
            <CertaintyBadge certainty="estimate" label="jour simulé" /> La date affichée n’est pas
            celle du jour ({formatLongDate(reel)}) : c’est une projection sur le calendrier du
            voyage, pas un état réel.
          </p>
        )}
      </header>

      {journee.phase === 'sans-dates' && (
        <section className="panel panel--alert">
          <h2 className="panel__title">Aucune date de voyage</h2>
          <p className="panel__intro">
            Sans période renseignée dans <code>src/data/trip.ts</code>, cette vue n’a aucun jour à
            situer. Les autres sections du site restent utilisables.
          </p>
        </section>
      )}

      {journee.phase === 'avant' && premierJour && (
        <>
          <section className="panel today-panel">
            <h2 className="panel__title">Le départ et l’arrivée</h2>
            <p className="panel__intro">
              {jourDuDepart && jourDuDepart.date !== premierJour.date ? (
                <>
                  Décollage le {formatLongDate(jourDuDepart.date)}, atterrissage le{' '}
                  {formatLongDate(premierJour.date)} : l’aller est un vol de nuit, il enjambe deux
                  journées. Le séjour au Japon, lui, est compté à partir de l’arrivée.
                </>
              ) : (
                <>{formatLongDate(premierJour.date)} — tout ce que les données donnent du premier jour.</>
              )}
            </p>
            <ul className="today-moves">
              {volsDuDepart.map((vol) => (
                <Vol key={vol.label} vol={vol} />
              ))}
              {premierJour.transferts.map((transfert) => (
                <Transfert key={transfert.id} transfert={transfert} />
              ))}
            </ul>
            <div className="today-panel__actions">
              <button type="button" className="link-button" onClick={() => goTo('itineraire')}>
                Itinéraire complet
              </button>
              <button type="button" className="link-button" onClick={() => goTo('transports')}>
                Vols et transferts
              </button>
            </div>
          </section>

          {premierJour.nuit && <Nuit dest={premierJour.nuit} quand="La première nuit" />}

          <section className="panel panel--todo">
            <h2 className="panel__title">
              À boucler avant de partir <span className="panel__count">{aPreparer.length}</span>
            </h2>
            <p className="panel__intro">
              Seulement ce qui bloque un calcul ou une réservation. La liste complète est dans
              l’aperçu.
            </p>
            <ul className="todo-list">
              {aPreparer.map((gap) => (
                <li key={gap.id} className={`todo-list__item todo-list__item--${gap.severity}`}>
                  <span className="todo-list__scope">{gap.scope}</span>
                  <span className="todo-list__label">{gap.label}</span>
                  <code className="todo-list__file">{gap.file}</code>
                </li>
              ))}
            </ul>
            <p className="panel__foot">
              <button type="button" className="link-button" onClick={() => goTo('apercu')}>
                Tout ce qui reste à compléter
              </button>
            </p>
          </section>
        </>
      )}

      {journee.phase === 'pendant' && (
        <>
          {(journee.vols.length > 0 || journee.transferts.length > 0) && (
            <section className="panel today-panel">
              <h2 className="panel__title">Avion et aéroport</h2>
              <ul className="today-moves">
                {journee.vols.map((vol) => (
                  <Vol key={vol.label} vol={vol} date={date} />
                ))}
                {journee.transferts.map((transfert) => (
                  <Transfert key={transfert.id} transfert={transfert} />
                ))}
              </ul>
            </section>
          )}

          {journee.trajets.length > 0 ? (
            journee.trajets.map((trajet) => (
              <section key={trajet.id} className="panel today-panel">
                <h2 className="panel__title">
                  <span aria-hidden="true">
                    {[...new Set(trajet.legs.map((l) => l.mode))]
                      .map((m) => MODE_STYLES[m].icon)
                      .join(' ')}
                  </span>{' '}
                  {journeyLabel(trajet)}
                </h2>
                <JourneyCard journey={trajet} />
                <div className="today-panel__actions">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => goTo('carte', { kind: 'journey', id: trajet.id })}
                  >
                    Suivre le tracé sur la carte
                  </button>
                </div>
              </section>
            ))
          ) : (
            /* Rien à dire les jours d'avion : le bloc ci-dessus a déjà montré le
               vol et le transfert, et annoncer « aucun déplacement » juste après
               se contredirait. */
            journee.vols.length === 0 &&
            journee.transferts.length === 0 && (
              <section className="panel today-panel">
                <h2 className="panel__title">Aucun déplacement d’étape aujourd’hui</h2>
                <p className="panel__intro">
                  Journée entière sur place. Les trajets urbains ne sont pas dans les données : ils
                  sont comptés au budget par une enveloppe journalière, sans détail.
                </p>
              </section>
            )
          )}

          {/* Avant l'hébergement : c'est à la réception qu'on remet la valise, et
              le ramassage passe avant midi. Le lire après « cette nuit » serait le
              lire trop tard. */}
          <Bagage date={date} />

          {journee.nuit ? (
            <Nuit dest={journee.nuit} />
          ) : (
            <section className="panel today-panel">
              <h2 className="panel__title">Dernière journée</h2>
              <p className="panel__intro">
                Plus de nuit au Japon après celle-ci : le vol international repart ce jour. Voir
                l’avertissement du transfert vers Haneda, l’horaire le plus contraignant du voyage.
              </p>
            </section>
          )}

          {journee.etapes.map((dest) => (
            <Programme key={dest.id} dest={dest} />
          ))}

          {alertes.length > 0 && (
            <section className="panel panel--warn">
              <h2 className="panel__title">
                Vigilance aujourd’hui <span className="panel__count">{alertes.length}</span>
              </h2>
              <ul className="warn-list">
                {alertes.map((alerte) => (
                  <li key={alerte.scope + alerte.text}>
                    <span className="warn-list__scope">{alerte.scope}</span>
                    <span>{alerte.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="panel today-panel today-panel--demain">
            <h2 className="panel__title">Demain — {formatLongDate(demain.date)}</h2>
            <p className="panel__intro">{resume(demain)}</p>
            {demain.nuit && demain.nuit.id !== journee.nuit?.id && (
              <p className="panel__intro">
                Nuit suivante à {demain.nuit.name} —{' '}
                {demain.nuit.accommodation.name ?? <ToFill>hébergement non réservé</ToFill>}
                {formatTime(demain.nuit.accommodation.checkIn) &&
                  `, arrivée à partir de ${formatTime(demain.nuit.accommodation.checkIn)}`}
                .
              </p>
            )}
            {/* Le sac de jour se fait la veille au soir, pas sur le pas de la
                porte : c'est la seule raison d'être de cette ligne ici. */}
            {bagagesDuJour(demain.date).aRemettre.map((expedition) => (
              <p key={expedition.id} className="panel__intro">
                <strong>Valise à expédier demain</strong> vers {etape(expedition.toDestination)?.name},
                livraison demandée pour le {formatJourSemaine(expedition.deliveredOn)} : préparer le
                sac de jour ce soir.
              </p>
            ))}
            <Warnings items={demain.trajets.flatMap((j) => j.warnings ?? [])} title="À préparer ce soir" />
          </section>
        </>
      )}

      {journee.phase === 'apres' && (
        <section className="panel today-panel">
          <h2 className="panel__title">Le voyage est derrière</h2>
          <p className="panel__intro">
            {TRIP.period.start && TRIP.period.end
              ? `${formatDateRange(TRIP.period.start, TRIP.period.end)} · ${journee.total} jours.`
              : null}{' '}
            Il n’y a plus de journée en cours à afficher. Les étapes, les trajets et les galeries
            restent là.
          </p>
          <div className="today-panel__actions">
            <button type="button" className="link-button" onClick={() => goTo('photos')}>
              Les galeries
            </button>
            <button type="button" className="link-button" onClick={() => goTo('itineraire')}>
              L’itinéraire parcouru
            </button>
          </div>
        </section>
      )}

      <p className="view__foot">
        Cette vue ne contient aucune donnée propre : elle relit les dates de{' '}
        <code>src/data/destinations.ts</code> et <code>src/data/trip.ts</code> et n’affiche que ce
        qui tombe le jour choisi. Décaler une date y déplace la journée sans autre modification.
      </p>
    </div>
  )
}

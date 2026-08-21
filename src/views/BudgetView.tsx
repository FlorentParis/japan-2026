/**
 * VUE BUDGET.
 *
 * Deux règles tenues strictement :
 * ▸ les données certaines et les estimations ne sont jamais mélangées — chaque
 *   ligne porte sa nature, et le récapitulatif les sépare explicitement ;
 * ▸ une ligne qui dépend d'une information manquante n'affiche pas 0 ¥, elle
 *   affiche « à compléter ». Un budget à moitié vide est plus utile qu'un
 *   budget faux.
 *
 * Les hypothèses (nombre de voyageurs, durée, dépenses par jour) sont réglables
 * et conservées dans le navigateur — ce sont des réglages, pas des données du
 * voyage.
 */
import { SectionTitle, CertaintyBadge, ToFill } from '../components/ui'
import { TRIP } from '../data/trip'
import {
  accommodationTotals,
  budget,
  flightTotals,
  passAnalysis,
  transferTotals,
  tripDays,
  unpricedLegs,
} from '../lib/derive'
import {
  CERTAINTY_LABEL,
  JPY_PER_EUR,
  JPY_PER_EUR_DATE,
  formatAmount,
  formatDateRange,
  formatMoney,
  formatPartialAmount,
  formatTime,
} from '../lib/format'
import { usePersistentState } from '../lib/usePersistentState'
import { useTrip } from '../state/trip-state'

type Settings = {
  travellers: number
  days: number
  food: number
  activities: number
  local: number
  passId: string
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
  min = 0,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  step?: number
  min?: number
  hint?: string
}) {
  return (
    <label className="number-field">
      <span className="number-field__label">{label}</span>
      <span className="number-field__input">
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          inputMode="numeric"
          onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))}
        />
        {suffix && <span className="number-field__suffix">{suffix}</span>}
      </span>
      {hint && <span className="number-field__hint">{hint}</span>}
    </label>
  )
}

export function BudgetView() {
  const { currency, setCurrency, goTo } = useTrip()
  const derivedDays = tripDays()

  // Clé versionnée : avant la saisie des dates, la durée par défaut valait 0 et
  // a pu être mémorisée telle quelle dans le navigateur. Changer la clé fait
  // repartir des valeurs par défaut plutôt que de conserver un 0 périmé qui
  // annulerait toutes les lignes « par jour ».
  const [settings, setSettings] = usePersistentState<Settings>('budget.v2', {
    travellers: TRIP.travellers?.count ?? 1,
    days: derivedDays ?? 0,
    food: TRIP.budgetDefaults.foodPerDayPerPerson,
    activities: TRIP.budgetDefaults.activitiesPerDayPerPerson,
    local: TRIP.budgetDefaults.localTransportPerDayPerPerson,
    passId: 'none',
  })

  const patch = (next: Partial<Settings>) => setSettings((current) => ({ ...current, ...next }))

  const passes = passAnalysis()
  const selectedPass = TRIP.passes.find((p) => p.id === settings.passId)
  /** Services de transport dont le tarif n'a pas été relevé : le total est un minorant. */
  const sansTarif = unpricedLegs().map((leg) => leg.service ?? leg.id)

  const vols = flightTotals()
  /** Le vol qui porte le prix : par convention, l'aller d'un aller-retour acheté d'un bloc. */
  const volAller = TRIP.flights.find((f) => f.price !== undefined)
  /** Le retour international : le dernier vol dont l'heure de décollage est connue. */
  const volRetour = [...TRIP.flights].reverse().find((f) => f.departureTime !== undefined)
  const transferts = transferTotals()
  const nuits = accommodationTotals()

  const result = budget({
    travellers: settings.travellers,
    days: settings.days,
    foodPerDayPerPerson: settings.food,
    activitiesPerDayPerPerson: settings.activities,
    localTransportPerDayPerPerson: settings.local,
    passJpy: selectedPass?.price.jpy ?? 0,
    passId: selectedPass?.id,
  })

  return (
    <div className="view view--budget">
      <SectionTitle eyebrow="Argent" title="Budget">
        <p>
          Un seul prix a été fourni : le billet d’avion. Il porte la mention « confirmé ».{' '}
          <strong>Tout le reste de ce tableau est une estimation</strong> : les tarifs de transport
          sont relevés sur les grilles publiques, les dépenses quotidiennes sont des hypothèses que
          tu règles ci-dessous. Les deux ne sont jamais additionnés sans le dire.
        </p>
      </SectionTitle>

      <div className="currency-switch">
        <span>Afficher en</span>
        <div className="segmented">
          <button
            type="button"
            className={currency === 'jpy' ? 'is-on' : ''}
            onClick={() => setCurrency('jpy')}
            aria-pressed={currency === 'jpy'}
          >
            ¥ yens
          </button>
          <button
            type="button"
            className={currency === 'eur' ? 'is-on' : ''}
            onClick={() => setCurrency('eur')}
            aria-pressed={currency === 'eur'}
          >
            € euros
          </button>
        </div>
        {currency === 'eur' && (
          <span className="currency-switch__note">
            {/* Un taux de change sans sa date ne veut rien dire : les deux sont
                affichés, pour qu'un chiffre périmé se repère à l'écran. */}
            Conversion indicative à 1 € = {JPY_PER_EUR.toLocaleString('fr-FR')} ¥, taux de
            référence de la Banque centrale européenne du {JPY_PER_EUR_DATE} (
            <code>src/lib/format.ts</code>). Un paiement par carte s’en écarte : marge de la
            banque et taux du jour de la transaction.
          </span>
        )}
      </div>

      <section className="assumptions">
        <h3>Hypothèses</h3>
        <div className="assumptions__grid">
          <NumberField
            label="Voyageurs"
            value={settings.travellers}
            min={1}
            onChange={(travellers) => patch({ travellers })}
            hint={TRIP.travellers?.certainty === 'todo' ? 'non fourni' : undefined}
          />
          <NumberField
            label="Durée du séjour"
            value={settings.days}
            suffix="jours"
            onChange={(days) => patch({ days })}
            hint={derivedDays ? `déduit des dates : ${derivedDays} jours` : 'aucune date fournie'}
          />
          <NumberField
            label="Repas"
            value={settings.food}
            suffix="¥ / jour / pers."
            step={500}
            onChange={(food) => patch({ food })}
          />
          <NumberField
            label="Visites"
            value={settings.activities}
            suffix="¥ / jour / pers."
            step={500}
            onChange={(activities) => patch({ activities })}
          />
          <NumberField
            label="Transports locaux"
            value={settings.local}
            suffix="¥ / jour / pers."
            step={100}
            onChange={(local) => patch({ local })}
          />
          <label className="number-field">
            <span className="number-field__label">Pass ferroviaire</span>
            <span className="number-field__input">
              <select
                value={settings.passId}
                onChange={(event) => patch({ passId: event.target.value })}
              >
                <option value="none">Aucun — billets à l’unité</option>
                {TRIP.passes.map((pass) => (
                  <option key={pass.id} value={pass.id}>
                    {pass.name} · {formatAmount(pass.price.jpy ?? 0, currency)}
                  </option>
                ))}
              </select>
            </span>
            <span className="number-field__hint">
              <button type="button" className="link-button" onClick={() => goTo('transports')}>
                Voir l’analyse de rentabilité
              </button>
            </span>
          </label>
        </div>
        {settings.days === 0 && (
          <p className="assumptions__warning">
            Sans durée de séjour, les dépenses quotidiennes ne peuvent pas être calculées : elles
            restent « à compléter ». Saisis une durée pour simuler, ou renseigne les dates dans{' '}
            <code>src/data/destinations.ts</code>.
          </p>
        )}
      </section>

      <section className="budget-table">
        <h3>Estimation</h3>
        <ul>
          {result.lines.map((line) => (
            <li key={line.id} className={`budget-line${line.incomplete ? ' is-incomplete' : ''}`}>
              <span className="budget-line__icon" aria-hidden="true">
                {line.icon}
              </span>
              <span className="budget-line__text">
                <span className="budget-line__label">{line.label}</span>
                <span className="budget-line__detail">{line.detail}</span>
              </span>
              <span className="budget-line__badge">
                <CertaintyBadge certainty={line.certainty} />
              </span>
              <span className="budget-line__amount">
                {line.incomplete ? (
                  <ToFill />
                ) : (
                  formatPartialAmount(line.jpy, line.partial, currency)
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className="budget-total">
          <div>
            <span className="budget-total__label">
              Total pour {settings.travellers} voyageur{settings.travellers > 1 ? 's' : ''}
            </span>
            <span className="budget-total__value">
              {formatPartialAmount(result.total, result.partial, currency)}
            </span>
          </div>
          <div>
            <span className="budget-total__label">Par personne</span>
            <span className="budget-total__value">
              {formatPartialAmount(result.perPerson, result.partial, currency)}
            </span>
          </div>
          <div>
            <span className="budget-total__label">Par jour et par personne</span>
            <span className="budget-total__value">
              {result.perDay ? (
                formatPartialAmount(
                  result.perDay / settings.travellers,
                  result.partial,
                  currency,
                )
              ) : (
                <ToFill />
              )}
            </span>
          </div>
        </div>

        {(result.incomplete || result.partial > 0) && (
          <p className="budget-table__warning">
            Ce total est <strong>incomplet</strong> :{' '}
            {/* Les deux façons d'être incomplet ne coexistent pas toujours : ne
                citer que celles qui sont effectivement à l'œuvre. */}
            {result.incomplete && (
              <>les lignes marquées « à compléter » n’y sont pas comptées</>
            )}
            {result.incomplete && result.partial > 0 && ', et '}
            {result.partial > 0 && (
              <>
                {result.partial} montant(s) manquant(s) — tarifs de transport non relevés, activités
                sans prix, étapes dont l’hébergement reste à réserver — sont comptés pour zéro, d’où
                le « ≥ »
              </>
            )}
            . Il ne s’agit donc pas du coût du voyage, mais du coût de ce qui est actuellement
            renseigné.
          </p>
        )}
      </section>

      <section className="two-columns">
        <div className="panel">
          <h3 className="panel__title">Ce qui est certain</h3>
          <p className="panel__intro">Données fournies, réservées ou payées.</p>
          {vols.priced > 0 ? (
            <ul className="plain-list">
              <li>
                <strong>Billets d’avion internationaux : {formatMoney(volAller?.price, 'eur')}</strong>{' '}
                par personne, aller-retour Europe ⇄ Tokyo, déjà payés. C’est le montant réel en
                euros — l’affichage en yens ci-dessus en est une conversion au taux indicatif, pas
                l’inverse.
              </li>
              <li>
                Arrivée à {volAller?.to} le {formatDateRange(volAller?.date)} à{' '}
                {formatTime(volAller?.arrivalTime)}, décollage de {volRetour?.from} le{' '}
                {formatDateRange(volRetour?.date)} à {formatTime(volRetour?.departureTime)}. Ce sont
                les seules heures fermes du voyage, et elles contraignent le premier et le dernier
                jour : voir les points de vigilance.
              </li>
              {/* Construite sur `accommodationTotals()` : la phrase suit les
                  réservations au lieu d'affirmer qu'il n'y en a aucune. */}
              <li>
                Les dates et le nombre de nuits de chaque étape.{' '}
                {nuits.nights > 0 ? (
                  <>
                    Côté hébergement, {formatMoney({ jpy: nuits.jpy, certainty: 'confirmed' }, currency)}{' '}
                    de réservé pour {nuits.nights} nuit
                    {nuits.nights > 1 ? 's' : ''} —{' '}
                    {nuits.missing > 0
                      ? `${nuits.missing} étapes n’ont encore aucun prix : le total ci-dessus est donc un minorant.`
                      : 'toutes les étapes ont leur prix.'}
                  </>
                ) : (
                  <>Aucun prix d’hébergement, en revanche : rien n’est réservé.</>
                )}
              </li>
            </ul>
          ) : (
            <p className="panel__empty">
              <ToFill>rien pour l’instant</ToFill> — aucun prix, aucune réservation n’a été fourni.
            </p>
          )}
        </div>
        <div className="panel">
          <h3 className="panel__title">Ce qui est estimé</h3>
          <ul className="plain-list">
            <li>
              Transports entre les étapes :{' '}
              {formatPartialAmount(
                passes.coveredJpy + passes.notCoveredJpy,
                sansTarif.length,
                currency,
              )}{' '}
              par personne, relevés sur les grilles JR, Nohi Bus, Alpico et les compagnies de
              ferry.
              {sansTarif.length > 0 && (
                <>
                  {' '}
                  Manquent {sansTarif.length} tarif(s) : {sansTarif.join(', ')}.
                </>
              )}
            </li>
            <li>
              Transferts d’aéroport :{' '}
              {formatPartialAmount(transferts.jpy, transferts.unpriced, currency)} par personne
              (Narita Express à l’arrivée, monorail de Haneda au départ), tarifs publics relevés
              chez les opérateurs. Le trajet jusqu’au monorail dépend de l’hôtel et n’est pas
              compté.
            </li>
            <li>Prix des pass : tarifs publics, à revérifier avant achat.</li>
            <li>
              Repas, visites et transports locaux : hypothèses réglables ci-dessus, {CERTAINTY_LABEL.estimate.toLowerCase()} par nature.
            </li>
            <li>Vol Nagasaki → Tokyo : très variable selon la date d’achat.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

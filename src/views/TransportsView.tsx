/**
 * VUE TRANSPORTS.
 *
 * Trois choses : le détail de chaque déplacement, le bilan par mode, et
 * l'analyse des pass ferroviaires.
 *
 * Sur les pass, la règle est stricte : l'économie n'est jamais présentée comme
 * certaine. Un pass n'est valable que sur des jours consécutifs ; maintenant que
 * les dates sont connues, chaque écart est calculé sur la meilleure période
 * d'activation possible et ce qui tombe en dehors est déduit. Restent deux
 * réserves, affichées en clair : les tarifs sont des estimations, et deux
 * tronçons couverts n'ont pas de tarif relevé — ils comptent pour zéro, ce qui
 * sous-estime l'intérêt du pass.
 */
import { JourneyCard } from '../components/JourneyCard'
import { CertaintyBadge, SectionTitle, ToFill, Warnings } from '../components/ui'
import { JOURNEYS } from '../data/journeys'
import { REGIONAL_PASS_CANDIDATES, TRIP } from '../data/trip'
import { journeyLabel, journeyTotals, passAnalysis, totalsByMode } from '../lib/derive'
import {
  formatAmount,
  formatDateRange,
  formatKm,
  formatMinutes,
  formatMoney,
  formatPartialAmount,
} from '../lib/format'
import { MODE_STYLES } from '../lib/modes'
import { useTrip } from '../state/trip-state'

export function TransportsView() {
  const { currency, goTo, selection, selectJourney } = useTrip()
  const totals = totalsByMode()
  const passes = passAnalysis()
  /** Services couverts par un pass mais dont le tarif n'a pas été relevé. */
  const sansTarif = passes.coveredLegs
    .filter((leg) => leg.cost !== undefined && leg.cost.jpy === undefined)
    .map((leg) => leg.service ?? leg.id)

  return (
    <div className="view view--transports">
      <SectionTitle eyebrow="Se déplacer" title="Transports">
        <p>
          {JOURNEYS.length} déplacements, {JOURNEYS.reduce((s, j) => s + j.legs.length, 0)} tronçons.
          Chaque tronçon indique son mode, son service, sa durée, son prix estimé et sa couverture
          par un pass JR.
        </p>
      </SectionTitle>

      <section className="mode-totals">
        <h3>Bilan par mode</h3>
        <ul>
          {totals.map((total) => {
            const style = MODE_STYLES[total.mode]
            return (
              <li key={total.mode}>
                <span className="mode-totals__bar" style={{ background: style.color }} />
                <span className="mode-totals__label">
                  {style.icon} {style.plural}
                </span>
                <span className="mode-totals__legs">
                  {total.legs} tronçon{total.legs > 1 ? 's' : ''}
                </span>
                <span className="mode-totals__km">{formatKm(total.km)}</span>
                <span className="mode-totals__cost">
                  {/* La marche est gratuite : ce n'est pas un billet « inclus ». */}
                  {total.mode === 'walk'
                    ? 'gratuit'
                    : formatPartialAmount(total.jpy, total.unpricedLegs, currency)}
                  {total.mode !== 'walk' && total.includedLegs > 0 && (
                    <span className="mode-totals__note">
                      {' '}
                      + {total.includedLegs} inclus dans un billet groupé
                    </span>
                  )}
                  {total.unpricedLegs > 0 && (
                    <span className="mode-totals__note">
                      {' '}
                      + {total.unpricedLegs} sans tarif relevé
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="pass-analysis">
        <h3>Un pass ferroviaire est-il rentable ?</h3>

        <div className="pass-analysis__split">
          <div>
            <span className="pass-analysis__figure">
              {formatPartialAmount(passes.coveredJpy, passes.unpricedCovered, currency)}
            </span>
            <span className="pass-analysis__caption">
              de trajets sur le réseau JR ({passes.coveredLegs.length} tronçons) — c’est ce qu’un
              JR Pass pourrait remplacer
              {passes.unpricedCovered > 0 &&
                `, et c’est un minorant : ${passes.unpricedCovered} tronçon(s) n’ont pas de tarif relevé`}
            </span>
          </div>
          <div>
            <span className="pass-analysis__figure">
              {formatMoney({ jpy: passes.notCoveredJpy, certainty: 'estimate' }, currency)}
            </span>
            <span className="pass-analysis__caption">
              de trajets qu’aucun pass JR ne couvre ({passes.notCoveredLegs.length} tronçons) : bus
              de montagne, compagnies privées, route alpine, ferries, vol
            </span>
          </div>
          <div>
            <span className="pass-analysis__figure">{passes.jrSpanDays ?? '—'} jours</span>
            <span className="pass-analysis__caption">
              séparent le premier du dernier trajet JR ({passes.jrJourneys} déplacements) — c’est ce
              chiffre, et non le total ci-contre, qui décide si un pass de 7, 14 ou 21 jours peut
              tout couvrir
            </span>
          </div>
        </div>

        <ul className="pass-list">
          {passes.verdicts.map((verdict) => (
            <li key={verdict.passId} className="pass-row">
              <div className="pass-row__name">
                <p>{verdict.name}</p>
                <p className="pass-row__scope">
                  {TRIP.passes.find((p) => p.id === verdict.passId)?.scope}
                </p>
              </div>
              <div className="pass-row__price">
                {formatAmount(verdict.passJpy, currency)}
                <CertaintyBadge certainty="estimate" label="tarif estimé" />
              </div>
              <div
                className={`pass-row__delta${verdict.savingJpy > 0 ? ' is-positive' : ' is-negative'}`}
              >
                {verdict.savingJpy > 0 ? '−' : '+'}
                {formatAmount(Math.abs(verdict.savingJpy), currency)}
                <span className="pass-row__delta-label">
                  {verdict.savingJpy > 0 ? 'd’économie possible' : 'de surcoût'}
                </span>
              </div>
              {verdict.window ? (
                <div className="pass-row__window">
                  <p>
                    Meilleure activation :{' '}
                    <strong>
                      {formatDateRange(verdict.window.start, verdict.window.end)}
                    </strong>{' '}
                    — {verdict.window.journeys.length} déplacement(s) JR sur les{' '}
                    {passes.jrJourneys} du voyage, soit{' '}
                    <strong>
                      {formatPartialAmount(
                        verdict.windowJpy,
                        verdict.window.unpriced,
                        currency,
                      )}
                    </strong>{' '}
                    de trajets couverts.
                  </p>
                  <ul>
                    {verdict.window.journeys.map((j) => (
                      <li key={j.journeyId}>
                        <span>{formatDateRange(j.date)}</span>
                        <span>{j.label}</span>
                        <span>{formatPartialAmount(j.jpy, j.unpriced, currency)}</span>
                        {j.unpriced > 0 && <span>tarif non relevé</span>}
                      </li>
                    ))}
                  </ul>
                  {verdict.outsideJpy > 0 && (
                    <p>
                      Reste{' '}
                      <strong>
                        {formatMoney({ jpy: verdict.outsideJpy, certainty: 'estimate' }, currency)}
                      </strong>{' '}
                      de trajets JR hors de cette fenêtre, à payer au billet — déjà déduit de
                      l’écart ci-dessus.
                    </p>
                  )}
                  {verdict.window.unpriced > 0 && (
                    <p>
                      {verdict.window.unpriced} tronçon(s) de cette fenêtre n’ont pas de tarif
                      relevé : ils comptent pour zéro, donc l’écart affiché{' '}
                      <strong>sous-estime l’intérêt du pass</strong>.
                    </p>
                  )}
                </div>
              ) : (
                <div className="pass-row__window">
                  <p>Aucun trajet daté couvert par ce pass : rien à comparer.</p>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="pass-analysis__caveat">
          <p>
            <strong>Ces écarts ne sont pas des économies acquises.</strong> Un pass n’est valable
            que sur des jours <em>consécutifs</em>. Les trajets JR de ce voyage s’étalent sur{' '}
            {passes.jrSpanDays ?? '—'} jours : aucun pass ne les couvre tous. Chaque ligne est donc
            calculée sur la période d’activation la plus rentable, et ce qui tombe en dehors reste
            à payer.
          </p>
          <p>
            Le calcul suppose aussi que les tarifs relevés sont exacts, et ce sont des estimations.
            {passes.unpricedCovered > 0 && (
              <>
                {' '}
                Surtout, {passes.unpricedCovered} tronçon(s) couverts n’ont aucun tarif relevé
                ({sansTarif.join(', ')}) : ils sont comptés pour zéro, ce qui{' '}
                <strong>sous-estime</strong> l’intérêt du pass.
              </>
            )}{' '}
            À confirmer avant tout achat.{' '}
            {!passes.conclusive && (
              <strong>Verdict impossible à trancher en l’état : dates manquantes.</strong>
            )}
          </p>
        </div>

        <h4>Pass régionaux à étudier</h4>
        <p className="pass-analysis__intro">
          Sur ce parcours précis, plusieurs pass régionaux couvrent des tronçons que le pass
          national ignore. Leurs tarifs ne sont pas renseignés ici : je ne les avance pas de
          mémoire.
        </p>
        <ul className="pass-list pass-list--regional">
          {REGIONAL_PASS_CANDIDATES.map((pass) => (
            <li key={pass.name} className="pass-row">
              <div className="pass-row__name">
                <p>
                  <a href={pass.url} target="_blank" rel="noreferrer noopener">
                    {pass.name}
                  </a>
                </p>
                <p className="pass-row__scope">{pass.scope}</p>
              </div>
              <div className="pass-row__price">
                <ToFill>tarif</ToFill>
              </div>
              <div className="pass-row__delta" />
            </li>
          ))}
        </ul>
      </section>

      <section className="flights">
        <h3>Vols</h3>
        <ul>
          {TRIP.flights.map((flight) => (
            <li key={flight.label}>
              <span className="flights__label">✈️ {flight.label}</span>
              <span className="flights__route">
                {flight.from} → {flight.to}
              </span>
              <CertaintyBadge certainty={flight.certainty} />
              {flight.note && <span className="flights__note">{flight.note}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="journey-list">
        <h3>Détail des déplacements</h3>
        <ol>
          {JOURNEYS.map((journey, index) => {
            const open = selection?.kind === 'journey' && selection.id === journey.id
            const t = journeyTotals(journey)
            return (
              <li key={journey.id} className={open ? 'is-open' : ''}>
                <button
                  type="button"
                  className="journey-list__head"
                  onClick={() => selectJourney(journey.id)}
                  aria-expanded={open}
                >
                  <span className="journey-list__index">{index + 1}</span>
                  <span className="journey-list__label">{journeyLabel(journey)}</span>
                  <span className="journey-list__modes" aria-hidden="true">
                    {[...new Set(journey.legs.map((l) => l.mode))]
                      .map((m) => MODE_STYLES[m].icon)
                      .join(' ')}
                  </span>
                  <span className="journey-list__figures">
                    {formatMinutes(t.minutes)} · {formatPartialAmount(t.jpy, t.unpriced, currency)}
                  </span>
                </button>
                {open && (
                  <div className="journey-list__body">
                    <JourneyCard journey={journey} />
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => goTo('carte', { kind: 'journey', id: journey.id })}
                    >
                      Suivre ce trajet sur la carte
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <Warnings
        title="Rappels sur les transports"
        items={[
          'Les tarifs sont des estimations en sièges non réservés sauf mention : compter un supplément pour les sièges réservés.',
          'Le Nozomi et le Mizuho ne sont pas couverts par le JR Pass national : les itinéraires retenus passent par des Hikari et des Sakura.',
          'Les bus de montagne (Kamikōchi, Shirakawa-gō, route alpine) se réservent et ferment l’hiver.',
        ]}
      />
    </div>
  )
}

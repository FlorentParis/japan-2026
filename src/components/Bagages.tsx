/**
 * LA VALISE : ce qu'il y a à en faire sur une étape, et le récapitulatif complet.
 *
 * Deux composants, une seule source. `BagageDeLEtape` s'insère dans la fiche
 * d'étape et ne parle que de cette étape ; `ListeDesExpeditions` montre les quatre
 * envois côte à côte, ce qui est la seule façon de vérifier que la chaîne se tient.
 * Aucun des deux n'écrit de date : tout vient de `data/bagages.ts` par
 * `lib/bagages.ts`.
 *
 * Le vocabulaire est celui du guichet, pas celui du code : on « remet » une valise
 * à la réception le jour de l'expédition, on la « retrouve » le jour de la
 * livraison. C'est ce qu'on dira à voix haute à l'hôtel.
 */
import { HEBERGEMENTS_A_EVITER, REGLES_EXPEDITION } from '../data/bagages'
import {
  bagagesDeLEtape,
  etape,
  etapesTraversees,
  expeditions,
  nuitsSansValise,
} from '../lib/bagages'
import { formatJourSemaine } from '../lib/format'
import { useTrip } from '../state/trip-state'
import type { Expedition } from '../types'
import { CertaintyBadge, ToFill } from './ui'

/** « Toyoko Inn Matsumoto » ou, faute de réservation, « hôtel de Matsumoto ». */
function hebergement(destId: string): { nom: string; reserve: boolean } {
  const dest = etape(destId)
  if (!dest) return { nom: destId, reserve: false }
  const nom = dest.accommodation.name
  return nom
    ? { nom, reserve: dest.accommodation.status === 'confirmed' }
    : { nom: `hôtel de ${dest.name}`, reserve: false }
}

/**
 * Un envoi, en entier.
 *
 * Le motif est affiché avant les dates, et ce n'est pas un détail de mise en
 * page : la question qu'on se pose devant un envoi n'est pas « quand » mais
 * « pourquoi je me sépare de mes affaires ».
 */
export function ExpeditionCard({ expedition }: { expedition: Expedition }) {
  const { goTo } = useTrip()
  const depart = etape(expedition.fromDestination)
  const arrivee = etape(expedition.toDestination)
  const de = hebergement(expedition.fromDestination)
  const vers = hebergement(expedition.toDestination)
  const traversees = etapesTraversees(expedition)
  const nuits = nuitsSansValise(expedition)

  return (
    <article className="expedition">
      <header className="expedition__head">
        <h4 className="expedition__route">
          {depart?.name ?? expedition.fromDestination} <span aria-hidden="true">→</span>{' '}
          {arrivee?.name ?? expedition.toDestination}
        </h4>
        <CertaintyBadge certainty={expedition.certainty} />
      </header>

      <p className="expedition__reason">{expedition.reason}</p>

      <dl className="expedition__dates">
        <div>
          <dt>Remettre le</dt>
          <dd>
            <strong>{formatJourSemaine(expedition.sentOn)}</strong>
            <span className="expedition__hotel">
              {de.nom}
              {!de.reserve && <> — <ToFill>à réserver</ToFill></>}
            </span>
          </dd>
        </div>
        <div>
          <dt>Livraison à demander le</dt>
          <dd>
            <strong>{formatJourSemaine(expedition.deliveredOn)}</strong>
            <span className="expedition__hotel">
              {vers.nom}
              {!vers.reserve && <> — <ToFill>à réserver</ToFill></>}
            </span>
          </dd>
        </div>
      </dl>

      {traversees.length > 0 && (
        <p className="expedition__sans">
          Sans valise :{' '}
          {traversees.map((dest, index) => (
            <span key={dest.id}>
              {index > 0 && ', '}
              <button
                type="button"
                className="link-button"
                onClick={() => goTo('itineraire', { kind: 'destination', id: dest.id })}
              >
                {dest.name}
              </button>
            </span>
          ))}
          {/* Les nuits viennent des dates de l'envoi, pas du nombre d'étapes :
              la route alpine et Naoshima se traversent sans y dormir, et la nuit
              sans valise de l'envoi de Hiroshima se passe à Hiroshima même. */}
          {nuits > 0 && <> — {nuits === 1 ? 'une nuit' : `${nuits} nuits`} avec un sac de jour</>}.
        </p>
      )}

      {expedition.note && <p className="expedition__note">{expedition.note}</p>}

      {expedition.warnings && expedition.warnings.length > 0 && (
        <ul className="expedition__warnings">
          {expedition.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </article>
  )
}

/**
 * Le bloc « valise » d'une fiche d'étape.
 *
 * Rend `null` sur les treize étapes où la valise suit sans histoire : une mention
 * « rien à faire » répétée treize fois ferait perdre de vue les cinq où il y a
 * quelque chose à faire.
 */
export function BagageDeLEtape({ destId }: { destId: string }) {
  const { aExpedier, aRecuperer, sansValise } = bagagesDeLEtape(destId)
  if (aExpedier.length === 0 && aRecuperer.length === 0 && sansValise.length === 0) return null

  const eviter = HEBERGEMENTS_A_EVITER.find((h) => h.destination === destId)

  return (
    <section className="bagage">
      <p className="bagage__title">
        <span aria-hidden="true">🧳</span> La valise
      </p>

      {sansValise.map((expedition) => (
        <p key={expedition.id} className="bagage__ligne bagage__ligne--sans">
          <strong>Étape sans valise.</strong> Elle est en route depuis{' '}
          {etape(expedition.fromDestination)?.name} vers {etape(expedition.toDestination)?.name},
          livraison le {formatJourSemaine(expedition.deliveredOn)}. Ici, un sac de jour suffit.
        </p>
      ))}

      {aExpedier.map((expedition) => (
        <p key={expedition.id} className="bagage__ligne bagage__ligne--partir">
          <strong>À expédier le {formatJourSemaine(expedition.sentOn)}</strong> vers{' '}
          {hebergement(expedition.toDestination).nom} ({etape(expedition.toDestination)?.name}),
          livraison à demander pour le {formatJourSemaine(expedition.deliveredOn)}.
        </p>
      ))}

      {aRecuperer.map((expedition) => (
        <p key={expedition.id} className="bagage__ligne bagage__ligne--arriver">
          <strong>Valise livrée ici le {formatJourSemaine(expedition.deliveredOn)}</strong>, expédiée
          depuis {etape(expedition.fromDestination)?.name}.
        </p>
      ))}

      {eviter && <p className="bagage__ligne bagage__ligne--jamais">Ne rien faire livrer ici : {eviter.raison}</p>}
    </section>
  )
}

/** Les quatre envois, les refus assumés, et les règles de guichet. */
export function ListeDesExpeditions() {
  const tous = expeditions()

  return (
    <section className="panel bagages-panel">
      <h2 className="panel__title">
        <span aria-hidden="true">🧳</span> Envois de valise d’hôtel à hôtel{' '}
        <span className="panel__count">{tous.length}</span>
      </h2>
      <p className="panel__intro">
        Le voyage se fait avec la valise, sauf sur trois passages où elle est un vrai handicap et un
        où elle est carrément impossible : la route alpine Tateyama-Kurobe. Chaque envoi part d’une
        réception d’hôtel et arrive à une autre ; entre les deux, un sac de jour. Aucun n’est
        réservé : les dates sont calculées sur le calendrier du voyage, les délais restent à
        confirmer au guichet.
      </p>

      <div className="expeditions">
        {tous.map((expedition) => (
          <ExpeditionCard key={expedition.id} expedition={expedition} />
        ))}
      </div>

      <div className="bagages-panel__regles">
        <p className="bagages-panel__regles-title">Au guichet</p>
        <ul>
          {REGLES_EXPEDITION.map((regle) => (
            <li key={regle}>{regle}</li>
          ))}
        </ul>
      </div>

      <div className="bagages-panel__regles">
        <p className="bagages-panel__regles-title">Où ne rien faire livrer</p>
        <ul>
          {HEBERGEMENTS_A_EVITER.map((item) => (
            <li key={item.destination}>
              <strong>{etape(item.destination)?.name ?? item.destination}</strong> — {item.raison}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * LA LUMIÈRE DU JOUR, telle qu'une étape et une date la donnent.
 *
 * Deux formes, un seul calcul (`lib/soleil.ts`) :
 * ▸ `LigneSoleil` — une ligne, pour la fiche d'une étape : ce que le jour donne
 *   à l'arrivée. Elle répond à « combien de temps ai-je en arrivant ».
 * ▸ `LumiereDuJour` — un bloc, pour la vue Aujourd'hui : la même chose plus ce
 *   qu'il reste de lumière maintenant. Elle répond à « est-ce que j'ai encore le
 *   temps ».
 *
 * Le décompte de ce qu'il reste n'apparaît **que** le jour même. Sur un jour
 * simulé — la vue Aujourd'hui permet de se projeter sur n'importe quelle date —
 * « il reste 2 h de jour » serait une phrase fausse : il ne reste rien du tout
 * d'un 20 novembre qui n'est pas arrivé. Le bloc se contente alors des horaires.
 */
import { formatMinutes } from '../lib/format'
import { lumiereRestante, maintenantAuJapon, soleilDuJour, type Soleil } from '../lib/soleil'
import type { Coord } from '../types'
import { CertaintyBadge } from './ui'

/** « 6 h 22 → 16 h 32 », ou rien du tout si le calcul n'a pas abouti. */
function plage(soleil: Soleil): string | undefined {
  if (soleil.lever === undefined || soleil.coucher === undefined) return undefined
  return `${formatMinutes(soleil.lever)} → ${formatMinutes(soleil.coucher)}`
}

/**
 * Le soleil d'une étape, en une ligne.
 *
 * Rend `null` sans date : une étape dont les dates ne sont pas arrêtées n'a pas de
 * jour dont on puisse calculer la lumière, et sortir celle d'aujourd'hui à la
 * place serait une donnée sans rapport.
 */
export function LigneSoleil({
  date,
  coord,
  label = 'Le jour',
}: {
  date?: string
  coord: Coord
  label?: string
}) {
  if (!date) return null
  const soleil = soleilDuJour(date, coord)
  const horaires = plage(soleil)
  if (!horaires || soleil.duree === undefined) return null

  return (
    <p className="soleil-ligne">
      <span aria-hidden="true">🌅</span>
      <span>
        {label} : <strong>{horaires}</strong>
        <span className="soleil-ligne__duree"> — {formatMinutes(soleil.duree)} de jour</span>
        {soleil.crepuscule !== undefined && (
          <span className="soleil-ligne__duree">
            , dernière lumière vers {formatMinutes(soleil.crepuscule)}
          </span>
        )}
      </span>
      <CertaintyBadge certainty="estimate" label="calculé" />
    </p>
  )
}

/**
 * Ce que la journée donne de lumière, pour la vue Aujourd'hui.
 *
 * `lieu` sert à nommer le point de calcul. Une journée touche parfois deux ou
 * trois étapes, et le soleil ne se couche pas à la même minute à Kurashiki et à
 * Matsuyama : dire sur quelle ville porte le chiffre évite de le lire comme
 * valable partout.
 */
export function LumiereDuJour({
  date,
  coord,
  lieu,
  /** `true` quand la date affichée est réellement celle du jour au Japon. */
  aujourdhui,
}: {
  date: string
  coord: Coord
  lieu: string
  aujourdhui: boolean
}) {
  const soleil = soleilDuJour(date, coord)
  const horaires = plage(soleil)
  if (!horaires || soleil.duree === undefined) return null

  const maintenant = maintenantAuJapon()
  const restant = aujourdhui ? lumiereRestante(soleil, maintenant.minutes) : undefined

  return (
    <section className="panel today-panel today-panel--soleil">
      <h2 className="panel__title">
        <span aria-hidden="true">🌅</span> La lumière à {lieu}{' '}
        <CertaintyBadge certainty="estimate" label="calculé" />
      </h2>

      <p className="soleil-plage">
        <span className="soleil-plage__bornes">{horaires}</span>
        <span className="soleil-plage__duree">{formatMinutes(soleil.duree)} de jour</span>
      </p>

      <ul className="soleil-detail">
        {soleil.lever !== undefined && (
          <li>
            <span className="soleil-detail__label">Lever</span>
            <span className="soleil-detail__valeur">{formatMinutes(soleil.lever)}</span>
          </li>
        )}
        <li>
          <span className="soleil-detail__label">Midi solaire</span>
          <span className="soleil-detail__valeur">{formatMinutes(soleil.midi)}</span>
        </li>
        {soleil.coucher !== undefined && (
          <li>
            <span className="soleil-detail__label">Coucher</span>
            <span className="soleil-detail__valeur">{formatMinutes(soleil.coucher)}</span>
          </li>
        )}
        {soleil.crepuscule !== undefined && (
          <li>
            <span className="soleil-detail__label">Nuit close</span>
            <span className="soleil-detail__valeur">{formatMinutes(soleil.crepuscule)}</span>
          </li>
        )}
      </ul>

      {/* Le décompte, seulement le jour même — voir l'en-tête du fichier. Le cas
          « déjà couché » est distingué de « pas encore levé » : `lumiereRestante`
          rend 0 pour l'un et rien pour l'autre, et les confondre annoncerait la
          nuit à cinq heures du matin. */}
      {restant !== undefined && (
        <p className="soleil-restant">
          {restant === 0 ? (
            <>
              <strong>Le soleil est couché.</strong> Il reste encore un peu de crépuscule jusqu’à{' '}
              {soleil.crepuscule !== undefined
                ? formatMinutes(soleil.crepuscule)
                : 'la nuit close'}
              .
            </>
          ) : (
            <>
              <strong>{formatMinutes(restant)} de jour devant soi</strong> — il est{' '}
              {formatMinutes(maintenant.minutes)} au Japon.
            </>
          )}
        </p>
      )}

      <p className="soleil-caveat">
        Horaires calculés pour les coordonnées de l’étape (voir <code>src/lib/soleil.ts</code>),
        heure du Japon. C’est le soleil d’un horizon plat : dans une vallée encaissée — Kamikōchi,
        Takayama, la route alpine — la crête le coupe bien avant l’heure indiquée, et la lumière
        utile finit donc plus tôt que ce qui est écrit ici.
      </p>
    </section>
  )
}

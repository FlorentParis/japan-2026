/**
 * LA JOURNÉE EN COURS — ce que le voyage prévoit pour une date donnée.
 *
 * Tout est déduit des dates de `src/data/`, comme le reste du site : rien n'est
 * écrit à la main ici, et une date décalée dans `destinations.ts` déplace la
 * journée d'elle-même.
 *
 * La subtilité est dans le modèle de dates des étapes : `start` est le jour
 * d'arrivée, `end` le jour de départ, et le jour de départ d'une étape est aussi
 * le jour d'arrivée de la suivante. Une même date touche donc régulièrement deux
 * étapes — trois le 17 novembre, où une visite sans nuit (Tateyama) s'intercale.
 * D'où `etapes` au pluriel, et `nuit` à part : la seule étape dont on n'est pas
 * encore reparti le soir.
 */
import { DESTINATIONS } from '../data/destinations'
import { JOURNEYS } from '../data/journeys'
import { TRIP } from '../data/trip'
import { journeyDate } from './derive'
import { daysInclusive } from './format'
import { itineraire, volDuJour } from './vols'
import type { Destination, Flight, Journey, Transfer } from '../types'

/**
 * Où l'on se situe par rapport au séjour. `sans-dates` n'est pas un cas
 * théorique : le site tourne aussi sans aucune date saisie, et il vaut mieux le
 * dire que faire semblant d'avoir un « aujourd'hui » à montrer.
 */
export type PhaseDuVoyage = 'sans-dates' | 'avant' | 'pendant' | 'apres'

export type Journee = {
  date: string
  phase: PhaseDuVoyage
  /** Rang du jour dans le séjour, à partir de 1. Absent hors séjour. */
  jour?: number
  /** Durée totale du séjour en jours, bornes incluses. */
  total?: number
  /**
   * Jours restants avant le décollage. 0 = c'est aujourd'hui qu'on part.
   *
   * Compté jusqu'au départ de Paris, pas jusqu'au premier jour du séjour : l'avion
   * décolle le 5 novembre et atterrit le 6, si bien qu'un compte à rebours calé
   * sur le séjour afficherait « J−1 » le jour même de l'embarquement.
   */
  joursAvant?: number
  /** Jours écoulés depuis le dernier jour du voyage. */
  joursApres?: number
  /** Les étapes que cette date touche, dans l'ordre du parcours. */
  etapes: Destination[]
  /**
   * L'étape où l'on dort la nuit qui suit : celle dont on n'est pas encore
   * reparti. Absente le dernier jour, où l'on ne dort plus au Japon.
   */
  nuit?: Destination
  /** Déplacements d'étape à étape effectués ce jour-là. */
  trajets: Journey[]
  /** Transferts aéroport ⇄ ville datés de ce jour. */
  transferts: Transfer[]
  /** Vols datés de ce jour, internationaux comme intérieurs. */
  vols: Flight[]
}

/** Date locale au format `AAAA-MM-JJ`, celui de toutes les dates du site. */
export function dateISO(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, '0')
  const quantieme = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mois}-${quantieme}`
}

/** Premier et dernier jour du séjour, s'ils sont connus. */
function bornes(): { start: string; end: string } | undefined {
  const { start, end } = TRIP.period
  return start && end ? { start, end } : undefined
}

/** La borne d'une étape côté départ : `end` s'il existe, sinon le jour d'arrivée. */
function finDeSejour(dest: Destination): string | undefined {
  return dest.dates.end ?? dest.dates.start
}

/**
 * Le jour où l'on quitte la maison : le premier décollage du voyage.
 *
 * Ce n'est pas le premier jour du séjour. L'aller décolle de Paris le 5 novembre
 * et atterrit à Narita le 6 : `TRIP.period` commence le 6, parce que c'est le
 * séjour au Japon que tout le site compte, mais le compte à rebours doit viser le
 * 5 — sinon il annonce « J−1 » à quelqu'un qui est déjà à l'aéroport.
 *
 * `undefined` si aucun vol n'a de date : on retombe alors sur le début du séjour.
 */
export function departDeLaMaison(): string | undefined {
  const departs = TRIP.flights
    .map((vol) => itineraire(vol).departureDate)
    .filter((date): date is string => Boolean(date))
  // Format AAAA-MM-JJ : l'ordre alphabétique est l'ordre chronologique.
  return [...departs].sort((a, b) => a.localeCompare(b))[0]
}

/**
 * Le programme d'une date.
 *
 * Les dates sont en `AAAA-MM-JJ` : l'ordre alphabétique est l'ordre
 * chronologique, comparer les chaînes suffit — même convention que
 * `bestWindow()` dans `derive.ts`.
 */
export function journeeDu(date: string): Journee {
  const etapes = DESTINATIONS.filter((dest) => {
    const debut = dest.dates.start
    const fin = finDeSejour(dest)
    return debut !== undefined && fin !== undefined && debut <= date && date <= fin
  })

  const commun = {
    date,
    etapes,
    nuit: etapes.find((dest) => (finDeSejour(dest) as string) > date),
    trajets: JOURNEYS.filter((journey) => journeyDate(journey) === date),
    transferts: (TRIP.transfers ?? []).filter((transfer) => transfer.date === date),
    // Un vol de nuit concerne deux journées : le filtre porte sur toutes les
    // dates que l'itinéraire touche, décollage et atterrissage compris.
    vols: TRIP.flights.filter((vol) => volDuJour(vol, date)),
  }

  const cadre = bornes()
  if (!cadre) return { ...commun, phase: 'sans-dates' }

  const total = daysInclusive(cadre.start, cadre.end)
  if (date < cadre.start) {
    const cible = departDeLaMaison() ?? cadre.start
    return {
      ...commun,
      phase: 'avant',
      total,
      // Négatif serait absurde : si le décollage est déjà passé alors qu'on est
      // encore avant le séjour — le cas du 5 novembre au soir — le compte tombe
      // à 0, c'est-à-dire « on part aujourd'hui ».
      joursAvant: Math.max(0, daysInclusive(date, cible) - 1),
    }
  }
  if (date > cadre.end) {
    return { ...commun, phase: 'apres', total, joursApres: daysInclusive(cadre.end, date) - 1 }
  }
  return { ...commun, phase: 'pendant', total, jour: daysInclusive(cadre.start, date) }
}

/**
 * Les avertissements qui concernent cette journée précisément — ceux des étapes
 * touchées, des trajets effectués et des transferts du jour.
 *
 * C'est le même contenu que la section « points de vigilance » de l'aperçu, mais
 * filtré au jour : en voyage, la seule chose qui compte est ce qui tombe
 * aujourd'hui.
 */
export function alertesDuJour(journee: Journee): Array<{ scope: string; text: string }> {
  return [
    ...journee.etapes.flatMap((dest) =>
      (dest.warnings ?? []).map((text) => ({ scope: dest.name, text })),
    ),
    ...journee.trajets.flatMap((journey) =>
      (journey.warnings ?? []).map((text) => ({ scope: 'Trajet', text })),
    ),
    ...journee.transferts.flatMap((transfer) =>
      (transfer.warnings ?? []).map((text) => ({ scope: transfer.label, text })),
    ),
  ]
}

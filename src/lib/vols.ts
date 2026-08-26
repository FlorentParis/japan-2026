/**
 * ITINÉRAIRE D'UN VOL — dérivé de ses tronçons, jamais écrit à la main.
 *
 * Un vol avec escale a deux numéros, deux aéroports intermédiaires et quatre
 * horaires. Les données ne gardent que les tronçons (`Flight.segments`) ; tout ce
 * qui décrit le trajet d'un bout à l'autre — d'où l'on part, où l'on arrive,
 * quand, combien de temps dure l'escale — est recalculé ici. Modifier un horaire
 * dans les données suffit donc à mettre à jour le site, sans risque de laisser un
 * « départ 12 h 25 » périmé quelque part.
 *
 * ⚠️ Aucune durée de vol n'est calculée, et c'est volontaire. Les horaires sont
 * locaux : Paris 12 h 25 → Shanghai 7 h 00 le lendemain ne fait pas 18 h 35 de
 * vol, il y a sept heures de décalage entre les deux fuseaux. Un temps de vol
 * exigerait le décalage horaire de chaque escale, à chaque date, changement
 * d'heure compris — donc une donnée que nous n'avons pas. La durée d'une escale,
 * elle, est juste : les deux horaires sont pris au même aéroport.
 */
import type { Flight, FlightSegment } from '../types'

/** Une escale : l'aéroport, et le battement quand il est calculable. */
export type Escale = {
  place: string
  /** Minutes entre l'atterrissage et le décollage suivant. */
  minutes?: number
}

export type Itineraire = {
  /** Aéroports du trajet complet : ceux du premier et du dernier tronçon. */
  from?: string
  to?: string
  departureDate?: string
  departureTime?: string
  arrivalDate?: string
  arrivalTime?: string
  escales: Escale[]
  /** « China Eastern MU554 », dans l'ordre des tronçons. Vide si non renseigné. */
  references: string[]
  /**
   * Toutes les dates que ce vol touche, décollage et atterrissage compris.
   * C'est ce que la vue « Aujourd'hui » interroge : un vol de nuit concerne deux
   * journées, et ne l'afficher que le jour du décollage le ferait disparaître le
   * jour où l'on atterrit.
   */
  dates: string[]
  segments: FlightSegment[]
}

const HORAIRE = /^(\d{1,2}):(\d{2})$/

function enMinutes(heure: string | undefined): number | undefined {
  const trouve = heure ? HORAIRE.exec(heure) : null
  return trouve ? Number(trouve[1]) * 60 + Number(trouve[2]) : undefined
}

/**
 * Battement d'une escale, en minutes.
 *
 * `undefined` dès qu'un horaire manque, et aussi quand l'escale enjambe minuit :
 * la soustraction donnerait alors un nombre négatif, et un faux battement est
 * pire qu'un battement absent.
 */
function battement(avant: FlightSegment, apres: FlightSegment): number | undefined {
  const arrivee = enMinutes(avant.arrivalTime)
  const depart = enMinutes(apres.departureTime)
  const jourArrivee = avant.arrivalDate ?? avant.date
  if (arrivee === undefined || depart === undefined) return undefined
  if (jourArrivee === undefined || apres.date === undefined) return undefined
  if (jourArrivee !== apres.date) return undefined
  return depart - arrivee
}

/** Dates distinctes, dans l'ordre. Format AAAA-MM-JJ : l'ordre alphabétique suffit. */
function dates(valeurs: Array<string | undefined>): string[] {
  const connues = valeurs.filter((valeur): valeur is string => Boolean(valeur))
  return [...new Set(connues)].sort((a, b) => a.localeCompare(b))
}

export function itineraire(vol: Flight): Itineraire {
  const segments = vol.segments ?? []

  // Vol direct, ou vol dont les tronçons ne sont pas encore connus : les champs
  // du vol lui-même font office d'itinéraire.
  if (segments.length === 0) {
    return {
      from: vol.from,
      to: vol.to,
      departureDate: vol.date,
      departureTime: vol.departureTime,
      arrivalDate: vol.arrivalDate ?? vol.date,
      arrivalTime: vol.arrivalTime,
      escales: [],
      references: vol.airline && vol.number ? [`${vol.airline} ${vol.number}`] : [],
      dates: dates([vol.date, vol.arrivalDate]),
      segments,
    }
  }

  const premier = segments[0]
  const dernier = segments[segments.length - 1]

  return {
    from: premier.from,
    to: dernier.to,
    departureDate: premier.date,
    departureTime: premier.departureTime,
    arrivalDate: dernier.arrivalDate ?? dernier.date,
    arrivalTime: dernier.arrivalTime,
    escales: segments.slice(0, -1).map((segment, index) => ({
      place: segment.to,
      minutes: battement(segment, segments[index + 1]),
    })),
    references: segments.map((segment) => `${segment.airline} ${segment.number}`),
    dates: dates(segments.flatMap((segment) => [segment.date, segment.arrivalDate])),
    segments,
  }
}

/** Vrai si ce vol concerne la date donnée, décollage ou atterrissage. */
export function volDuJour(vol: Flight, date: string): boolean {
  return itineraire(vol).dates.includes(date)
}

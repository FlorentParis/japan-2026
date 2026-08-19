/**
 * CONTRÔLE D'INTÉGRITÉ des données.
 *
 * Objectif : qu'une faute de frappe dans un identifiant, un trajet qui ne
 * raccorde pas, ou une étape sans trajet se voient tout de suite — plutôt que
 * de produire silencieusement un trou dans la carte ou un total faux.
 *
 * Le résultat est affiché en clair dans le site quand il n'est pas vide.
 */
import { DESTINATIONS } from '../data/destinations'
import { JOURNEYS } from '../data/journeys'
import { PLACES } from '../data/places'
import { PHOTOS } from '../data/photos.generated'
import { NUITS_ANNONCEES, PASSES } from '../data/trip'
import { daysInclusive } from './format'

export type IntegrityIssue = {
  level: 'error' | 'warning'
  message: string
  where: string
}

export function checkIntegrity(): IntegrityIssue[] {
  const issues: IntegrityIssue[] = []
  const error = (where: string, message: string) =>
    issues.push({ level: 'error', message, where })
  const warn = (where: string, message: string) =>
    issues.push({ level: 'warning', message, where })

  // ── Étapes ──────────────────────────────────────────────────────────────
  const destIds = new Set<string>()
  DESTINATIONS.forEach((d, i) => {
    if (destIds.has(d.id)) error(d.id, 'Identifiant d’étape en double.')
    destIds.add(d.id)
    if (d.order !== i + 1) {
      error(d.id, `Numéro d’ordre ${d.order} alors que l’étape est en position ${i + 1}.`)
    }
    if (d.photoId && !PHOTOS[d.photoId]) {
      warn(d.id, `Photo « ${d.photoId} » absente de photos.generated.ts.`)
    }
  })

  // ── Dates et nuits ──────────────────────────────────────────────────────
  // Le calendrier est une chaîne : on quitte une étape le jour où l'on arrive à
  // la suivante. Un trou ou un chevauchement signifie une nuit non attribuée, ou
  // deux hôtels réservés la même nuit — c'est exactement ce qu'il faut voir tout
  // de suite plutôt que de le découvrir sur place.
  DESTINATIONS.forEach((d, i) => {
    const { start, end } = d.dates
    if (!start) return

    if (end && end < start) {
      error(d.id, `Dates inversées : départ le ${end}, arrivée le ${start}.`)
    }

    const nights = d.nights?.count
    if (start && end && nights !== undefined) {
      const attendu = daysInclusive(start, end) - 1
      if (attendu !== nights) {
        error(
          d.id,
          `${nights} nuit(s) déclarée(s) mais ${attendu} entre le ${start} et le ${end}.`,
        )
      }
    }
    if (d.stay === 'day' && nights !== undefined && nights > 0) {
      error(d.id, 'Étape « dans la journée » avec des nuits déclarées.')
    }
    if (d.stay === 'overnight' && nights === 0) {
      error(d.id, 'Étape « nuit sur place » avec zéro nuit déclarée.')
    }

    const suivant = DESTINATIONS[i + 1]
    if (suivant?.dates.start && end && suivant.dates.start !== end) {
      const [tort, ecart] =
        suivant.dates.start > end
          ? ['Trou dans le calendrier', `du ${end} au ${suivant.dates.start}`]
          : ['Chevauchement de dates', `${suivant.dates.start} avant le départ du ${end}`]
      error(d.id, `${tort} : ${suivant.name} commence ${ecart}.`)
    }
  })

  const nuitsTotal = DESTINATIONS.reduce((sum, d) => sum + (d.nights?.count ?? 0), 0)
  if (DESTINATIONS.some((d) => d.nights) && nuitsTotal !== NUITS_ANNONCEES) {
    error(
      'nuits',
      `${nuitsTotal} nuits au total, alors que la table fournie en annonce ${NUITS_ANNONCEES}.`,
    )
  }

  // ── Trajets : un par intervalle entre deux étapes consécutives ──────────
  if (JOURNEYS.length !== DESTINATIONS.length - 1) {
    error(
      'journeys',
      `${JOURNEYS.length} trajets pour ${DESTINATIONS.length} étapes : il en faut exactement ${DESTINATIONS.length - 1}.`,
    )
  }

  const legIds = new Set<string>()
  JOURNEYS.forEach((j, i) => {
    const expectedFrom = DESTINATIONS[i]?.id
    const expectedTo = DESTINATIONS[i + 1]?.id
    if (j.fromDestination !== expectedFrom || j.toDestination !== expectedTo) {
      error(
        j.id,
        `Le trajet relie ${j.fromDestination} → ${j.toDestination}, or à cette position on attend ${expectedFrom} → ${expectedTo}.`,
      )
    }
    if (j.legs.length === 0) error(j.id, 'Trajet sans aucun tronçon : rien à tracer sur la carte.')

    j.legs.forEach((leg, k) => {
      if (legIds.has(leg.id)) error(leg.id, 'Identifiant de tronçon en double.')
      legIds.add(leg.id)
      if (!PLACES[leg.fromPlace]) error(leg.id, `Lieu de départ inconnu : « ${leg.fromPlace} ».`)
      if (!PLACES[leg.toPlace]) error(leg.id, `Lieu d’arrivée inconnu : « ${leg.toPlace} ».`)

      // Continuité : on ne doit jamais « téléporter » entre deux tronçons.
      const previous = j.legs[k - 1]
      if (previous && previous.toPlace !== leg.fromPlace) {
        error(
          leg.id,
          `Discontinuité : le tronçon précédent arrive à « ${previous.toPlace} » et celui-ci part de « ${leg.fromPlace} ».`,
        )
      }
    })

    for (const c of j.connections ?? []) {
      if (!PLACES[c.place]) warn(j.id, `Correspondance sur un lieu inconnu : « ${c.place} ».`)
    }
  })

  // ── Pass ────────────────────────────────────────────────────────────────
  for (const pass of PASSES) {
    for (const legId of pass.coveredLegs) {
      if (!legIds.has(legId)) {
        error(pass.id, `Le pass référence un tronçon inexistant : « ${legId} ».`)
      }
    }
  }

  return issues
}

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
import { NUITS_ANNONCEES, PASSES, TRANSFERS } from '../data/trip'
import type { Leg } from '../types'
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
  // Le numéro d'ordre n'est plus vérifié : il est déduit de la position dans
  // `ETAPES`, il ne peut donc plus se désaccorder.
  DESTINATIONS.forEach((d) => {
    if (destIds.has(d.id)) error(d.id, 'Identifiant d’étape en double.')
    destIds.add(d.id)
    if (d.photoId && !PHOTOS[d.photoId]) {
      warn(d.id, `Photo « ${d.photoId} » absente de photos.generated.ts.`)
    }
  })

  // ── Activités et spécialités ────────────────────────────────────────────
  // L'identifiant d'une activité est aussi la clé de sa photo dans `PHOTOS` : un
  // doublon ferait afficher l'image d'un lieu sous le nom d'un autre. C'est
  // précisément la confusion que l'on refuse, d'où une erreur et non un
  // avertissement.
  const sujetIds = new Map<string, string>()
  DESTINATIONS.forEach((d) => {
    const sujets = [
      ...d.activities.map((a) => ({
        id: a.id,
        name: a.name,
        quoi: 'activité',
        cherchee: a.photoQuery !== undefined,
      })),
      ...(d.specialities ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        quoi: 'spécialité',
        cherchee: s.photoQuery !== undefined,
      })),
    ]

    for (const sujet of sujets) {
      const ailleurs = sujetIds.get(sujet.id)
      if (ailleurs) {
        error(
          d.id,
          `Identifiant « ${sujet.id} » déjà utilisé par ${ailleurs} : les deux partageraient la même photo.`,
        )
      }
      sujetIds.set(sujet.id, `${d.id} (${sujet.quoi} « ${sujet.name} »)`)
    }

    // Une recherche déclarée mais sans photo enregistrée : l'entrée s'affiche
    // sans image — jamais avec celle d'un autre lieu. C'est un manque, pas une
    // faute : on le signale sans bloquer.
    //
    // Une entrée sans `photoQuery` du tout n'est pas signalée : c'est une
    // décision, pas un oubli (une œuvre sous droits, par exemple, pour laquelle
    // aucune image libre n'existe).
    const sansPhoto = sujets.filter((s) => s.cherchee && !PHOTOS[s.id])
    if (sansPhoto.length > 0) {
      warn(
        d.id,
        `${sansPhoto.length} entrée(s) sans photo trouvée : ${sansPhoto
          .map((s) => s.name)
          .join(', ')}. Affiner le \`photoQuery\` puis relancer \`npm run photos\`.`,
      )
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

  /**
   * Les contrôles qui valent pour tout tronçon, qu'il appartienne à un trajet
   * d'étape à étape ou à un transfert d'aéroport : identifiant unique, lieux
   * connus, et continuité de la chaîne. Les transferts sont soumis aux mêmes
   * règles — c'est aussi ce qui fait exister leurs identifiants pour le contrôle
   * des pass, plus bas.
   */
  const verifierTroncons = (where: string, legs: Leg[]) => {
    legs.forEach((leg, k) => {
      if (legIds.has(leg.id)) error(leg.id, 'Identifiant de tronçon en double.')
      legIds.add(leg.id)
      if (!PLACES[leg.fromPlace]) error(leg.id, `Lieu de départ inconnu : « ${leg.fromPlace} ».`)
      if (!PLACES[leg.toPlace]) error(leg.id, `Lieu d’arrivée inconnu : « ${leg.toPlace} ».`)

      // Continuité : on ne doit jamais « téléporter » entre deux tronçons.
      const previous = legs[k - 1]
      if (previous && previous.toPlace !== leg.fromPlace) {
        error(
          leg.id,
          `Discontinuité : le tronçon précédent arrive à « ${previous.toPlace} » et celui-ci part de « ${leg.fromPlace} ».`,
        )
      }
    })
    if (legs.length === 0) error(where, 'Aucun tronçon : rien à tracer ni à chiffrer.')
  }

  JOURNEYS.forEach((j, i) => {
    const expectedFrom = DESTINATIONS[i]?.id
    const expectedTo = DESTINATIONS[i + 1]?.id
    if (j.fromDestination !== expectedFrom || j.toDestination !== expectedTo) {
      error(
        j.id,
        `Le trajet relie ${j.fromDestination} → ${j.toDestination}, or à cette position on attend ${expectedFrom} → ${expectedTo}.`,
      )
    }
    verifierTroncons(j.id, j.legs)

    for (const c of j.connections ?? []) {
      if (!PLACES[c.place]) warn(j.id, `Correspondance sur un lieu inconnu : « ${c.place} ».`)
    }
  })

  // ── Transferts d'aéroport ───────────────────────────────────────────────
  // Ils ne font pas partie de la chaîne des étapes : rien à vérifier côté
  // enchaînement, seulement leurs tronçons.
  const transferIds = new Set<string>()
  for (const t of TRANSFERS) {
    if (transferIds.has(t.id)) error(t.id, 'Identifiant de transfert en double.')
    transferIds.add(t.id)
    verifierTroncons(t.id, t.legs)
  }

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

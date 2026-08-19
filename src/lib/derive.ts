/**
 * SÉLECTEURS — tout ce qui est calculé.
 *
 * Aucun total n'est écrit à la main nulle part dans le site : distances, coûts,
 * compteurs, verdict du pass et liste des données manquantes sont tous dérivés
 * des fichiers de `src/data/`. Modifier un prix dans les données met à jour
 * l'ensemble du site, sans risque de laisser un chiffre périmé quelque part.
 */
import { DESTINATIONS } from '../data/destinations'
import { ALL_LEGS, JOURNEYS } from '../data/journeys'
import { PASSES, TRIP } from '../data/trip'
import type { Certainty, Destination, Journey, Leg, RailPass, TransportMode } from '../types'
import { addDays, daysInclusive } from './format'
import { journeyDistanceKm, legDistanceKm } from './geo'
import { MODE_ORDER } from './modes'

// ─── Transports ──────────────────────────────────────────────────────────────

export type ModeTotals = {
  mode: TransportMode
  legs: number
  km: number
  jpy: number
  /** Nombre de legs dont le prix est inclus dans un billet porté par un autre leg. */
  includedLegs: number
  /** Nombre de legs dont le tarif est dû mais non relevé : le total est sous-estimé. */
  unpricedLegs: number
}

/** Un tronçon qui a bien un tarif à payer, mais dont le montant n'est pas relevé. */
const sansTarif = (leg: Leg) => leg.cost !== undefined && leg.cost.jpy === undefined

export function totalsByMode(): ModeTotals[] {
  return MODE_ORDER.map((mode) => {
    const legs = ALL_LEGS.filter(({ leg }) => leg.mode === mode)
    return {
      mode,
      legs: legs.length,
      km: legs.reduce((sum, { leg }) => sum + legDistanceKm(leg), 0),
      jpy: legs.reduce((sum, { leg }) => sum + (leg.cost?.jpy ?? 0), 0),
      includedLegs: legs.filter(({ leg }) => !leg.cost).length,
      unpricedLegs: legs.filter(({ leg }) => sansTarif(leg)).length,
    }
  }).filter((t) => t.legs > 0)
}

/** Coût estimé de tous les trajets inter-étapes, par personne. */
export function totalTransportJpy(): number {
  return ALL_LEGS.reduce((sum, { leg }) => sum + (leg.cost?.jpy ?? 0), 0)
}

/**
 * Tronçons dont le tarif est déclaré mais pas renseigné.
 *
 * À distinguer de ceux qui n'ont aucun `cost` : ceux-là sont inclus dans un
 * billet porté par un autre tronçon (forfait de la route alpine, billet direct
 * Hakata → Nagasaki). Ici, au contraire, il y a bien un prix à payer et il
 * manque — c'est ce qui rend le total des transports incomplet, et le site doit
 * le dire au lieu de compter zéro en silence.
 */
export function unpricedLegs(): Leg[] {
  return ALL_LEGS.filter(({ leg }) => sansTarif(leg)).map(({ leg }) => leg)
}

/**
 * Jour où un déplacement est effectué : le jour du départ de l'étape d'origine,
 * qui est aussi le jour d'arrivée à l'étape suivante. C'est cette date qui
 * permet de confronter les trajets JR à la validité d'un pass, laquelle
 * s'exprime en jours consécutifs.
 */
export function journeyDate(journey: Journey): string | undefined {
  const from = DESTINATIONS.find((d) => d.id === journey.fromDestination)
  return from?.dates.end ?? from?.dates.start
}

export function totalDistanceKm(): number {
  return JOURNEYS.reduce((sum, j) => sum + journeyDistanceKm(j), 0)
}

/** Temps passé en transport entre les étapes, hors correspondances. */
export function totalTravelMinutes(): number {
  return ALL_LEGS.reduce((sum, { leg }) => sum + (leg.duration?.minutes ?? 0), 0)
}

export function journeyTotals(journey: Journey) {
  return {
    minutes: journey.legs.reduce((s, l) => s + (l.duration?.minutes ?? 0), 0),
    jpy: journey.legs.reduce((s, l) => s + (l.cost?.jpy ?? 0), 0),
    km: journeyDistanceKm(journey),
    /** Une durée n'est complète que si tous les legs en ont une. */
    minutesComplete: journey.legs.every((l) => l.duration),
    /**
     * Tronçons dont le tarif est dû mais non relevé. Tant que ce nombre n'est
     * pas nul, le montant ci-dessus est un minorant : à afficher comme tel et
     * jamais comme un prix, surtout quand il vaut zéro.
     */
    unpriced: journey.legs.filter(sansTarif).length,
  }
}

// ─── Vue d'ensemble ──────────────────────────────────────────────────────────

export function overview() {
  const totals = totalsByMode()
  const byMode = (mode: TransportMode) => totals.find((t) => t.mode === mode)?.legs ?? 0

  return {
    destinations: DESTINATIONS.length,
    /** Étapes distinctes : Tokyo compte une fois, même en apparaissant deux fois. */
    uniquePlaces: new Set(DESTINATIONS.map((d) => d.name)).size,
    journeys: JOURNEYS.length,
    legs: ALL_LEGS.length,
    trainLegs: byMode('shinkansen') + byMode('train'),
    shinkansenLegs: byMode('shinkansen'),
    ferryLegs: byMode('ferry'),
    flightLegs: byMode('plane'),
    busLegs: byMode('bus'),
    ropewayLegs: byMode('ropeway'),
    km: totalDistanceKm(),
    travelMinutes: totalTravelMinutes(),
    transportJpy: totalTransportJpy(),
    /** Hébergements à trouver : les étapes avec nuit ou au statut encore indécis. */
    staysToBook: DESTINATIONS.filter(
      (d) => d.stay !== 'day' && d.accommodation.status === 'todo',
    ).length,
    bookedStays: DESTINATIONS.filter((d) => d.accommodation.status === 'confirmed').length,
    nightsKnown: DESTINATIONS.every((d) => d.nights !== undefined),
    nights: totalNights(),
    datesKnown: DESTINATIONS.some((d) => d.dates.start),
    /** Tronçons sans tarif relevé : rend le total des transports incomplet. */
    unpricedLegs: unpricedLegs().length,
  }
}

/** Somme des nuits déclarées sur les étapes. */
export function totalNights(): number {
  return DESTINATIONS.reduce((sum, d) => sum + (d.nights?.count ?? 0), 0)
}

/**
 * Durée du séjour en jours, déduite des dates saisies.
 * `undefined` tant qu'aucune date n'est renseignée : on n'invente pas de durée.
 */
export function tripDays(): number | undefined {
  const starts = DESTINATIONS.map((d) => d.dates.start).filter((v): v is string => Boolean(v))
  const ends = DESTINATIONS.map((d) => d.dates.end ?? d.dates.start).filter(
    (v): v is string => Boolean(v),
  )
  if (starts.length === 0 || ends.length === 0) return undefined
  // Les dates sont au format AAAA-MM-JJ : l'ordre alphabétique est l'ordre chronologique.
  const byDate = (a: string, b: string) => a.localeCompare(b)
  const first = [...starts].sort(byDate)[0]
  const last = [...ends].sort(byDate).at(-1) as string
  return daysInclusive(first, last)
}

// ─── Hébergement ─────────────────────────────────────────────────────────────

export function accommodationTotals() {
  const withPrice = DESTINATIONS.filter((d) => d.accommodation.price?.jpy !== undefined)
  const jpy = withPrice.reduce((s, d) => s + (d.accommodation.price?.jpy ?? 0), 0)
  const nights = withPrice.reduce((s, d) => s + (d.accommodation.nights ?? 0), 0)
  return {
    jpy,
    nights,
    perNight: nights > 0 ? jpy / nights : undefined,
    /** Nombre d'étapes dont le prix d'hébergement manque encore. */
    missing: DESTINATIONS.filter(
      (d) => d.stay !== 'day' && d.accommodation.price?.jpy === undefined,
    ).length,
    complete:
      withPrice.length > 0 &&
      DESTINATIONS.every((d) => d.stay === 'day' || d.accommodation.price?.jpy !== undefined),
  }
}

// ─── Activités ───────────────────────────────────────────────────────────────

export function activityTotals() {
  const all = DESTINATIONS.flatMap((d) => d.activities)
  return {
    count: all.length,
    jpy: all.reduce((s, a) => s + (a.price?.jpy ?? 0), 0),
    withoutPrice: all.filter((a) => a.price?.jpy === undefined).length,
  }
}

// ─── Pass ferroviaires ───────────────────────────────────────────────────────

/** Un déplacement daté, vu du point de vue d'un pass. */
export type PassJourney = {
  journeyId: string
  label: string
  date: string
  /** Coût des tronçons que ce pass couvrirait sur ce déplacement. */
  jpy: number
  legs: number
  /** Tronçons couverts dont le tarif n'est pas renseigné : l'économie est donc sous-estimée. */
  unpriced: number
}

/** La meilleure période de validité possible pour un pass, dates à l'appui. */
export type PassWindow = {
  start: string
  end: string
  journeys: PassJourney[]
  jpy: number
  /** Tronçons couverts sans tarif renseigné dans cette fenêtre. */
  unpriced: number
}

export type PassVerdict = {
  passId: string
  name: string
  days: number
  passJpy: number
  /** Coût de tous les trajets que ce pass couvre, toutes dates confondues. */
  coveredJpy: number
  /** La meilleure fenêtre de `days` jours consécutifs. `undefined` sans dates. */
  window?: PassWindow
  /** Coût couvert dans cette fenêtre : le seul montant comparable au prix du pass. */
  windowJpy: number
  /** Positif = le pass ferait économiser sur sa meilleure fenêtre. */
  savingJpy: number
  /** Trajets JR qui tombent hors de la fenêtre, à payer à l'unité. */
  outsideJpy: number
  /** Le pass ne vaut que sur des jours consécutifs : sans dates, pas de verdict. */
  conclusive: boolean
}

/** Les déplacements datés qu'un pass donné couvrirait, dans l'ordre du voyage. */
function passJourneys(pass: RailPass): PassJourney[] {
  const out: PassJourney[] = []
  for (const journey of JOURNEYS) {
    const date = journeyDate(journey)
    const legs = journey.legs.filter(
      (leg) => leg.passCoverage === 'covered' && pass.coveredLegs.includes(leg.id),
    )
    if (!date || legs.length === 0) continue
    out.push({
      journeyId: journey.id,
      label: journeyLabel(journey),
      date,
      jpy: legs.reduce((s, leg) => s + (leg.cost?.jpy ?? 0), 0),
      legs: legs.length,
      unpriced: legs.filter(sansTarif).length,
    })
  }
  return out
}

/**
 * La fenêtre de validité la plus rentable.
 *
 * On n'essaie pas toutes les dates de l'année : une fenêtre optimale commence
 * forcément un jour de trajet, sinon on gaspille son premier jour. Il suffit
 * donc de tester chaque jour de déplacement comme date de début.
 */
function bestWindow(pass: RailPass): PassWindow | undefined {
  const journeys = passJourneys(pass)
  if (journeys.length === 0) return undefined

  let best: PassWindow | undefined
  for (const candidate of journeys) {
    const start = candidate.date
    const end = addDays(start, pass.days - 1)
    // Les dates sont en AAAA-MM-JJ : la comparaison de chaînes est chronologique.
    const inside = journeys.filter((j) => j.date >= start && j.date <= end)
    const jpy = inside.reduce((s, j) => s + j.jpy, 0)
    if (!best || jpy > best.jpy) {
      best = {
        start,
        end,
        journeys: inside,
        jpy,
        unpriced: inside.reduce((s, j) => s + j.unpriced, 0),
      }
    }
  }
  return best
}

export function passAnalysis() {
  const covered = ALL_LEGS.filter(({ leg }) => leg.passCoverage === 'covered')
  const notCovered = ALL_LEGS.filter(({ leg }) => leg.passCoverage === 'not-covered')
  const coveredJpy = covered.reduce((s, { leg }) => s + (leg.cost?.jpy ?? 0), 0)
  const notCoveredJpy = notCovered.reduce((s, { leg }) => s + (leg.cost?.jpy ?? 0), 0)

  const verdicts: PassVerdict[] = PASSES.map((pass) => {
    const passCovered = covered.filter(({ leg }) => pass.coveredLegs.includes(leg.id))
    const passCoveredJpy = passCovered.reduce((s, { leg }) => s + (leg.cost?.jpy ?? 0), 0)
    const window = bestWindow(pass)
    // Sans dates il n'y a pas de fenêtre : on retombe sur la comparaison brute,
    // et `conclusive: false` interdit à l'UI de la présenter comme un verdict.
    const windowJpy = window ? window.jpy : passCoveredJpy
    return {
      passId: pass.id,
      name: pass.name,
      days: pass.days,
      passJpy: pass.price.jpy ?? 0,
      coveredJpy: passCoveredJpy,
      window,
      windowJpy,
      savingJpy: windowJpy - (pass.price.jpy ?? 0),
      outsideJpy: passCoveredJpy - windowJpy,
      conclusive: window !== undefined,
    }
  })

  /** Déplacements datés empruntant le réseau JR national : la base de comparaison. */
  const jrTrips = passJourneys(PASSES[0])
  // Format AAAA-MM-JJ : l'ordre alphabétique est l'ordre chronologique.
  const jrDates = jrTrips.map((j) => j.date).sort((a, b) => a.localeCompare(b))
  /** Étalement des trajets JR, du premier au dernier, en jours. */
  const jrSpanDays =
    jrDates.length > 0 ? daysInclusive(jrDates[0], jrDates.at(-1) as string) : undefined

  return {
    coveredLegs: covered.map(({ leg }) => leg),
    notCoveredLegs: notCovered.map(({ leg }) => leg),
    coveredJpy,
    notCoveredJpy,
    /** Tronçons couverts dont le tarif manque : l'analyse les compte pour zéro. */
    unpricedCovered: covered.filter(({ leg }) => sansTarif(leg)).length,
    /** Étalement des trajets JR, en jours : à comparer aux 7 / 14 / 21 jours des pass. */
    jrSpanDays,
    /** Nombre de déplacements datés qui empruntent le réseau JR national. */
    jrJourneys: jrTrips.length,
    verdicts,
    conclusive: verdicts.every((v) => v.conclusive),
    best: verdicts.reduce((a, b) => (b.savingJpy > a.savingJpy ? b : a), verdicts[0]),
  }
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export type BudgetInputs = {
  travellers: number
  /** Durée du séjour en jours. Inconnue tant que les dates ne sont pas saisies. */
  days: number
  foodPerDayPerPerson: number
  activitiesPerDayPerPerson: number
  localTransportPerDayPerPerson: number
  /** Prix du pass retenu, 0 si aucun. */
  passJpy: number
}

export type BudgetLine = {
  id: string
  label: string
  detail: string
  icon: string
  jpy: number
  certainty: Certainty
  /** `true` quand la ligne dépend d'une donnée encore manquante. */
  incomplete: boolean
  /**
   * Nombre de données manquantes qui minorent le montant sans l'annuler.
   * Le montant reste affiché — c'est un ordre de grandeur utile — mais préfixé
   * d'un « ≥ » : il ne doit jamais passer pour un total complet.
   */
  partial: number
}

export function budget(inputs: BudgetInputs) {
  const { travellers, days } = inputs
  const acc = accommodationTotals()
  const act = activityTotals()
  const transport = totalTransportJpy()
  const perDay = (amount: number) => amount * Math.max(days, 0) * travellers

  const lines: BudgetLine[] = [
    {
      id: 'transport',
      label: 'Transports entre les étapes',
      // Le montant reste affiché même s'il est incomplet : le masquer priverait
      // d'un ordre de grandeur utile. Ce qui manque est dit dans le détail.
      detail:
        unpricedLegs().length > 0
          ? `${ALL_LEGS.length} tronçons, dont ${unpricedLegs().length} sans tarif relevé et donc non comptés`
          : `${ALL_LEGS.length} tronçons — Shinkansen, trains, bus, ferries, vol, câbles`,
      icon: '🚄',
      jpy: transport * travellers,
      certainty: 'estimate',
      incomplete: false,
      partial: unpricedLegs().length,
    },
    {
      id: 'pass',
      label: 'Pass ferroviaire',
      detail: inputs.passJpy > 0
        ? 'Pass sélectionné dans la section Transports'
        : 'Aucun pass retenu — billets à l’unité',
      icon: '🎫',
      jpy: inputs.passJpy * travellers,
      certainty: 'estimate',
      incomplete: false,
      partial: 0,
    },
    {
      id: 'accommodation',
      label: 'Hébergement',
      detail: acc.complete
        ? `${acc.nights} nuits réservées`
        : `${acc.missing} étape(s) sans hébergement renseigné`,
      icon: '🏨',
      jpy: acc.jpy,
      certainty: acc.complete ? 'confirmed' : 'todo',
      incomplete: !acc.complete,
      partial: 0,
    },
    {
      id: 'activities',
      label: 'Visites & activités',
      detail:
        act.count === 0
          ? 'Aucune activité renseignée pour l’instant'
          : `${act.count} activités, dont ${act.withoutPrice} sans prix`,
      icon: '⛩️',
      jpy: act.jpy + perDay(inputs.activitiesPerDayPerPerson),
      certainty: 'estimate',
      incomplete: days === 0,
      // Les activités listées sans prix minorent la ligne, sans l'invalider :
      // le forfait journalier ci-dessus reste, lui, entièrement compté.
      partial: act.withoutPrice,
    },
    {
      id: 'food',
      label: 'Repas',
      detail: `${inputs.foodPerDayPerPerson.toLocaleString('fr-FR')} ¥ / jour / personne`,
      icon: '🍜',
      jpy: perDay(inputs.foodPerDayPerPerson),
      certainty: 'estimate',
      incomplete: days === 0,
      partial: 0,
    },
    {
      id: 'local',
      label: 'Transports locaux',
      detail: 'Métro, bus urbains, consignes, IC card',
      icon: '🚇',
      jpy: perDay(inputs.localTransportPerDayPerPerson),
      certainty: 'estimate',
      incomplete: days === 0,
      partial: 0,
    },
  ]

  const total = lines.reduce((s, l) => s + l.jpy, 0)
  return {
    lines,
    total,
    perPerson: travellers > 0 ? total / travellers : total,
    perDay: days > 0 ? total / days : undefined,
    /** Vrai dès qu'une ligne repose sur une donnée manquante. */
    incomplete: lines.some((l) => l.incomplete),
    /** Nombre de données chiffrées manquantes : le total est un minorant. */
    partial: lines.reduce((s, l) => s + l.partial, 0),
  }
}

// ─── Données manquantes ──────────────────────────────────────────────────────

export type Gap = {
  id: string
  label: string
  /** Où corriger, chemin de fichier relatif. */
  file: string
  scope: string
  severity: 'blocking' | 'nice-to-have'
}

/**
 * Inventaire de tout ce qui reste à renseigner.
 * C'est ce qui permet d'afficher des « à compléter » honnêtes plutôt que des
 * zéros, et de savoir exactement quoi éditer.
 */
export function gaps(): Gap[] {
  const out: Gap[] = []

  if (!DESTINATIONS.some((d) => d.dates.start)) {
    out.push({
      id: 'dates',
      label:
        'Aucune date renseignée : la timeline reste ordonnée par étape, le budget par jour et le verdict du pass ne peuvent pas être calculés.',
      file: 'src/data/destinations.ts',
      scope: 'Tout le voyage',
      severity: 'blocking',
    })
  }

  const unpriced = unpricedLegs()
  if (unpriced.length > 0) {
    out.push({
      id: 'fares',
      label: `${unpriced.length} tronçon(s) sans tarif relevé (${unpriced
        .map((leg) => leg.service ?? leg.id)
        .join(', ')}) : le total des transports et l’analyse du pass sont donc incomplets.`,
      file: 'src/data/journeys.ts',
      scope: 'Transports',
      severity: 'blocking',
    })
  }

  for (const d of DESTINATIONS) {
    if (d.stay !== 'day' && d.accommodation.status === 'todo') {
      out.push({
        id: `hotel-${d.id}`,
        label: 'Hébergement à renseigner (nom, prix, nombre de nuits)',
        file: 'src/data/destinations.ts',
        scope: d.name,
        severity: 'blocking',
      })
    }
    if (d.activitiesStatus === 'todo') {
      out.push({
        id: `activities-${d.id}`,
        label: 'Aucune activité renseignée',
        file: 'src/data/destinations.ts',
        scope: d.name,
        severity: 'nice-to-have',
      })
    }
    if (d.stay === 'unknown') {
      out.push({
        id: `stay-${d.id}`,
        label: 'Nuit sur place ou visite dans la journée ? Non tranché',
        file: 'src/data/destinations.ts',
        scope: d.name,
        severity: 'blocking',
      })
    }
  }

  if (TRIP.travellers?.certainty === 'todo') {
    out.push({
      id: 'travellers',
      label: 'Nombre de voyageurs inconnu — réglable dans la section Budget',
      file: 'src/data/trip.ts',
      scope: 'Budget',
      severity: 'nice-to-have',
    })
  }

  if (TRIP.flights.some((f) => f.certainty === 'todo')) {
    out.push({
      id: 'flights',
      label: 'Vols internationaux non renseignés',
      file: 'src/data/trip.ts',
      scope: 'Arrivée & départ',
      severity: 'nice-to-have',
    })
  }

  return out
}

/** Toutes les alertes du voyage, regroupées pour la section « à vérifier ». */
export function allWarnings() {
  const fromDestinations = DESTINATIONS.flatMap((d) =>
    (d.warnings ?? []).map((text) => ({ scope: d.name, text, kind: 'destination' as const })),
  )
  const fromJourneys = JOURNEYS.flatMap((j) =>
    (j.warnings ?? []).map((text) => ({
      scope: journeyLabel(j),
      text,
      kind: 'journey' as const,
    })),
  )
  return [...fromDestinations, ...fromJourneys]
}

// ─── Petits utilitaires partagés ─────────────────────────────────────────────

export function journeyLabel(journey: Journey): string {
  const from = DESTINATIONS.find((d) => d.id === journey.fromDestination)
  const to = DESTINATIONS.find((d) => d.id === journey.toDestination)
  return `${from?.name ?? journey.fromDestination} → ${to?.name ?? journey.toDestination}`
}

export function journeyOf(legId: string): Journey | undefined {
  return JOURNEYS.find((j) => j.legs.some((l) => l.id === legId))
}

export function legById(legId: string): Leg | undefined {
  return ALL_LEGS.find(({ leg }) => leg.id === legId)?.leg
}

/** Le trajet qui mène à une étape, et celui qui en repart. */
export function journeysAround(destination: Destination) {
  return {
    arrival: JOURNEYS.find((j) => j.toDestination === destination.id),
    departure: JOURNEYS.find((j) => j.fromDestination === destination.id),
  }
}

/** Les modes de transport utilisés pour rejoindre une étape. */
export function modesUsed(journey: Journey): TransportMode[] {
  return [...new Set(journey.legs.map((l) => l.mode))]
}

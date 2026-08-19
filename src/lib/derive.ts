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
import { GALLERY_COUNTS, PHOTOS } from '../data/photos.generated'
import { PASSES, TRIP } from '../data/trip'
import type { Certainty, Destination, Journey, Leg, RailPass, TransportMode } from '../types'
import { addDays, daysInclusive, moneyJpy } from './format'
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
    /** Étapes qui n'ont encore aucune proposition. */
    destinationsSansActivite: DESTINATIONS.filter((d) => d.activities.length === 0).length,
    /** Combien de ces propositions sont des suggestions et non des choix du voyageur. */
    proposees: DESTINATIONS.filter((d) => d.activitiesStatus === 'estimate').reduce(
      (s, d) => s + d.activities.length,
      0,
    ),
    /** Activités affichées sans image : la recherche Commons n'a rien donné d'exploitable. */
    sansPhoto: all.filter((a) => !PHOTOS[a.id]).length,
  }
}

export function specialityTotals() {
  const all = DESTINATIONS.flatMap((d) => d.specialities ?? [])
  return {
    count: all.length,
    destinations: DESTINATIONS.filter((d) => (d.specialities?.length ?? 0) > 0).length,
    /** Spécialités sans photo trouvée : l'entrée existe, l'image manque. */
    sansPhoto: all.filter((s) => !PHOTOS[s.id]).length,
  }
}

/**
 * Nombre de photos disponibles pour une étape, pour afficher un compteur honnête.
 *
 * Lit `GALLERY_COUNTS` et non `GALLERIES` : dix-huit nombres suffisent, et cela
 * évite d'entraîner les 160 ko de galeries dans le lot chargé au démarrage. Le
 * détail des galeries vit dans `lib/galleries.ts`, réservé à la vue Photos.
 */
export function galleryCount(destId: string): number {
  return GALLERY_COUNTS[destId] ?? 0
}

// ─── Vols et transferts d'aéroport ───────────────────────────────────────────

/**
 * Ce que coûtent les billets d'avion.
 *
 * Seuls les vols qui portent un `price` sont comptés, et un aller-retour acheté
 * d'un bloc ne le porte qu'une fois. Le vol intérieur Nagasaki → Tokyo n'en
 * porte pas : c'est un tronçon de l'itinéraire (`j16`), déjà compté dans la
 * ligne « transports ». Le compter ici aussi le facturerait deux fois.
 *
 * La donnée d'origine est en euros, devise d'achat. La conversion en yens n'existe
 * que parce que les totaux du site s'additionnent en yens.
 */
export function flightTotals() {
  const priced = TRIP.flights.filter((f) => f.price !== undefined)
  return {
    count: TRIP.flights.length,
    priced: priced.length,
    jpy: priced.reduce((s, f) => s + (moneyJpy(f.price) ?? 0), 0),
    eur: priced.reduce((s, f) => s + (f.price?.eur ?? 0), 0),
    /** Vrai si chaque prix déclaré est un montant confirmé, pas une estimation. */
    allConfirmed:
      priced.length > 0 && priced.every((f) => f.price?.certainty === 'confirmed'),
    /** Prix déclarés mais sans montant : le total serait alors un minorant. */
    unpriced: priced.filter((f) => moneyJpy(f.price) === undefined).length,
  }
}

/** Coût des transferts aéroport ⇄ ville, hors trajets d'étape à étape. */
export function transferTotals() {
  const transfers = TRIP.transfers ?? []
  const legs = transfers.flatMap((t) => t.legs)
  return {
    count: transfers.length,
    legs: legs.length,
    jpy: legs.reduce((s, l) => s + (l.cost?.jpy ?? 0), 0),
    unpriced: legs.filter(sansTarif).length,
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

/**
 * Tout ce qui se déplace à une date connue : les déplacements d'étape à étape
 * *et* les transferts d'aéroport.
 *
 * Un pass ne fait pas la différence entre un Narita Express et un Shinkansen :
 * il couvre, ou il ne couvre pas. Laisser le transfert d'arrivée hors de
 * l'analyse aurait sous-estimé chaque pass du tarif entier du N'EX — exactement
 * le genre de minoration silencieuse que le reste du site s'interdit.
 *
 * C'est le seul calcul où les transferts entrent : ils restent hors de la carte,
 * des totaux par mode et de la ligne « transports » du budget, où ils ne sont pas
 * des déplacements d'étape à étape.
 */
function datedMovements(): Array<{ id: string; label: string; date?: string; legs: Leg[] }> {
  return [
    ...JOURNEYS.map((j) => ({
      id: j.id,
      label: journeyLabel(j),
      date: journeyDate(j),
      legs: j.legs,
    })),
    ...(TRIP.transfers ?? []).map((t) => ({
      id: t.id,
      label: t.label,
      date: t.date,
      legs: t.legs,
    })),
  ]
}

/** Les mêmes, aplatis : la base de comparaison de `passAnalysis`. */
function datedLegs(): Leg[] {
  return datedMovements().flatMap((m) => m.legs)
}

/** Les déplacements datés qu'un pass donné couvrirait, dans l'ordre chronologique. */
function passJourneys(pass: RailPass): PassJourney[] {
  const out: PassJourney[] = []
  for (const movement of datedMovements()) {
    const { date } = movement
    const legs = movement.legs.filter(
      (leg) => leg.passCoverage === 'covered' && pass.coveredLegs.includes(leg.id),
    )
    if (!date || legs.length === 0) continue
    out.push({
      journeyId: movement.id,
      label: movement.label,
      date,
      jpy: legs.reduce((s, leg) => s + (leg.cost?.jpy ?? 0), 0),
      legs: legs.length,
      unpriced: legs.filter(sansTarif).length,
    })
  }
  // Les transferts sont ajoutés après les trajets : on remet dans l'ordre du
  // calendrier, seul ordre qui ait un sens face à une validité en jours
  // consécutifs. Format AAAA-MM-JJ : comparer les chaînes suffit.
  return out.sort((a, b) => a.date.localeCompare(b.date))
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
  // Sur la même base que `passJourneys` : trajets d'étape à étape et transferts
  // d'aéroport. Sur deux bases différentes, `windowJpy` pourrait dépasser
  // `coveredJpy` et rendre `outsideJpy` négatif.
  const all = datedLegs()
  const covered = all.filter((leg) => leg.passCoverage === 'covered')
  const notCovered = all.filter((leg) => leg.passCoverage === 'not-covered')
  const coveredJpy = covered.reduce((s, leg) => s + (leg.cost?.jpy ?? 0), 0)
  const notCoveredJpy = notCovered.reduce((s, leg) => s + (leg.cost?.jpy ?? 0), 0)

  const verdicts: PassVerdict[] = PASSES.map((pass) => {
    const passCovered = covered.filter((leg) => pass.coveredLegs.includes(leg.id))
    const passCoveredJpy = passCovered.reduce((s, leg) => s + (leg.cost?.jpy ?? 0), 0)
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
    coveredLegs: covered,
    notCoveredLegs: notCovered,
    coveredJpy,
    notCoveredJpy,
    /** Tronçons couverts dont le tarif manque : l'analyse les compte pour zéro. */
    unpricedCovered: covered.filter(sansTarif).length,
    /** Étalement des trajets JR, en jours : à comparer aux 7 / 14 / 21 jours des pass. */
    jrSpanDays,
    /** Nombre de déplacements datés qui empruntent le réseau JR national. */
    jrJourneys: jrTrips.length,
    verdicts,
    conclusive: verdicts.every((v) => v.conclusive),
    best: verdicts.reduce((a, b) => (b.savingJpy > a.savingJpy ? b : a), verdicts[0]),
  }
}

/**
 * Ce qu'un pass rend inutile de payer au billet, ventilé par ligne de budget.
 *
 * Sans cette déduction, choisir un pass dans le budget ferait payer deux fois les
 * mêmes trajets : une fois au tarif du billet dans la ligne « transports », une
 * fois dans le prix du pass. C'est une surestimation, symétrique des
 * sous-estimations que le reste du site s'attache à signaler, et pas plus juste.
 *
 * La déduction est prudente : les tronçons couverts sans tarif relevé comptent
 * pour zéro, donc on déduit moins que la réalité — jamais plus.
 */
export function passSavings(passId: string | undefined) {
  const vide = { journeysJpy: 0, transfersJpy: 0, legs: 0, unpriced: 0 }
  const pass = PASSES.find((p) => p.id === passId)
  if (!pass) return vide
  const window = bestWindow(pass)
  if (!window) return vide

  const transferIds = new Set((TRIP.transfers ?? []).map((t) => t.id))
  const somme = (garder: (id: string) => boolean) =>
    window.journeys.filter((j) => garder(j.journeyId)).reduce((s, j) => s + j.jpy, 0)

  return {
    journeysJpy: somme((id) => !transferIds.has(id)),
    transfersJpy: somme((id) => transferIds.has(id)),
    legs: window.journeys.reduce((s, j) => s + j.legs, 0),
    unpriced: window.unpriced,
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
  /**
   * Identifiant du pass retenu, s'il y en a un. Sert à retirer des lignes
   * « transports » et « transferts » les trajets que ce pass couvre déjà :
   * sans cela, ils seraient payés deux fois.
   */
  passId?: string
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
  const flights = flightTotals()
  const transfers = transferTotals()
  const couvertParLePass = passSavings(inputs.passId)
  const transport = totalTransportJpy() - couvertParLePass.journeysJpy
  const perDay = (amount: number) => amount * Math.max(days, 0) * travellers

  const lines: BudgetLine[] = [
    {
      // La seule ligne du budget qui repose sur un chiffre payé. Elle est en
      // tête parce que c'est aussi la plus grosse, et de loin.
      id: 'flights',
      label: 'Vols internationaux',
      detail: flights.allConfirmed
        ? 'Billet aller-retour acheté — le seul montant ferme du budget. Le vol intérieur Nagasaki → Tokyo est compté dans la ligne des transports.'
        : 'Prix des vols internationaux à renseigner',
      icon: '✈️',
      jpy: flights.jpy * travellers,
      certainty: flights.allConfirmed ? 'confirmed' : 'todo',
      incomplete: flights.priced === 0,
      partial: flights.unpriced,
    },
    {
      id: 'transfers',
      label: 'Transferts d’aéroport',
      detail:
        couvertParLePass.transfersJpy > 0
          ? `${transfers.legs} tronçon(s) : Narita → Tokyo à l’arrivée, Tokyo → Haneda au départ. Le Narita Express est déduit, le pass retenu le couvre.`
          : `${transfers.legs} tronçon(s) : Narita → Tokyo à l’arrivée, Tokyo → Haneda au départ. Ils ne relient pas deux étapes, d’où cette ligne à part.`,
      icon: '🚉',
      jpy: (transfers.jpy - couvertParLePass.transfersJpy) * travellers,
      certainty: 'estimate',
      incomplete: false,
      partial: transfers.unpriced,
    },
    {
      id: 'transport',
      label: 'Transports entre les étapes',
      // Le montant reste affiché même s'il est incomplet : le masquer priverait
      // d'un ordre de grandeur utile. Ce qui manque est dit dans le détail.
      detail: [
        unpricedLegs().length > 0
          ? `${ALL_LEGS.length} tronçons, dont ${unpricedLegs().length} sans tarif relevé et donc non comptés`
          : `${ALL_LEGS.length} tronçons — Shinkansen, trains, bus, ferries, vol, câbles`,
        couvertParLePass.journeysJpy > 0 &&
          'Les trajets que le pass retenu couvre sur sa meilleure fenêtre d’activation sont déduits : ils sont déjà payés par le pass',
      ]
        .filter(Boolean)
        .join('. '),
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

  // Les activités et les spécialités sont des propositions, pas des choix du
  // voyageur : ce qui manque ici, c'est son arbitrage — et les tarifs réels, qui
  // ne seront relevés que pour les lieux retenus.
  const propositions = activityTotals()
  const gourmandises = specialityTotals()
  if (propositions.proposees > 0) {
    out.push({
      id: 'activities-choice',
      label: `${propositions.proposees} activités et ${gourmandises.count} spécialités proposées, aucune encore retenue ni chiffrée : les tarifs seront relevés pour les lieux choisis.`,
      file: 'src/data/destinations.ts',
      scope: 'Activités',
      severity: 'nice-to-have',
    })
  }

  // Les horaires et le prix des vols internationaux sont fournis, mais pas la
  // compagnie ni les numéros de vol : sans eux, aucun horaire n'est vérifiable.
  const volsSansReference = TRIP.flights.filter((f) => !f.airline || !f.number)
  if (volsSansReference.length > 0) {
    out.push({
      id: 'flights',
      label: `${volsSansReference.length} vol(s) sans compagnie ni numéro : les horaires sont pris tels qu’ils ont été donnés, sans moyen de les recouper.`,
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
  const fromTransfers = (TRIP.transfers ?? []).flatMap((t) =>
    (t.warnings ?? []).map((text) => ({ scope: t.label, text, kind: 'transfer' as const })),
  )
  return [...fromDestinations, ...fromJourneys, ...fromTransfers]
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

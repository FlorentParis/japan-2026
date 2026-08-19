/** Mise en forme : argent, durées, dates, distances. */
import type { Certainty, Duration, Money, PassCoverage, StayKind } from '../types'

/**
 * Taux de change indicatif, pour l'affichage en euros uniquement.
 * Toutes les données sont stockées en yens : changer ce chiffre ne modifie
 * aucune donnée, seulement la conversion affichée.
 */
export const JPY_PER_EUR = 165

export type Currency = 'jpy' | 'eur'

const jpyFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
})

const eurFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function formatAmount(jpy: number, currency: Currency): string {
  return currency === 'jpy' ? jpyFmt.format(jpy) : eurFmt.format(jpy / JPY_PER_EUR)
}

/**
 * Montant en yens d'une somme, quelle que soit sa devise d'origine.
 *
 * Les totaux du site s'additionnent en yens. Une dépense payée en euros doit
 * donc être convertie pour entrer dans une somme — mais la donnée exacte reste
 * l'euro : voir `formatMoney`, qui la réaffiche telle quelle.
 */
export function moneyJpy(money: Money | undefined): number | undefined {
  if (money?.jpy !== undefined) return money.jpy
  if (money?.eur !== undefined) return Math.round(money.eur * JPY_PER_EUR)
  return undefined
}

/**
 * `undefined` et les montants `todo` renvoient un tiret : jamais de zéro trompeur.
 *
 * Un montant payé en euros est affiché en euros à l'identique — c'est le chiffre
 * réel — et converti seulement si l'on demande des yens.
 */
export function formatMoney(money: Money | undefined, currency: Currency): string {
  if (money?.eur !== undefined && currency === 'eur') return eurFmt.format(money.eur)
  const jpy = moneyJpy(money)
  if (jpy === undefined) return '—'
  return formatAmount(jpy, currency)
}

/**
 * Somme à laquelle il manque des tarifs.
 *
 * Un total incomplet qui tombe à zéro n'est pas « gratuit », il est inconnu :
 * on affiche un tiret. S'il reste une partie chiffrée, le « ≥ » dit que le vrai
 * montant est plus élevé — jamais un chiffre présenté comme complet.
 */
export function formatPartialAmount(jpy: number, missing: number, currency: Currency): string {
  if (missing === 0) return formatAmount(jpy, currency)
  if (jpy === 0) return '—'
  return `≥ ${formatAmount(jpy, currency)}`
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${String(m).padStart(2, '0')}`
}

/**
 * Une heure d'horloge « HH:MM » à la française : « 8 h 40 », « 12 h ».
 *
 * Même rendu que `formatMinutes` — un décollage à 8 h 40 et un trajet de 8 h 40
 * s'écrivent pareil en français, autant n'avoir qu'une seule mise en forme.
 */
export function formatTime(hhmm: string | undefined): string | undefined {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '')
  if (!match) return undefined
  return formatMinutes(Number(match[1]) * 60 + Number(match[2]))
}

export function formatDuration(duration: Duration | undefined): string {
  return duration ? formatMinutes(duration.minutes) : '—'
}

export function formatKm(km: number): string {
  return `${Math.round(km).toLocaleString('fr-FR')} km`
}

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' })
const DATE_ANNEE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Toutes les dates du site sont des chaînes `AAAA-MM-JJ`. On les lit à midi :
 * à minuit, un décalage horaire d'une heure suffirait à changer le jour affiché.
 */
const jour = (iso: string) => new Date(`${iso}T12:00:00`)

export function formatDateRange(start?: string, end?: string): string | undefined {
  if (!start) return undefined
  const from = DATE_FMT.format(jour(start))
  if (!end || end === start) return from
  return `${from} → ${DATE_FMT.format(jour(end))}`
}

/** Comme `formatDateRange`, mais avec l'année — pour les titres et les en-têtes. */
export function formatPeriod(start?: string, end?: string): string | undefined {
  if (!start) return undefined
  if (!end || end === start) return DATE_ANNEE_FMT.format(jour(start))
  return `${DATE_FMT.format(jour(start))} → ${DATE_ANNEE_FMT.format(jour(end))}`
}

/** Décale une date ISO de N jours et renvoie une date ISO. */
export function addDays(iso: string, days: number): string {
  const date = jour(iso)
  date.setDate(date.getDate() + days)
  const mois = String(date.getMonth() + 1).padStart(2, '0')
  const quantieme = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mois}-${quantieme}`
}

/** Nombre de jours entre deux dates ISO, bornes incluses. */
export function daysInclusive(start: string, end: string): number {
  const ms = jour(end).getTime() - jour(start).getTime()
  return Math.round(ms / 86_400_000) + 1
}

export const CERTAINTY_LABEL: Record<Certainty, string> = {
  confirmed: 'Confirmé',
  estimate: 'Estimation',
  todo: 'À compléter',
}

export const CERTAINTY_HINT: Record<Certainty, string> = {
  confirmed: 'Information fournie et arrêtée : réservation, billet, date confirmée.',
  estimate: 'Relevé sur une source publique ou calculé — à vérifier avant le départ.',
  todo: 'Information manquante. À renseigner dans les fichiers de src/data/.',
}

export const PASS_COVERAGE_LABEL: Record<PassCoverage, string> = {
  covered: 'Couvert par un JR Pass',
  'not-covered': 'Hors pass JR',
  partial: 'Partiellement couvert',
  unknown: 'Couverture à vérifier',
}

export const PASS_COVERAGE_SHORT: Record<PassCoverage, string> = {
  covered: 'JR Pass',
  'not-covered': 'Hors pass',
  partial: 'Partiel',
  unknown: '?',
}

export const STAY_LABEL: Record<StayKind, string> = {
  overnight: 'Nuit sur place',
  day: 'Dans la journée',
  transit: 'Passage',
  unknown: 'Nuit à trancher',
}

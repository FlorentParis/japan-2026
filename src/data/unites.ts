/**
 * Fabriques de montants et de durées, partagées par les fichiers de données.
 *
 * Elles vivaient dans `journeys.ts`, où elles ont servi seules longtemps. Les
 * transferts d'aéroport de `trip.ts` en ont désormais besoin aussi : les mettre
 * ici évite d'en écrire une deuxième copie, et surtout évite qu'une copie
 * change de convention sans l'autre — le `certainty: 'estimate'` par défaut est
 * une décision de fond, pas un détail.
 */
import type { Money } from '../types'

/** Tarif estimé, en yens, par personne. */
export const yen = (jpy: number, note?: string): Money => ({
  jpy,
  certainty: 'estimate',
  note,
  scope: 'per-person',
})

/** Tarif non relevé. Volontairement sans montant : mieux vaut un trou qu’un chiffre faux. */
export const tarifACompleter = (note: string): Money => ({
  certainty: 'todo',
  note,
  scope: 'per-person',
})

/** Durée estimée, en minutes. */
export const mins = (minutes: number, note?: string) =>
  ({ minutes, certainty: 'estimate' as const, note })

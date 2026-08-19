/**
 * MÉTADONNÉES DU VOYAGE + pass ferroviaires candidats.
 *
 * Les pass listés ici servent à répondre honnêtement à une seule question :
 * « au vu des trajets JR estimés, un pass est-il rentable ? » — sans jamais
 * présenter l'économie comme certaine, puisqu'elle repose sur des tarifs
 * estimés. Depuis que les dates sont connues, l'analyse tient compte de la
 * validité en jours consécutifs (voir `passAnalysis` dans `lib/derive.ts`) :
 * elle ne suppose plus que tous les trajets JR tiennent dans le pass.
 */
import type { RailPass, Trip } from '../types'

/** Legs couverts par un pass JR national : tout ce qui roule sur le réseau JR. */
const JR_NATIONAL_LEGS = [
  'j01.1', // Azusa
  'j06.1', // Hokuriku Shinkansen
  'j08.9', // ligne Ōito
  'j08.10', // Ltd. Exp. Shinano
  'j09.1', // Shinano
  'j09.2', // Tōkaidō/San'yō Shinkansen
  'j09.3', // ligne San'yō
  'j10.1',
  'j10.2',
  'j11.1',
  'j11.2', // ligne Uno
  'j13.1', // Ltd. Exp. Ishizuchi (tarif non relevé)
  'j14.1', // Ltd. Exp. Shiokaze (tarif non relevé)
  'j14.2', // San'yō Shinkansen
  'j15.1', // Relay Kamome (billet direct)
  'j15.2', // Shinkansen Kamome
]

export const PASSES: RailPass[] = [
  {
    id: 'jr-pass-7',
    name: 'JR Pass national — 7 jours',
    days: 7,
    price: {
      jpy: 50000,
      certainty: 'estimate',
      note: 'tarif ordinaire depuis la hausse d’octobre 2023, à revérifier avant achat',
      scope: 'per-person',
    },
    scope:
      'Tout le réseau JR (Shinkansen hors Nozomi et Mizuho, express, omnibus), sur 7 jours consécutifs.',
    coveredLegs: JR_NATIONAL_LEGS,
    url: 'https://www.japanrailpass.net/fr/',
  },
  {
    id: 'jr-pass-14',
    name: 'JR Pass national — 14 jours',
    days: 14,
    price: {
      jpy: 80000,
      certainty: 'estimate',
      note: 'tarif ordinaire, à revérifier avant achat',
      scope: 'per-person',
    },
    scope: 'Idem, sur 14 jours consécutifs.',
    coveredLegs: JR_NATIONAL_LEGS,
    url: 'https://www.japanrailpass.net/fr/',
  },
  {
    id: 'jr-pass-21',
    name: 'JR Pass national — 21 jours',
    days: 21,
    price: {
      jpy: 100000,
      certainty: 'estimate',
      note: 'tarif ordinaire, à revérifier avant achat',
      scope: 'per-person',
    },
    scope: 'Idem, sur 21 jours consécutifs.',
    coveredLegs: JR_NATIONAL_LEGS,
    url: 'https://www.japanrailpass.net/fr/',
  },
]

/**
 * Pass régionaux pertinents pour ce parcours précis. Les tarifs ne sont pas
 * renseignés volontairement : je ne veux pas avancer un chiffre dont je ne suis
 * pas sûr. À compléter depuis les sites officiels.
 */
export const REGIONAL_PASS_CANDIDATES = [
  {
    name: 'Takayama–Hokuriku Area Tourist Pass',
    scope:
      'Nagoya/Osaka ⇄ Takayama ⇄ Shirakawa-gō (bus inclus) ⇄ Kanazawa, 5 jours. Couvrirait les bus Takayama → Shirakawa-gō → Kanazawa des 13 et 14 novembre, qu’aucun pass JR ne couvre.',
    price: { certainty: 'todo' as const },
    url: 'https://touristpass.jp/fr/takayama_hokuriku/',
  },
  {
    name: 'JR West San’yō–San’in Area Pass',
    scope:
      'Osaka ⇄ Okayama ⇄ Hiroshima ⇄ Hakata, 7 jours, Nozomi inclus. Recouvre la séquence Kurashiki → Hiroshima → Uno, puis le Shinkansen vers Fukuoka : du 20 au 27 novembre, soit 8 jours — un de trop, à regarder de près.',
    price: { certainty: 'todo' as const },
    url: 'https://www.westjr.co.jp/global/fr/ticket/pass/sanyo_sanin/',
  },
  {
    name: 'All Shikoku Rail Pass',
    scope:
      'Réseau JR Shikoku et compagnies privées de l’île. Couvrirait Takamatsu → Matsuyama, et Matsuyama → Okayama jusqu’à Kojima seulement (au-delà du pont de Seto, c’est JR West). Pertinent pour les deux trajets dont le tarif n’est pas relevé.',
    price: { certainty: 'todo' as const },
    url: 'https://shikoku-railwaytrip.com/railpass.html',
  },
  {
    name: 'Tateyama Kurobe Alpine Route — forfait de traversée',
    scope:
      'Ce n’est pas un pass JR : c’est le billet unique de la route alpine, indispensable et jamais couvert par un pass ferroviaire.',
    price: { certainty: 'todo' as const },
    url: 'https://www.alpen-route.com/en/',
  },
]

/**
 * Total de nuits annoncé dans la table de dates fournie par le voyageur.
 * Il sert de garde-fou : `checkIntegrity()` compare la somme des nuits des
 * étapes à ce chiffre et crie si une modification future les désaccorde.
 */
export const NUITS_ANNONCEES = 29

export const TRIP: Trip = {
  title: 'Traversée du Japon',
  subtitle: 'Des Alpes japonaises à Kyūshū, par la mer intérieure de Seto',
  period: { start: '2026-11-06', end: '2026-12-05', certainty: 'confirmed' },
  travellers: { count: 1, certainty: 'todo' },
  heroPhotoId: 'kamikochi',
  flights: [
    {
      label: 'Vol intérieur retour',
      from: 'Nagasaki (NGS)',
      to: 'Tokyo Haneda (HND)',
      date: '2026-12-02',
      certainty: 'estimate',
      note: 'Date fixée par l’itinéraire. Compagnie, horaire et aéroport d’arrivée à confirmer.',
    },
    {
      label: 'Vols internationaux',
      from: '—',
      to: '—',
      certainty: 'todo',
      note: 'Non fournis. À caler sur les dates du séjour : arrivée le 6 novembre, retour le 5 décembre 2026.',
    },
  ],
  passes: PASSES,
  budgetDefaults: {
    foodPerDayPerPerson: 4000,
    activitiesPerDayPerPerson: 2000,
    localTransportPerDayPerPerson: 800,
  },
}

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
import type { RailPass, Transfer, Trip } from '../types'
import { mins, yen } from './unites'

/** Legs couverts par un pass JR national : tout ce qui roule sur le réseau JR. */
const JR_NATIONAL_LEGS = [
  't-arrivee.1', // Narita Express, le 6 novembre
  'j01.1', // Azusa
  'j06.1', // Hokuriku Shinkansen
  'j08b.1', // ligne Ōito
  'j08b.2', // Ltd. Exp. Shinano
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
 * TRANSFERTS D'AÉROPORT.
 *
 * Ils encadrent le voyage sans en faire partie : ils ne relient pas deux étapes,
 * mais un aéroport à Tokyo. Ils ne sont donc pas dessinés sur la carte des
 * déplacements et ne comptent pas dans les totaux par mode — ils ont leur propre
 * ligne de budget et leur propre bloc dans la vue Transports.
 *
 * Ils entrent en revanche dans l'analyse des pass : le Narita Express est couvert
 * par le JR Pass national, et l'oublier sous-estimerait l'intérêt du pass.
 *
 * ⚠️ Les tarifs sont des tarifs publics relevés en ligne, pas des billets achetés.
 */
export const TRANSFERS: Transfer[] = [
  {
    id: 't-arrivee',
    label: 'Aéroport de Narita → Tokyo',
    date: '2026-11-06',
    legs: [
      {
        id: 't-arrivee.1',
        mode: 'train',
        fromPlace: 'narita',
        toPlace: 'tokyo',
        service: 'JR Narita Express (N’EX)',
        line: 'Ligne Narita',
        duration: mins(60, 'hors formalités d’entrée et récupération des bagages'),
        cost: yen(3140, 'tarif adulte aller simple vers Tokyo Station, relevé sur japan-guide.com'),
        passCoverage: 'covered',
        via: [
          [140.1900, 35.7000], // Chiba
          [139.9000, 35.6800], // Funabashi
        ],
        note: 'Le N’EX est intégralement couvert par le JR Pass national. Il dessert aussi Shinagawa et Shinjuku, d’où part le train du 8 pour Matsumoto : le tarif vers Shinjuku est légèrement supérieur et n’a pas été relevé.',
      },
    ],
    warnings: [
      'Atterrissage à 12 h 00. Compter 45 à 60 min de formalités d’entrée et de bagages, puis 1 h de N’EX : arrivée dans Tokyo vers 14 h 30 au plus tôt.',
      'Alternatives non retenues, relevées sur japan-guide.com : Keisei Skyliner vers Ueno (40 min, 2 580 ¥, hors pass JR), Access Express (75–90 min, 1 060 ¥), bus TYO-NRT (65 min, 1 500 ¥). Le N’EX est retenu parce qu’il est le seul couvert par un pass JR.',
      'Le N’EX est à sièges réservés : réservation gratuite mais obligatoire, à faire au comptoir JR de l’aéroport en arrivant.',
      'L’hôtel des deux premières nuits est maintenant réservé, à Azumabashi : le N’EX s’arrête à la gare de Tokyo, il reste donc un dernier tronçon jusqu’à Asakusa. Son tarif n’a pas été relevé et n’est pas compté ici — même convention que le trajet vers Hamamatsuchō au départ. Le Keisei Access Express (1 060 ¥, ci-dessus) dessert Asakusa sans changement, mais il est hors pass JR.',
    ],
  },
  {
    id: 't-depart',
    label: 'Tokyo → Aéroport de Haneda',
    date: '2026-12-05',
    legs: [
      {
        id: 't-depart.1',
        mode: 'train',
        fromPlace: 'hamamatsucho',
        toPlace: 'haneda',
        service: 'Tokyo Monorail, Haneda Express',
        duration: mins(13, 'Haneda Express, service le plus rapide'),
        cost: yen(520, 'tarif adulte aller simple vers les terminaux 1, 2 et 3, relevé sur tokyo-monorail.co.jp'),
        passCoverage: 'unknown',
        via: [[139.7660, 35.5900]], // baie de Tokyo
        note: 'Le trajet jusqu’à Hamamatsuchō dépend de l’hôtel, encore à renseigner : il n’est donc pas compté. La couverture du Tokyo Monorail par le JR Pass est à vérifier — elle est sans effet ici, aucun pass n’étant retenu à cette date.',
      },
    ],
    warnings: [
      'Vol international à 8 h 40 : enregistrement à fermer vers 7 h 40, donc être au terminal 3 vers 6 h 40 au plus tard. Il faut quitter le centre de Tokyo autour de 6 h 00.',
      'À VÉRIFIER, c’est la contrainte la plus serrée du voyage : l’heure du premier monorail depuis Hamamatsuchō. Elle n’est pas indiquée sur le site de l’opérateur et je ne l’ai pas relevée. Si le premier départ est trop tardif, il faut un taxi ou une nuit près de l’aéroport.',
      'Alternative à vérifier : la ligne Keikyū depuis Shinagawa, qui a ses propres premiers départs.',
    ],
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
      label: 'Vol international aller',
      from: 'Europe — aéroport de départ à préciser',
      to: 'Tokyo Narita (NRT)',
      date: '2026-11-06',
      arrivalTime: '12:00',
      certainty: 'confirmed',
      price: {
        eur: 1103,
        certainty: 'confirmed',
        scope: 'per-person',
        note: 'Billet acheté : 1 103 € pour l’aller-retour. Le prix est porté par l’aller, le retour n’en porte aucun — sinon il serait compté deux fois. Le `scope` est « par personne » : à passer à « total » si ces 1 103 € couvrent plusieurs voyageurs.',
      },
      note: 'Atterrissage à Narita à 12 h 00, donnée fournie. Aéroport de départ, compagnie et numéro de vol non fournis.',
    },
    {
      label: 'Vol intérieur retour',
      from: 'Nagasaki (NGS)',
      to: 'Tokyo Haneda (HND)',
      date: '2026-12-02',
      certainty: 'estimate',
      note: 'Date déduite de l’itinéraire, pas fournie. Le vol international repartant de Haneda, l’aéroport d’arrivée est maintenant fixé : Haneda. Compagnie et horaire à confirmer.',
    },
    {
      label: 'Vol international retour',
      from: 'Tokyo Haneda (HND)',
      to: 'Europe — aéroport d’arrivée à préciser',
      date: '2026-12-05',
      departureTime: '08:40',
      certainty: 'confirmed',
      note: 'Décollage de Haneda à 8 h 40, donnée fournie. Aucun prix ici : il est porté par l’aller, le billet étant un aller-retour. Voir l’avertissement du transfert vers Haneda — c’est l’horaire le plus contraignant du voyage.',
    },
  ],
  transfers: TRANSFERS,
  passes: PASSES,
  budgetDefaults: {
    foodPerDayPerPerson: 4000,
    activitiesPerDayPerPerson: 2000,
    localTransportPerDayPerPerson: 800,
  },
}

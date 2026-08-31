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
  'j13.1', // Ltd. Exp. Ishizuchi (tarif estimé à 6 000 ¥, sans source)
  'j14.1', // Ltd. Exp. Shiokaze (tarif estimé à 6 000 ¥, sans source)
  'j14.2', // San'yō Shinkansen
  'j15.1', // Relay Kamome (billet direct)
  'j15.2', // Shinkansen Kamome
  't-depart.1', // Tokyo Monorail, le 5 décembre — voir la note du transfert
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
 * Pass régionaux pertinents pour ce parcours précis.
 *
 * Les tarifs sont désormais relevés sur les sites officiels des opérateurs, avec
 * la source dans chaque note. Ils restent des ESTIMATIONS au sens du site : un
 * tarif public n'est pas un billet acheté, et ces grilles changent — celle du JR
 * Pass national a augmenté de 70 % en octobre 2023.
 *
 * Ils ne sont pas pris en compte dans le calcul de rentabilité : `passAnalysis()`
 * ne compare que les pass de `PASSES`, dont les tronçons couverts sont
 * inventoriés un par un. Faire de même ici demanderait de relever, pour chaque
 * pass régional, la liste exacte de ses tronçons — travail utile, mais qui n'est
 * pas fait. La liste ci-dessous est donc une piste chiffrée, pas un verdict.
 */
export const REGIONAL_PASS_CANDIDATES = [
  {
    name: 'Takayama–Hokuriku Area Tourist Pass',
    scope:
      'Nagoya/Osaka ⇄ Takayama ⇄ Shirakawa-gō (bus inclus) ⇄ Kanazawa, 5 jours. Couvrirait les bus Takayama → Shirakawa-gō → Kanazawa des 13 et 14 novembre, qu’aucun pass JR ne couvre.',
    price: {
      jpy: 19800,
      certainty: 'estimate' as const,
      scope: 'per-person' as const,
      note: 'tarif adulte relevé sur touristpass.jp (enfant 9 900 ¥), 5 jours consécutifs. Inclut les bus Takayama ⇄ Shirakawa-gō ⇄ Kanazawa/Toyama, réservation obligatoire, et 6 réservations de siège gratuites sur les express et le Shinkansen Hokuriku.',
    },
    url: 'https://touristpass.jp/fr/takayama_hokuriku/',
  },
  {
    name: 'JR West San’yō–San’in Area Pass',
    scope:
      'Osaka ⇄ Okayama ⇄ Hiroshima ⇄ Hakata, 7 jours. Recouvre la séquence Kurashiki → Hiroshima → Uno, puis le Shinkansen vers Fukuoka : du 20 au 27 novembre, soit 8 jours — un de trop, à regarder de près.',
    price: {
      jpy: 23000,
      certainty: 'estimate' as const,
      scope: 'per-person' as const,
      note: 'tarif adulte relevé sur westjr.co.jp (enfant 11 500 ¥), 7 jours consécutifs, sièges réservés inclus sur le Shinkansen San’yō entre Shin-Ōsaka et Hakata. La page ne dit pas si le Nozomi est admis : à vérifier avant achat, notre itinéraire n’en emprunte pas.',
    },
    url: 'https://www.westjr.co.jp/global/fr/ticket/pass/sanyo_sanin/',
  },
  {
    name: 'All Shikoku Rail Pass — 3 jours',
    scope:
      'Réseau JR Shikoku et compagnies privées de l’île. Couvrirait Takamatsu → Matsuyama, et Matsuyama → Okayama jusqu’à Kojima seulement (au-delà du pont de Seto, c’est JR West). C’est la piste la plus intéressante : ce sont précisément les deux trajets dont aucune grille ne publie le tarif, et dont les 6 000 ¥ inscrits sont un ordre de grandeur, pas un relevé.',
    price: {
      jpy: 12500,
      certainty: 'estimate' as const,
      scope: 'per-person' as const,
      note: 'tarif adulte 3 jours relevé sur shikoku-railwaytrip.com (4 jours 15 500 ¥, 5 jours 17 500 ¥, 7 jours 20 500 ¥ ; 500 ¥ de moins à l’achat depuis l’étranger). Sièges non réservés uniquement, et rien au nord de Kojima vers Okayama. ⚠️ À partir du 1er octobre 2026, le ferry de Shōdoshima et le bus Olive n’y sont plus inclus.',
    },
    url: 'https://shikoku-railwaytrip.com/railpass.html',
  },
  {
    name: 'Tateyama Kurobe Alpine Route — traversée complète',
    scope:
      'Ce n’est pas un pass JR : c’est le prix de la traversée, indispensable et jamais couvert par un pass ferroviaire. Le montant ci-contre couvre tout le trajet du 17 novembre, de Dentetsu-Toyama à Shinano-Ōmachi — soit les tronçons j07 et j08 réunis.',
    price: {
      jpy: 14010,
      certainty: 'estimate' as const,
      scope: 'per-person' as const,
      note: 'somme des huit tarifs de tronçon publiés par japan-guide.com : Toyama Chihō 1 420 ¥, funiculaire de Tateyama 1 090 ¥, bus d’altitude 3 000 ¥, bus du tunnel 2 200 ¥, téléphérique 1 700 ¥, funiculaire de Kurobe 1 150 ¥, bus du Kanden 1 800 ¥, bus Ōgizawa → Shinano-Ōmachi 1 650 ¥. Le forfait officiel de la partie alpine (Tateyama → Ōgizawa) vaut donc 10 940 ¥. Le calculateur du site officiel est en JavaScript et n’a pas pu être relevé.',
    },
    url: 'https://www.alpen-route.com/en/fare/',
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
        cost: yen(520, 'tarif adulte aller simple vers les terminaux 1, 2 et 3, relevé sur tokyo-monorail.co.jp et confirmé par japan-guide.com'),
        passCoverage: 'covered',
        via: [[139.7660, 35.5900]], // baie de Tokyo
        note: 'Le trajet jusqu’à Hamamatsuchō dépend de l’hôtel, encore à renseigner : il n’est donc pas compté. Le Tokyo Monorail appartient à JR East et est intégralement couvert par le JR Pass national (source : japan-guide.com/e/e2430.html) — il entre donc dans l’analyse de rentabilité des pass, ce qui n’était pas le cas tant que la couverture restait inconnue.',
      },
    ],
    warnings: [
      'Vol international à 8 h 40 : enregistrement à fermer vers 7 h 40, donc être au terminal 3 vers 6 h 40 au plus tard. Il faut quitter le centre de Tokyo autour de 6 h 00.',
      'Premier monorail : la première arrivée à Haneda est à 5 h 12 (japan-guide.com/e/e2430.html), soit un départ de Hamamatsuchō vers 4 h 50. Le départ de 6 h 00 tient donc largement — ce point, longtemps le plus serré du voyage, n’en est plus un. Reste à vérifier l’horaire exact du jour sur le site de l’opérateur, un 5 décembre en semaine.',
      'Alternative : la ligne Keikyū depuis Shinagawa, 330 ¥ et 20 min, première arrivée à Haneda 5 h 27. Moins chère mais hors pass JR — et le monorail, lui, est couvert.',
      'La durée retenue ici est celle du Haneda Express, 13 min. Le service ordinaire met 20 min (japan-guide) : prendre la marge la plus large tant que l’horaire du jour n’est pas vérifié.',
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
  /**
   * Le SÉJOUR AU JAPON, pas le voyage porte à porte.
   *
   * L'avion quitte Paris le 5 novembre et atterrit à Narita le 6 : le voyage dure
   * donc un jour de plus que la période ci-dessous. C'est volontaire — cette
   * période est celle que tout le site compte : 30 jours, 29 nuits, les dates des
   * étapes, la durée du budget, l'étalement des trajets JR. L'y faire entrer le
   * 5 novembre ajouterait un jour sans étape et une nuit passée en avion, et
   * désaccorderait `tripDays()` (déduit des étapes) de cette période.
   *
   * Le 5 novembre n'est pas perdu pour autant : le vol le porte, et la vue
   * « Aujourd'hui » compte ses jours restants jusqu'au décollage de Paris, pas
   * jusqu'à l'arrivée au Japon (voir `departDeLaMaison()` dans `lib/aujourdhui.ts`).
   */
  period: { start: '2026-11-06', end: '2026-12-05', certainty: 'confirmed' },
  travellers: { count: 1, certainty: 'confirmed' },
  heroPhotoId: 'kamikochi',
  flights: [
    {
      label: 'Vol international aller',
      certainty: 'confirmed',
      // Deux avions, deux numéros, une escale : d'où les tronçons. Les bornes du
      // trajet (Paris 12 h 25 → Narita 12 h 00 le lendemain) et le battement de
      // l'escale sont recalculés par `itineraire()`, jamais recopiés ici.
      segments: [
        {
          airline: 'China Eastern',
          number: 'MU554',
          from: 'Paris',
          to: 'Shanghai Pudong (PVG)',
          date: '2026-11-05',
          departureTime: '12:25',
          arrivalTime: '07:00',
          arrivalDate: '2026-11-06',
          note: 'Vol de nuit : on décolle le 5 et on atterrit le 6. L’aéroport parisien n’est pas précisé sur les informations transmises ; China Eastern dessert Roissy-Charles-de-Gaulle, à confirmer sur la réservation.',
        },
        {
          airline: 'China Eastern',
          number: 'MU727',
          from: 'Shanghai Pudong (PVG)',
          to: 'Tokyo Narita (NRT)',
          date: '2026-11-06',
          departureTime: '08:20',
          arrivalTime: '12:00',
        },
      ],
      price: {
        eur: 1103,
        certainty: 'confirmed',
        scope: 'per-person',
        note: 'Billet acheté : 1 103 € pour l’aller-retour, pour un voyageur. Le prix est porté par l’aller, le retour n’en porte aucun — sinon il serait compté deux fois.',
      },
      note: 'Horaires et numéros de vol fournis par le voyageur. Le battement de 1 h 20 à Shanghai qu’il indique se retrouve bien dans les horaires (7 h 00 → 8 h 20) : c’est court pour une correspondance internationale, même sans changer de compagnie. À vérifier auprès de China Eastern si les bagages sont enregistrés jusqu’à Narita.',
    },
    {
      label: 'Vol intérieur retour',
      from: 'Nagasaki (NGS)',
      to: 'Tokyo Haneda (HND)',
      date: '2026-12-02',
      certainty: 'estimate',
      note: 'PAS ENCORE RÉSERVÉ, information du voyageur. Date déduite de l’itinéraire, pas fournie. Le vol international repartant de Haneda, l’aéroport d’arrivée est fixé. Compagnie, numéro, horaire et prix restent à renseigner une fois le billet pris — c’est le seul des trois vols dont rien n’est arrêté.',
    },
    {
      label: 'Vol international retour',
      certainty: 'confirmed',
      segments: [
        {
          airline: 'China Eastern',
          number: 'MU576',
          from: 'Tokyo Haneda (HND)',
          to: 'Shanghai Pudong (PVG)',
          date: '2026-12-05',
          departureTime: '08:40',
          arrivalTime: '11:05',
          note: 'C’est cet horaire qui contraint tout le dernier jour : voir l’avertissement du transfert vers Haneda.',
        },
        {
          airline: 'China Eastern',
          number: 'MU569',
          from: 'Shanghai Pudong (PVG)',
          to: 'Paris',
          date: '2026-12-05',
          departureTime: '12:25',
          note: 'Heure d’atterrissage à Paris non fournie : elle reste vide plutôt que d’être déduite d’un temps de vol supposé.',
        },
      ],
      note: 'Aucun prix ici : il est porté par l’aller, le billet étant un aller-retour. Même escale de 1 h 20 à Shanghai qu’à l’aller (11 h 05 → 12 h 25).',
    },
  ],
  transfers: TRANSFERS,
  passes: PASSES,
  /**
   * Repas et visites ont été retirés du budget à la demande du voyageur : leurs
   * enveloppes journalières (4 000 ¥ et 2 000 ¥) pesaient à elles deux plus que
   * tous les transports du voyage, sur la seule base d'une moyenne inventée. Ne
   * reste que le transport local, qui se rattache à des trajets réels.
   */
  budgetDefaults: {
    localTransportPerDayPerPerson: 800,
    // Ordre de grandeur d'un colis de la taille d'une valise sur une longue
    // distance, et rien de plus : la grille Yamato dépend de la taille du colis
    // et du couple de préfectures, et elle n'a pas été relevée. C'est donc une
    // hypothèse réglable dans la vue Budget, pas une donnée du voyage — à
    // remplacer par le premier tarif annoncé à une réception.
    luggageForwardingPerShipment: 2500,
  },
}

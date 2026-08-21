/**
 * LES TRAJETS — source de vérité.
 *
 * Un `Journey` relie deux étapes. Il est découpé en `legs` : un leg = un seul
 * moyen de transport, un seul service, un seul couple départ/arrivée. La carte
 * dessine chaque leg séparément, avec le style de son mode : aucun déplacement
 * n'est résumé par un trait droit entre deux villes lointaines.
 *
 * ⚠️ Tous les tarifs et durées ci-dessous sont des ESTIMATIONS relevées sur les
 * grilles publiques (JR, Nohi Bus, Alpico, ferries de la mer de Seto), en yens,
 * par personne, sièges non réservés sauf mention. Rien n'a été réservé : l'UI
 * les affiche systématiquement comme estimations, jamais comme des prix fermes.
 *
 * ⚠️ Les tracés sont SCHÉMATIQUES : ils suivent le corridor réel par waypoints
 * (vallées, gares, détroits), ce ne sont pas des relevés GPS. Les vols sont des
 * arcs géodésiques calculés.
 *
 * ⚠️ Deux tronçons n'ont PAS de tarif : ceux de l'étape de Matsuyama, ajoutée
 * d'après la table de dates. La grille JR Shikoku n'a pas été relevée et un
 * chiffre de mémoire n'est pas une donnée : le champ reste vide, le site le
 * signale, et le total « transports » est affiché comme incomplet.
 */
import type { Journey } from '../types'
import { mins, tarifACompleter, yen } from './unites'

export const JOURNEYS: Journey[] = [
  // ─── 1 ─── Tokyo → Matsumoto ────────────────────────────────────────────
  {
    id: 'j01',
    fromDestination: 'tokyo-arrivee',
    toDestination: 'matsumoto',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j01.1',
        mode: 'train',
        fromPlace: 'shinjuku',
        toPlace: 'matsumoto',
        service: 'JR Ltd. Exp. Azusa',
        line: 'Ligne Chūō',
        duration: mins(165),
        cost: yen(6620, 'billet + supplément express, siège non réservé'),
        passCoverage: 'covered',
        via: [
          [139.3387, 35.6556], // Hachiōji
          [138.9403, 35.6103], // Ōtsuki
          [138.5690, 35.6673], // Kōfu
          [138.3230, 35.8650], // Kobuchizawa
          [137.9550, 36.1160], // Shiojiri
        ],
        note: 'Départ de Shinjuku, pas de Tokyo station. Réservation conseillée : l’Azusa est en sièges réservés obligatoires.',
      },
    ],
    warnings: [
      'Le trajet depuis Narita n’est pas compté ici : il a eu lieu le 6 novembre, deux jours plus tôt, et figure comme transfert d’aéroport dans la section Transports.',
      'Départ le 8 novembre 2026 : l’Azusa est à sièges réservés, à prendre dès l’ouverture des ventes (un mois avant).',
      'L’hôtel réservé est à Asakusa et l’Azusa part de Shinjuku : compter le trajet en métro le matin du 8, avant l’heure du train. Ce tronçon urbain n’est pas chiffré ici — il relève de la ligne « transports locaux » du budget.',
    ],
  },

  // ─── 2 ─── Matsumoto → Kamikōchi ────────────────────────────────────────
  {
    id: 'j02',
    fromDestination: 'matsumoto',
    toDestination: 'kamikochi',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j02.1',
        mode: 'train',
        fromPlace: 'matsumoto',
        toPlace: 'shin-shimashima',
        service: 'Alpico Kōtsū, ligne Kamikōchi',
        duration: mins(30),
        cost: yen(710),
        passCoverage: 'not-covered',
        note: 'Compagnie privée : aucun pass JR ne la couvre.',
      },
      {
        id: 'j02.2',
        mode: 'bus',
        fromPlace: 'shin-shimashima',
        toPlace: 'kamikochi',
        service: 'Bus Alpico',
        duration: mins(65),
        cost: yen(2710),
        passCoverage: 'not-covered',
        via: [[137.6800, 36.2200]], // Nakanoyu
        note: 'Il existe un billet aller-retour train + bus depuis Matsumoto, moins cher que deux allers simples.',
      },
    ],
    connections: [
      { place: 'shin-shimashima', note: 'Le bus part devant la gare — battement court, ne pas traîner.' },
    ],
    warnings: ['Vallée fermée à la circulation privée, et fermée l’hiver (mi-novembre → fin avril).'],
  },

  // ─── 3 ─── Kamikōchi → Takayama ─────────────────────────────────────────
  {
    id: 'j03',
    fromDestination: 'kamikochi',
    toDestination: 'takayama',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j03.1',
        mode: 'bus',
        fromPlace: 'kamikochi',
        toPlace: 'hirayu',
        service: 'Nohi Bus',
        duration: mins(25),
        cost: yen(1180),
        passCoverage: 'not-covered',
      },
      {
        id: 'j03.2',
        mode: 'bus',
        fromPlace: 'hirayu',
        toPlace: 'takayama',
        service: 'Nohi Bus',
        duration: mins(60),
        cost: yen(1600),
        passCoverage: 'not-covered',
        via: [[137.4000, 36.1500]], // col de Hirayu
      },
    ],
    connections: [
      {
        place: 'hirayu',
        note: 'Correspondance obligatoire à la gare routière de Hirayu Onsen : aucun bus direct Kamikōchi → Takayama.',
      },
    ],
  },

  // ─── 4 ─── Takayama → Shirakawa-gō ──────────────────────────────────────
  {
    id: 'j04',
    fromDestination: 'takayama',
    toDestination: 'shirakawago',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j04.1',
        mode: 'bus',
        fromPlace: 'takayama',
        toPlace: 'shirakawago',
        service: 'Nohi Bus / Hokutetsu',
        duration: mins(50),
        cost: yen(2600),
        passCoverage: 'not-covered',
        via: [[137.0500, 36.1900]], // autoroute Tōkai-Hokuriku
        note: 'Autoroute Tōkai-Hokuriku, tunnels successifs.',
      },
    ],
    warnings: ['Bus à réserver : les places partent vite en saison des couleurs et en hiver.'],
  },

  // ─── 5 ─── Shirakawa-gō → Kanazawa ──────────────────────────────────────
  {
    id: 'j05',
    fromDestination: 'shirakawago',
    toDestination: 'kanazawa',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j05.1',
        mode: 'bus',
        fromPlace: 'shirakawago',
        toPlace: 'kanazawa',
        service: 'Nohi Bus / Hokutetsu',
        duration: mins(75),
        cost: yen(2600),
        passCoverage: 'not-covered',
        via: [
          [136.9000, 36.4500], // vallée de Shōkawa
          [136.7700, 36.5500], // Fukumitsu
        ],
      },
    ],
    warnings: ['Même réseau que le trajet précédent : réservation recommandée.'],
  },

  // ─── 6 ─── Kanazawa → Toyama ────────────────────────────────────────────
  {
    id: 'j06',
    fromDestination: 'kanazawa',
    toDestination: 'toyama',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j06.1',
        mode: 'shinkansen',
        fromPlace: 'kanazawa',
        toPlace: 'toyama',
        service: 'Shinkansen Tsurugi / Hakutaka',
        line: 'Hokuriku Shinkansen',
        duration: mins(23),
        cost: yen(3390, 'siège réservé'),
        passCoverage: 'covered',
        via: [[136.9980, 36.7350]], // Shin-Takaoka
      },
    ],
  },

  // ─── 7 ─── Toyama → départ de la route alpine ───────────────────────────
  {
    id: 'j07',
    fromDestination: 'toyama',
    toDestination: 'tateyama',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j07.1',
        mode: 'train',
        fromPlace: 'toyama',
        toPlace: 'tateyama-st',
        service: 'Toyama Chihō Railway, ligne Tateyama',
        duration: mins(60),
        cost: yen(1230),
        passCoverage: 'not-covered',
        via: [[137.2800, 36.6700], [137.3000, 36.6300]],
        note: 'Compagnie privée. Départ de Dentetsu-Toyama, accolée à la gare JR.',
      },
    ],
  },

  // ─── 8 ─── Traversée de la route alpine, jusqu'à Shinano-Ōmachi ─────────
  // La descente vers Nagano n'est PAS dans ce trajet : elle a été détachée en
  // « j08b », le lendemain matin, pour ne pas accumuler 9 h dans la journée du
  // 17. Voir l'étape « omachi » dans destinations.ts.
  {
    id: 'j08',
    fromDestination: 'tateyama',
    toDestination: 'omachi',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j08.1',
        mode: 'ropeway',
        fromPlace: 'tateyama-st',
        toPlace: 'bijodaira',
        service: 'Funiculaire de Tateyama',
        duration: mins(7),
        cost: yen(13000, 'forfait de traversée Tateyama → Ōgizawa : couvre les 7 tronçons de la route alpine. Tarif à vérifier sur le site officiel.'), // prettier-ignore
        passCoverage: 'not-covered',
      },
      {
        id: 'j08.2',
        mode: 'bus',
        fromPlace: 'bijodaira',
        toPlace: 'murodo',
        service: 'Bus d’altitude Tateyama',
        duration: mins(50),
        passCoverage: 'not-covered',
        via: [[137.4500, 36.5900], [137.5300, 36.5850]],
        note: 'Inclus dans le forfait de traversée. Passe devant la cascade de Shōmyō et les cèdres millénaires.',
      },
      {
        id: 'j08.3',
        mode: 'bus',
        fromPlace: 'murodo',
        toPlace: 'daikanbo',
        service: 'Bus électrique du tunnel',
        duration: mins(10),
        passCoverage: 'not-covered',
        note: 'Inclus dans le forfait. Traverse le mont Tateyama par un tunnel.',
      },
      {
        id: 'j08.4',
        mode: 'ropeway',
        fromPlace: 'daikanbo',
        toPlace: 'kurobedaira',
        service: 'Téléphérique de Tateyama',
        duration: mins(7),
        passCoverage: 'not-covered',
        note: 'Inclus dans le forfait. Aucun pylône sur 1 700 m de portée.',
      },
      {
        id: 'j08.5',
        mode: 'ropeway',
        fromPlace: 'kurobedaira',
        toPlace: 'kurobe-dam',
        service: 'Funiculaire de Kurobe',
        duration: mins(5),
        passCoverage: 'not-covered',
        note: 'Inclus dans le forfait. Entièrement souterrain.',
      },
      {
        id: 'j08.6',
        mode: 'walk',
        fromPlace: 'kurobe-dam',
        toPlace: 'kurobe-dam',
        service: 'Traversée du barrage à pied',
        duration: mins(15),
        passCoverage: 'not-covered',
        via: [[137.6660, 36.5670]],
        note: '186 m de haut, le plus haut barrage du Japon. La marche fait partie de l’itinéraire, il n’y a pas d’alternative.',
      },
      {
        id: 'j08.7',
        mode: 'bus',
        fromPlace: 'kurobe-dam',
        toPlace: 'ogizawa',
        service: 'Bus électrique du Kanden',
        duration: mins(16),
        passCoverage: 'not-covered',
        note: 'Inclus dans le forfait. Dernier tronçon de la route alpine.',
      },
      {
        id: 'j08.8',
        mode: 'bus',
        fromPlace: 'ogizawa',
        toPlace: 'shinano-omachi',
        service: 'Bus Alpico',
        duration: mins(40),
        cost: yen(1800),
        passCoverage: 'not-covered',
        note: 'Hors forfait de la route alpine. Dernier tronçon de la journée : on dort à Shinano-Ōmachi.',
      },
    ],
    connections: [
      { place: 'murodo', note: 'Point culminant, 2 450 m — arrêt possible pour marcher autour de l’étang Mikuriga-ike.' },
      { place: 'ogizawa', note: 'Sortie est de la route alpine : on quitte le forfait, les billets suivants sont à part.' },
    ],
    warnings: [
      'Journée entière : 2 h 30 de mouvement effectif sur la route alpine, mais 6 à 7 h porte à porte avec les attentes entre les huit tronçons. Prévoir de partir tôt de Toyama.',
      'La descente vers Nagano a été détachée au lendemain matin (trajet suivant) : la journée du 17 s’arrête à Shinano-Ōmachi. Cela retire 1 h 50 de train et une correspondance à une journée qui atteignait sinon ~9 h et finissait de nuit.',
      'Les bagages ne traversent pas : à faire expédier de Toyama vers Shinano-Ōmachi ou Nagano (takkyūbin), la veille.',
      'Traversée le 17 novembre, à deux semaines de la fermeture annuelle : horaires réduits en fin de saison et sections susceptibles de fermer avant les autres. Calendrier à vérifier tronçon par tronçon.',
      'À vérifier : existence d’un bus direct Ōgizawa → Nagano selon la saison, qui remplacerait les deux trajets par la vallée.',
    ],
  },

  // ─── 8b ─── Shinano-Ōmachi → Nagano, le lendemain matin ─────────────────
  // Détaché de la traversée alpine : ces deux tronçons pesaient 2 h 50 à la fin
  // d'une journée qui en comptait déjà 6 à 7. Les identifiants gardent le
  // préfixe « j08b » plutôt que de renuméroter tous les trajets suivants.
  {
    id: 'j08b',
    fromDestination: 'omachi',
    toDestination: 'nagano',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j08b.1',
        mode: 'train',
        fromPlace: 'shinano-omachi',
        toPlace: 'matsumoto',
        service: 'JR omnibus',
        line: 'Ligne Ōito',
        duration: mins(60),
        cost: yen(1170),
        passCoverage: 'covered',
        via: [[137.8820, 36.3430]], // Hotaka
        note: 'La ligne Ōito descend vers le sud : on repasse par Matsumoto pour rejoindre Nagano.',
      },
      {
        id: 'j08b.2',
        mode: 'train',
        fromPlace: 'matsumoto',
        toPlace: 'nagano',
        service: 'JR Ltd. Exp. Shinano',
        line: 'Ligne Shinonoi',
        duration: mins(50),
        cost: yen(3020, 'billet + supplément express'),
        passCoverage: 'covered',
        via: [[138.1350, 36.5830]], // Shinonoi
      },
    ],
    connections: [
      { place: 'matsumoto', note: 'Correspondance de la ligne Ōito vers le Ltd. Exp. Shinano.' },
    ],
    warnings: [
      'Matinée du 18 novembre : ~1 h 50 de train, une correspondance à Matsumoto. On arrive à Nagano pour le déjeuner, avec l’après-midi disponible.',
      'La ligne Ōito est un omnibus à fréquence faible : vérifier l’horaire du matin, c’est lui qui fixe l’heure de départ.',
    ],
  },

  // ─── 9 ─── Nagano → Kurashiki, par Nagoya ───────────────────────────────
  {
    id: 'j09',
    fromDestination: 'nagano',
    toDestination: 'kurashiki',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j09.1',
        mode: 'train',
        fromPlace: 'nagano',
        toPlace: 'nagoya',
        service: 'JR Ltd. Exp. Shinano',
        line: 'Lignes Shinonoi & Chūō',
        duration: mins(175),
        cost: yen(7460, 'billet + supplément express'),
        passCoverage: 'covered',
        via: [
          [138.1350, 36.5830], // Shinonoi
          [137.9670, 36.2317], // Matsumoto
          [137.9550, 36.1160], // Shiojiri
          [137.6920, 35.8450], // Kiso-Fukushima
          [137.5000, 35.4870], // Nakatsugawa
          [137.1320, 35.3320], // Tajimi
        ],
        note: 'La vallée du Kiso : la plus belle portion de la journée.',
      },
      {
        id: 'j09.2',
        mode: 'shinkansen',
        fromPlace: 'nagoya',
        toPlace: 'okayama',
        service: 'Shinkansen Hikari / Sakura',
        line: 'Tōkaidō & San’yō Shinkansen',
        duration: mins(105),
        cost: yen(11290, 'siège non réservé'),
        passCoverage: 'covered',
        via: [
          [135.7580, 34.9850], // Kyoto
          [135.5000, 34.7330], // Shin-Ōsaka
          [135.1960, 34.7000], // Shin-Kōbe
          [134.6900, 34.8260], // Himeji
        ],
        note: 'Le Nozomi n’est pas couvert par le JR Pass national : prendre un Hikari ou un Sakura.',
      },
      {
        id: 'j09.3',
        mode: 'train',
        fromPlace: 'okayama',
        toPlace: 'kurashiki',
        service: 'JR omnibus / rapide',
        line: 'Ligne San’yō',
        duration: mins(16),
        cost: yen(330),
        passCoverage: 'covered',
      },
    ],
    connections: [
      { place: 'nagoya', note: 'Correspondance quai à quai vers le Shinkansen — prévoir 15 min.' },
      { place: 'okayama', note: 'Changement pour l’omnibus de la ligne San’yō.' },
    ],
    warnings: [
      'Journée de transport : ~5 h 15 de trajet effectif, deux correspondances.',
      'Itinéraire retenu via Nagoya plutôt que Tokyo : moins cher, légèrement plus rapide, et ~250 km de détour évités.',
    ],
  },

  // ─── 10 ─── Kurashiki → Hiroshima ───────────────────────────────────────
  {
    id: 'j10',
    fromDestination: 'kurashiki',
    toDestination: 'hiroshima',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j10.1',
        mode: 'train',
        fromPlace: 'kurashiki',
        toPlace: 'okayama',
        service: 'JR omnibus / rapide',
        line: 'Ligne San’yō',
        duration: mins(16),
        cost: yen(330),
        passCoverage: 'covered',
      },
      {
        id: 'j10.2',
        mode: 'shinkansen',
        fromPlace: 'okayama',
        toPlace: 'hiroshima',
        service: 'Shinkansen Sakura / Hikari',
        line: 'San’yō Shinkansen',
        duration: mins(40),
        cost: yen(7470, 'siège non réservé'),
        passCoverage: 'covered',
        via: [
          [133.6800, 34.5410], // Shin-Kurashiki
          [133.3620, 34.4890], // Fukuyama
          [133.0780, 34.3970], // Mihara
          [132.7440, 34.4280], // Higashi-Hiroshima
        ],
      },
    ],
    connections: [{ place: 'okayama', note: 'Montée sur le Shinkansen à Okayama.' }],
  },

  // ─── 11 ─── Hiroshima → Naoshima, par Uno ───────────────────────────────
  {
    id: 'j11',
    fromDestination: 'hiroshima',
    toDestination: 'naoshima',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j11.1',
        mode: 'shinkansen',
        fromPlace: 'hiroshima',
        toPlace: 'okayama',
        service: 'Shinkansen Sakura / Hikari',
        line: 'San’yō Shinkansen',
        duration: mins(40),
        cost: yen(7470, 'siège non réservé'),
        passCoverage: 'covered',
        via: [
          [132.7440, 34.4280], // Higashi-Hiroshima
          [133.0780, 34.3970], // Mihara
          [133.3620, 34.4890], // Fukuyama
          [133.6800, 34.5410], // Shin-Kurashiki
        ],
      },
      {
        id: 'j11.2',
        mode: 'train',
        fromPlace: 'okayama',
        toPlace: 'uno',
        service: 'JR omnibus',
        line: 'Ligne Uno',
        duration: mins(55),
        cost: yen(590),
        passCoverage: 'covered',
        via: [[133.8770, 34.5860]], // Chayamachi
        note: 'Changement à Chayamachi selon l’horaire.',
      },
      {
        id: 'j11.3',
        mode: 'ferry',
        fromPlace: 'uno',
        toPlace: 'miyanoura',
        service: 'Ferry Shikoku Kisen',
        duration: mins(20),
        cost: yen(300),
        passCoverage: 'not-covered',
        note: 'Traversée de la mer intérieure de Seto. Un ferry rapide existe aussi, un peu plus cher.',
      },
    ],
    connections: [
      { place: 'okayama', note: 'Changement pour la ligne Uno — quai différent, prévoir 15 min.' },
      { place: 'uno', note: 'Le terminal ferry est juste devant la gare d’Uno.' },
    ],
    warnings: [
      'Journée du 23 novembre : ~2 h 40 de transport, trois correspondances, puis la visite de l’île avant le dernier ferry pour Takamatsu. C’est la journée la plus tendue du voyage.',
      'Visite de l’île avec les bagages : vérifier les consignes du port de Miyanoura.',
      'Vérifier l’horaire du dernier ferry Naoshima → Takamatsu avant de composer la journée : c’est lui qui fixe l’heure limite de départ de Hiroshima.',
    ],
  },

  // ─── 12 ─── Naoshima → Takamatsu ────────────────────────────────────────
  {
    id: 'j12',
    fromDestination: 'naoshima',
    toDestination: 'takamatsu',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j12.1',
        mode: 'ferry',
        fromPlace: 'miyanoura',
        toPlace: 'takamatsu-port',
        service: 'Ferry Shikoku Kisen',
        duration: mins(55),
        cost: yen(520),
        passCoverage: 'not-covered',
        note: 'Ferry classique. Une navette rapide fait la traversée en ~30 min pour environ le double du prix.',
      },
    ],
    warnings: ['Derniers départs en fin d’après-midi : à vérifier selon la saison.'],
  },

  // ─── 13 ─── Takamatsu → Matsuyama ───────────────────────────────────────
  // Trajet NOUVEAU : l'étape de Matsuyama vient de la table de dates, elle
  // n'était pas dans l'itinéraire initial. Voir l'avertissement ci-dessous.
  {
    id: 'j13',
    fromDestination: 'takamatsu',
    toDestination: 'matsuyama',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j13.1',
        mode: 'train',
        fromPlace: 'takamatsu',
        toPlace: 'matsuyama-st',
        service: 'JR Ltd. Exp. Ishizuchi',
        line: 'Ligne Yosan',
        duration: mins(155, 'durée type d’un Ltd. Exp. sur les ~195 km de la ligne — horaire à confirmer'), // prettier-ignore
        cost: tarifACompleter(
          'Grille JR Shikoku non relevée : billet + supplément express à vérifier sur jr-shikoku.co.jp.',
        ),
        passCoverage: 'covered',
        via: [
          [133.8590, 34.3220], // Sakaide
          [133.7550, 34.2735], // Tadotsu
          [133.6600, 34.1265], // Kan'onji
          [133.1810, 33.9195], // Iyo-Saijō
          [132.9950, 34.0640], // Imabari
          [132.7770, 33.9660], // Iyo-Hōjō
        ],
        note: 'Longe la côte nord de Shikoku. L’Ishizuchi est accouplé au Shiokaze venu d’Okayama entre Utazu et Matsuyama : vérifier la voiture indiquée sur le billet.',
      },
    ],
    warnings: [
      'Trajet nouveau, créé pour l’étape de Matsuyama que ta table de dates ajoute : il ne figurait pas dans l’itinéraire de départ.',
      'Tarif non renseigné volontairement : je n’ai pas relevé la grille JR Shikoku et je ne veux pas avancer un chiffre de mémoire. Le total de ce trajet est donc incomplet.',
    ],
  },

  // ─── 14 ─── Matsuyama → Fukuoka, par Okayama ────────────────────────────
  // Trajet NOUVEAU lui aussi : il remplace l'ancien Takamatsu → Fukuoka.
  {
    id: 'j14',
    fromDestination: 'matsuyama',
    toDestination: 'fukuoka',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j14.1',
        mode: 'train',
        fromPlace: 'matsuyama-st',
        toPlace: 'okayama',
        service: 'JR Ltd. Exp. Shiokaze',
        line: 'Lignes Yosan & Seto-Ōhashi',
        duration: mins(170, 'durée type d’un Shiokaze — horaire à confirmer'),
        cost: tarifACompleter(
          'Grille JR Shikoku / JR West non relevée : billet + supplément express à vérifier.',
        ),
        passCoverage: 'covered',
        via: [
          [132.7770, 33.9660], // Iyo-Hōjō
          [132.9950, 34.0640], // Imabari
          [133.1810, 33.9195], // Iyo-Saijō
          [133.6600, 34.1265], // Kan'onji
          [133.7550, 34.2735], // Tadotsu
          [133.8590, 34.3220], // Sakaide
          [133.8100, 34.4300], // pont de Seto
          [133.8770, 34.5860], // Chayamachi
        ],
        note: 'Franchit la mer intérieure sur le pont de Seto — 13 km de viaducs.',
      },
      {
        id: 'j14.2',
        mode: 'shinkansen',
        fromPlace: 'okayama',
        toPlace: 'hakata',
        service: 'Shinkansen Sakura',
        line: 'San’yō Shinkansen',
        duration: mins(100),
        cost: yen(15000, 'siège non réservé, Sakura'),
        passCoverage: 'covered',
        via: [
          [133.6800, 34.5410], // Shin-Kurashiki
          [133.3620, 34.4890], // Fukuyama
          [132.4750, 34.3980], // Hiroshima
          [131.3950, 34.0940], // Shin-Yamaguchi
          [130.9680, 33.9830], // Shin-Shimonoseki
          [130.8820, 33.8860], // Kokura
        ],
      },
    ],
    connections: [{ place: 'okayama', note: 'Correspondance Shiokaze → Shinkansen, ~15 min.' }],
    warnings: [
      'Trajet nouveau : il remplace l’ancien Takamatsu → Fukuoka, puisque Matsuyama s’intercale entre les deux.',
      'Grosse journée le 27 novembre : ~4 h 30 de trajet effectif, plus la correspondance. On repasse par Okayama, donc on refait en sens inverse la côte de Shikoku parcourue le 25.',
      'Tarif du premier tronçon non renseigné, comme pour le trajet précédent.',
      'Alternatives non explorées : liaison maritime depuis le port de Matsuyama vers Kyūshū, ou vol intérieur Matsuyama → Fukuoka. Je ne les ai pas vérifiées — le train est retenu parce que c’est la seule option dont je suis sûr, et la seule couverte par un pass JR.',
    ],
  },

  // ─── 15 ─── Fukuoka → Nagasaki ──────────────────────────────────────────
  {
    id: 'j15',
    fromDestination: 'fukuoka',
    toDestination: 'nagasaki',
    geometryKind: 'schematic',
    legs: [
      {
        id: 'j15.1',
        mode: 'train',
        fromPlace: 'hakata',
        toPlace: 'takeo-onsen',
        service: 'JR Ltd. Exp. Relay Kamome',
        line: 'Lignes Kagoshima & Sasebo',
        duration: mins(65),
        cost: yen(6050, 'billet direct Hakata → Nagasaki : couvre aussi le tronçon Shinkansen suivant'),
        passCoverage: 'covered',
        via: [
          [130.5080, 33.3770], // Shin-Tosu
          [130.3010, 33.2640], // Saga
        ],
      },
      {
        id: 'j15.2',
        mode: 'shinkansen',
        fromPlace: 'takeo-onsen',
        toPlace: 'nagasaki',
        service: 'Shinkansen Kamome',
        line: 'Nishi-Kyūshū Shinkansen',
        duration: mins(30),
        passCoverage: 'covered',
        via: [
          [129.9810, 33.1040], // Ureshino-Onsen
          [129.9580, 32.9300], // Shin-Ōmura
          [130.0550, 32.8450], // Isahaya
        ],
        note: 'Inclus dans le billet direct depuis Hakata.',
      },
    ],
    connections: [
      {
        place: 'takeo-onsen',
        note: 'Correspondance quai à quai, de l’autre côté du même quai : 3 minutes, c’est conçu pour.',
      },
    ],
    warnings: [
      'La ligne Nishi-Kyūshū n’est pas encore reliée au reste du réseau Shinkansen : le changement à Takeo-Onsen est obligatoire.',
    ],
  },

  // ─── 16 ─── Nagasaki → Tokyo, par les airs ──────────────────────────────
  {
    id: 'j16',
    fromDestination: 'nagasaki',
    toDestination: 'tokyo-retour',
    geometryKind: 'great-circle',
    legs: [
      {
        id: 'j16.1',
        mode: 'bus',
        fromPlace: 'nagasaki',
        toPlace: 'nagasaki-airport',
        service: 'Bus limousine aéroport',
        duration: mins(45),
        cost: yen(1200),
        passCoverage: 'not-covered',
        via: [[129.9000, 32.7900]],
        note: 'Départ devant la gare de Nagasaki. L’aéroport est construit sur une île de la baie d’Ōmura.',
      },
      {
        id: 'j16.2',
        mode: 'plane',
        fromPlace: 'nagasaki-airport',
        toPlace: 'haneda',
        service: 'Vol intérieur',
        duration: mins(120),
        cost: yen(20000, 'très variable : ~12 000 ¥ en réservant tôt, jusqu’à ~35 000 ¥ au dernier moment'),
        passCoverage: 'not-covered',
        note: 'ANA, JAL, Skymark et Solaseed desservent Haneda. Compagnie et horaire à choisir.',
      },
    ],
    warnings: [
      'Vol du 2 décembre 2026 : à réserver tôt, le prix double facilement au dernier moment.',
      'Aéroport d’arrivée : Haneda, désormais imposé par le vol international du 5 décembre qui en repart. Écarter les vols vers Narita, ils obligeraient à traverser Tokyo au petit matin du départ.',
      'Alternative non retenue : Shinkansen Nagasaki → Tokyo, ~7 h et plus cher hors pass.',
    ],
  },
]

export const JOURNEY_BY_ID: Record<string, Journey> = Object.fromEntries(
  JOURNEYS.map((j) => [j.id, j]),
)

/** Tous les legs, à plat — pratique pour la carte et les totaux. */
export const ALL_LEGS = JOURNEYS.flatMap((j) =>
  j.legs.map((leg) => ({ leg, journey: j })),
)

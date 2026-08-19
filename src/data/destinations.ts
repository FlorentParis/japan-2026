/**
 * LES ÉTAPES DU VOYAGE — source de vérité.
 *
 * ▸ Pour renseigner une étape, il suffit d'éditer son objet ici : dates, nuits,
 *   hôtel, activités. Rien d'autre à toucher, tout le site en découle
 *   (carte, timeline, budget, compteurs, page « à compléter »).
 *
 * ▸ Ce qui n'a pas été fourni est marqué `certainty: 'todo'`. Aucune date,
 *   aucun prix, aucun hôtel n'a été inventé.
 *
 * ▸ Les `activities` et les `specialities`, en revanche, sont des
 *   **propositions** : elles ne viennent pas du voyageur, qui a demandé qu'on
 *   lui en suggère. D'où `activitiesStatus` et `specialitiesStatus` à
 *   `'estimate'`, et une pastille dans l'UI qui le dit. Ce sont des faits
 *   documentés sur des lieux publics, pas un programme arrêté ni des
 *   réservations — et volontairement sans prix : une grille tarifaire récitée de
 *   mémoire serait une donnée inventée, ce que l'on refuse ici.
 *
 * ▸ Les `spots` sont des repères géographiques publics (monuments, jardins),
 *   pas un programme : ils servent à situer la ville sur la carte.
 *
 * ▸ Les dates viennent de la table fournie par le voyageur (6 nov. → 5 déc.,
 *   29 nuits). Elles sont donc `confirmed`. Là où la table demandait une
 *   interprétation — une ligne « Tateyama → Nagano », une ligne
 *   « Takamatsu/Naoshima » — le nombre de nuits est marqué `estimate` et un
 *   avertissement dit exactement quel choix a été fait, pour qu'il puisse être
 *   corrigé plutôt que subi.
 */
import type { DateInfo, Destination } from '../types'

/**
 * Année du voyage. La table fournie ne donnait que jour et mois ; 2026 est la
 * seule occurrence à venir de ce calendrier (novembre 2026 est dans le futur au
 * moment de la saisie). Un seul endroit à corriger si ce n'est pas la bonne.
 */
const ANNEE = 2026

/** Dates fournies par le voyageur : « MM-JJ » d'arrivée et de départ. */
const sejour = (arrivee: string, depart: string): DateInfo => ({
  start: `${ANNEE}-${arrivee}`,
  end: `${ANNEE}-${depart}`,
  certainty: 'confirmed',
})

/** Nombre de nuits tel que la table le donne. */
const nuits = (count: number) => ({ count, certainty: 'confirmed' as const })

/** Nombre de nuits déduit d'une ligne ambiguë de la table — voir l'avertissement. */
const nuitsDeduites = (count: number) => ({ count, certainty: 'estimate' as const })

/**
 * Les étapes, dans l'ordre du voyage.
 *
 * Le numéro d'ordre n'est pas écrit à la main : il est déduit de la position
 * dans ce tableau. Insérer, déplacer ou retirer une étape ne demande donc pas de
 * renuméroter les suivantes — un oubli qui, avant, ne se voyait qu'au contrôle.
 */
const ETAPES: Array<Omit<Destination, 'order'>> = [
  {
    id: 'tokyo-arrivee',
    name: 'Tokyo',
    nameJa: '東京',
    region: 'Kantō',
    coord: [139.7671, 35.6812],
    stay: 'overnight',
    blurb:
      'Point d’entrée du voyage. La mégapole s’explore par quartiers : Asakusa et son temple, Shibuya et son carrefour, les jardins impériaux.',
    photoId: 'tokyo',
    galleryQueries: ['Asakusa Tokyo', 'Shinjuku night', 'Tokyo skyline autumn'],
    dates: sejour('11-06', '11-08'),
    nights: nuits(2),
    accommodation: {
      status: 'todo',
      note: 'Arrivée dans Tokyo vers 14 h 30 seulement : un hôtel proche de la gare de Tokyo ou de Shinjuku évite un transport de plus avec les bagages. Shinjuku a l’avantage d’être le point de départ du train du 8 pour Matsumoto.',
    },
    activities: [
      {
        id: 'tokyo-arrivee-sensoji',
        name: 'Sensō-ji et la rue Nakamise',
        category: 'culture',
        description:
          'Le plus ancien temple de Tokyo, fondé au VIIᵉ siècle, précédé d’une allée de boutiques de confiseries et d’éventails. C’est aussi le lieu de culte le plus fréquenté du pays par les Japonais eux-mêmes.',
        photoQuery: 'Sensoji Asakusa Kaminarimon',
        note: 'Enceinte ouverte en permanence, bâtiments principaux fermés le soir. Nakamise est saturée en milieu de journée : tôt le matin, la rue est vide.',
      },
      {
        id: 'tokyo-arrivee-meiji',
        name: 'Meiji-jingū et Harajuku',
        category: 'culture',
        description:
          'Sanctuaire dédié à l’empereur Meiji, au milieu d’une forêt de cent mille arbres plantés à la main en 1920. Les mariages shintō du week-end s’y traversent en passant.',
        photoQuery: 'Meiji Shrine Tokyo torii',
        note: 'L’allée de ginkgos du Jingū Gaien, voisine, jaunit précisément fin novembre : c’est un des rendez-vous d’automne des Tokyoïtes.',
      },
      {
        id: 'tokyo-arrivee-shibuya',
        name: 'Carrefour de Shibuya',
        category: 'quartier',
        description:
          'Le passage piéton le plus emprunté du monde, vu d’en bas puis d’en haut. Autour, le quartier des grands magasins et des ruelles de restaurants de Nonbei Yokochō.',
        photoQuery: 'Shibuya Crossing Tokyo',
        note: 'La vue plongeante est payante depuis les terrasses des tours ; la passerelle de la gare et le café du premier étage en face la donnent gratuitement.',
      },
      {
        id: 'tokyo-arrivee-tsukiji',
        name: 'Marché extérieur de Tsukiji',
        category: 'food',
        description:
          'Le marché de gros a déménagé à Toyosu, mais les quatre cents échoppes de la rue restent : oursins, omelettes grillées, couteaux de cuisine, thé. Très fréquenté par les Japonais, pour faire ses courses autant que pour déjeuner.',
        photoQuery: 'Tsukiji Outer Market Tokyo',
        note: 'Ferme en début d’après-midi et beaucoup de stands le dimanche. À faire le matin, ce qui tombe bien avec le décalage horaire.',
      },
      {
        id: 'tokyo-arrivee-shinjuku-gyoen',
        name: 'Jardin national de Shinjuku Gyoen',
        category: 'nature',
        description:
          'Ancien domaine impérial de 58 hectares : un jardin paysager anglais, un jardin français, et un jardin japonais avec pavillon de thé, au pied des tours de Shinjuku.',
        photoQuery: 'Shinjuku Gyoen garden',
        note: 'Fermé le lundi. Le 7 novembre est un peu tôt pour les érables de Tokyo, qui tournent plutôt fin novembre — les ginkgos, eux, y sont déjà jaunes.',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-tokyo-edomae',
        name: 'Sushi edomae',
        nameJa: '江戸前寿司',
        kind: 'plat',
        description:
          'Le sushi tel qu’il est né ici : poisson de la baie d’Edo mariné ou légèrement cuit, riz vinaigré tiède, servi à la pièce au comptoir. La forme « à emporter » du XIXᵉ siècle, devenue gastronomie.',
        photoQuery: 'Edomae sushi',
      },
      {
        id: 'spec-tokyo-soba',
        name: 'Soba d’Edo',
        nameJa: '蕎麦',
        kind: 'plat',
        description:
          'Nouilles de sarrasin servies froides sur une claie de bambou, avec une sauce à tremper. Tokyo est une ville de soba là où l’ouest du pays est une ville d’udon — la différence est un marqueur régional très net.',
        photoQuery: 'Zaru soba noodles',
      },
      {
        id: 'spec-tokyo-ningyoyaki',
        name: 'Ningyō-yaki',
        nameJa: '人形焼',
        kind: 'douceur',
        description:
          'Petits gâteaux moulés fourrés de pâte de haricot rouge, cuits devant le client dans les échoppes d’Asakusa. Le souvenir comestible traditionnel du quartier.',
        photoQuery: 'Ningyoyaki',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Aéroport d’arrivée : Narita, confirmé. Atterrissage le 6 novembre à 12 h 00. Le transfert vers Tokyo est détaillé dans la section Transports.',
      'La demi-journée du 6 est à considérer comme perdue : 12 h d’atterrissage, plus les formalités et 1 h de Narita Express, met l’arrivée en ville vers 14 h 30 au plus tôt — après un vol long-courrier. Sur ces deux nuits, seule la journée du 7 novembre est une vraie journée de visite.',
    ],
    spots: [
      { name: 'Sensō-ji', coord: [139.7967, 35.7148], kind: 'culture' },
      { name: 'Carrefour de Shibuya', coord: [139.7005, 35.6595], kind: 'quartier' },
      { name: 'Meiji-jingū', coord: [139.6993, 35.6764], kind: 'culture' },
      { name: 'Tokyo Skytree', coord: [139.8107, 35.7101], kind: 'quartier' },
    ],
  },
  {
    id: 'matsumoto',
    name: 'Matsumoto',
    nameJa: '松本',
    region: 'Préfecture de Nagano',
    coord: [137.9670, 36.2317],
    stay: 'overnight',
    blurb:
      'Ville des Alpes japonaises, connue pour son donjon noir du XVIᵉ siècle — l’un des cinq châteaux classés trésor national.',
    photoId: 'matsumoto',
    galleryQueries: ['Matsumoto Nagano city', 'Matsumoto Castle autumn', 'Kaichi School Matsumoto'],
    dates: sejour('11-08', '11-10'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'matsumoto-chateau',
        name: 'Château de Matsumoto',
        category: 'culture',
        description:
          'Donjon d’origine de 1594, classé trésor national : l’un des cinq seuls du Japon, et le plus ancien à cinq étages. Charpente intacte, escaliers raides, meurtrières — c’est un ouvrage militaire, pas un palais.',
        photoQuery: 'Matsumoto Castle keep',
        note: 'L’intérieur se monte pieds nus sur des marches très raides. Files d’attente réelles le week-end : l’entrée se fait par créneaux quand il y a foule.',
      },
      {
        id: 'matsumoto-nakamachi',
        name: 'Nakamachi et Nawate-dōri',
        category: 'quartier',
        description:
          'Deux rues d’anciens entrepôts de marchands aux murs blancs et noirs, reconvertis en ateliers de céramique, libraires et cafés, le long de la rivière Metoba.',
        photoQuery: 'Nakamachi Matsumoto street',
      },
      {
        id: 'matsumoto-kaichi',
        name: 'École Kaichi',
        category: 'culture',
        description:
          'Plus ancienne école primaire du Japon conservée, ouverte en 1873 : une façade de style occidental interprétée par des charpentiers japonais, avec octogone et angelots. Classée trésor national.',
        photoQuery: 'Kaichi School Matsumoto',
      },
      {
        id: 'matsumoto-yohashira',
        name: 'Sanctuaire Yohashira et le marché de Nawate',
        category: 'culture',
        description:
          'Petit sanctuaire au centre-ville, bordé d’une allée de stands. Le quartier est un lieu de promenade dominical local plutôt qu’un site touristique.',
        photoQuery: 'Yohashira Shrine Matsumoto',
      },
      {
        id: 'matsumoto-asama',
        name: 'Asama Onsen',
        category: 'onsen',
        description:
          'Station thermale en périphérie nord de la ville, fréquentée depuis plus de mille ans et toujours par les habitants de Matsumoto. Plusieurs bains publics ouverts à la journée.',
        photoQuery: 'Asama Onsen Matsumoto',
        note: 'Accessible en bus depuis la gare. Les bains de quartier fonctionnent souvent en paiement comptant, sans réservation.',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-matsumoto-basashi',
        name: 'Basashi',
        nameJa: '馬刺し',
        kind: 'plat',
        description:
          'Viande de cheval crue, tranchée fine et servie avec gingembre et sauce de soja. Spécialité assumée du bassin de Matsumoto, où l’élevage remplaçait la pêche.',
        photoQuery: 'Basashi horse sashimi',
      },
      {
        id: 'spec-matsumoto-sanzokuyaki',
        name: 'Sanzoku-yaki',
        nameJa: '山賊焼き',
        kind: 'plat',
        description:
          'Cuisse de poulet entière marinée à l’ail et au soja, farinée puis frite. Le plat de brasserie de la région de Matsumoto et de Shiojiri, servi partout autour de la gare.',
        photoQuery: 'Sanzoku yaki',
      },
      {
        id: 'spec-matsumoto-soba',
        name: 'Soba de Shinshū',
        nameJa: '信州そば',
        kind: 'plat',
        description:
          'Le sarrasin d’altitude est la culture de base de l’ancienne province de Shinano. Les soba y sont servies froides, ou en tōji-soba : trempées par petites portions dans un bouillon.',
        photoQuery: 'Shinshu soba Nagano',
      },
      {
        id: 'spec-matsumoto-wasabi',
        name: 'Wasabi d’Azumino',
        nameJa: '安曇野わさび',
        kind: 'produit',
        description:
          'Les champs de wasabi d’Azumino, arrosés en continu par l’eau de fonte des Alpes, sont parmi les plus étendus du pays. Le rhizome frais râpé n’a pas le goût de la pâte en tube.',
        photoQuery: 'Daio Wasabi Farm Azumino',
      },
    ],
    specialitiesStatus: 'estimate',
    spots: [
      { name: 'Château de Matsumoto', coord: [137.9690, 36.2384], kind: 'culture' },
      { name: 'Quartier de Nakamachi', coord: [137.9700, 36.2320], kind: 'quartier' },
    ],
  },
  {
    id: 'kamikochi',
    name: 'Kamikōchi',
    nameJa: '上高地',
    region: 'Alpes du Nord, Nagano',
    coord: [137.6350, 36.2494],
    stay: 'overnight',
    blurb:
      'Vallée d’altitude fermée aux voitures privées, au pied du massif du Hotaka. Balades le long de la rivière Azusa, du pont Kappa aux étangs.',
    photoId: 'kamikochi',
    galleryQueries: ['Kamikochi Azusa River', 'Hotaka mountains Japan', 'Kamikochi autumn'],
    dates: sejour('11-10', '11-11'),
    nights: nuits(1),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'kamikochi-kappabashi',
        name: 'Pont Kappa-bashi',
        category: 'nature',
        description:
          'Passerelle de bois suspendue au-dessus de l’Azusa, avec le massif du Hotaka en enfilade et le volcan Yake-dake en amont. C’est le centre de la vallée et le point de repère de tous les itinéraires.',
        photoQuery: 'Kappabashi Kamikochi bridge',
      },
      {
        id: 'kamikochi-taisho',
        name: 'Étang Taishō-ike',
        category: 'nature',
        description:
          'Étang né en 1915 de l’éruption du Yake-dake, qui a barré la rivière et noyé une forêt : les troncs morts sortent encore de l’eau. Reflet du Hotaka au petit matin.',
        photoQuery: 'Taisho Pond Kamikochi',
        note: 'À 45 min de marche en aval du pont Kappa, ou directement accessible depuis l’arrêt de bus Taishō-ike.',
      },
      {
        id: 'kamikochi-myojin',
        name: 'Étang Myōjin-ike et le sanctuaire Hotaka',
        category: 'nature',
        description:
          'Deux bassins d’eau claire au pied de la paroi du Myōjin, dans l’enceinte du sanctuaire intérieur d’Hotaka. L’eau y reste transparente toute l’année.',
        photoQuery: 'Myojin Pond Kamikochi',
        note: 'Environ 1 h de marche plate depuis Kappa-bashi, en boucle par les deux rives. Accès à l’étang payant (enceinte du sanctuaire).',
      },
      {
        id: 'kamikochi-tokusawa',
        name: 'Marche jusqu’à Tokusawa',
        category: 'nature',
        description:
          'La suite du sentier de rive, presque sans dénivelé, jusqu’à la clairière de Tokusawa d’où partent les voies d’altitude. Sept kilomètres de forêt et de galets, souvent avec des macaques.',
        photoQuery: 'Tokusawa Kamikochi',
        note: 'Compter 2 h aller depuis Kappa-bashi. Au-delà commence la vraie montagne, hors de question mi-novembre sans équipement.',
      },
      {
        id: 'kamikochi-weston',
        name: 'Monument Weston et le sentier de rive droite',
        category: 'culture',
        description:
          'Plaque dédiée à Walter Weston, le missionnaire anglais qui a fait connaître ces sommets et donné aux Alpes japonaises leur nom. Le sentier de la rive droite est le plus calme des deux.',
        photoQuery: 'Kamikochi Azusa river trail',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-kamikochi-iwana',
        name: 'Iwana grillé',
        nameJa: '岩魚',
        kind: 'plat',
        description:
          'Omble de rivière embroché entier et grillé au sel devant les refuges. Poisson des torrents d’altitude, servi le long des sentiers des Alpes du Nord.',
        // En kanji : sur Commons, les photos de ce plat sont nommées en japonais, et
        // « iwana » en caractères latins ne désigne le plus souvent qu'un hameau de
        // la préfecture de Chiba.
        photoQuery: '岩魚 塩焼き',
      },
      {
        id: 'spec-kamikochi-oyaki',
        name: 'Oyaki',
        nameJa: 'おやき',
        kind: 'plat',
        description:
          'Chausson de farine de sarrasin ou de blé fourré de légumes — aubergine miso, feuilles de nozawana, courge — cuit au four ou à la vapeur. Le casse-croûte paysan du Shinshū.',
        photoQuery: 'Oyaki Nagano food',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Nuit du 10 au 11 novembre 2026 : ce sont les tout derniers jours de la saison. La vallée ferme mi-novembre (clôture annoncée le 15 novembre ces dernières années) et les hébergements ferment dans la même semaine — date exacte 2026 à confirmer avant de réserver.',
      'À 1 500 m d’altitude et à cette date : gel nocturne, neige possible, sentiers d’altitude parfois déjà fermés.',
      'Peu d’hébergements dans la vallée, et une seule nuit prévue : à réserver en priorité.',
      'Accès uniquement en bus ou taxi — aucune voiture privée n’entre dans la vallée.',
    ],
    spots: [
      { name: 'Pont Kappa-bashi', coord: [137.6350, 36.2494], kind: 'nature' },
      { name: 'Étang Taishō-ike', coord: [137.6180, 36.2360], kind: 'nature' },
      { name: 'Étang Myōjin-ike', coord: [137.6600, 36.2560], kind: 'nature' },
    ],
  },
  {
    id: 'takayama',
    name: 'Takayama',
    nameJa: '高山',
    region: 'Préfecture de Gifu',
    coord: [137.2520, 36.1440],
    stay: 'overnight',
    blurb:
      'Ancienne ville de marchands au cœur de la région de Hida. Rues de bois sombre de Sanmachi-suji, marchés du matin, saké et bœuf de Hida.',
    photoId: 'takayama',
    galleryQueries: ['Takayama Gifu old town', 'Takayama Matsuri float', 'Hida Furukawa'],
    dates: sejour('11-11', '11-13'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'takayama-sanmachi',
        name: 'Sanmachi-suji',
        category: 'quartier',
        description:
          'Trois rues de maisons de marchands du XVIIᵉ siècle, bois noirci, treillis de bambou et enseignes de brasseries de saké — une boule de branches de cèdre suspendue signale qu’un saké nouveau est prêt.',
        photoQuery: 'Sanmachi Takayama',
        note: 'Plusieurs brasseries de saké ouvrent leur cave à la dégustation en hiver, chacune à son tour : le calendrier s’affiche sur place.',
      },
      {
        id: 'takayama-miyagawa',
        name: 'Marchés du matin',
        category: 'food',
        description:
          'Deux marchés quotidiens depuis l’époque d’Edo : celui de Miyagawa le long de la rivière, celui de Jinya-mae devant l’ancien siège du gouverneur. Légumes de montagne, cornichons, pommes, artisanat.',
        photoQuery: 'Miyagawa morning market Takayama',
        note: 'De 7 h (8 h en hiver) à midi environ. C’est fini avant que la ville ne se remplisse.',
      },
      {
        id: 'takayama-jinya',
        name: 'Takayama Jin’ya',
        category: 'culture',
        description:
          'Le seul siège de gouverneur du shogunat encore debout au Japon. Takayama était administrée directement par Edo pour ses forêts : bureaux, salle d’interrogatoire, greniers à riz.',
        photoQuery: 'Takayama Jinya',
      },
      {
        id: 'takayama-yatai',
        name: 'Musée des chars du festival',
        category: 'culture',
        description:
          'Quatre des chars du Takayama Matsuri, exposés à tour de rôle : bois laqué, dorures et automates à mécanisme d’horlogerie du XVIIIᵉ siècle. Le festival lui-même a lieu en avril et en octobre.',
        photoQuery: 'Takayama Yatai Kaikan float',
        note: 'Comme le voyage tombe en novembre, le musée est la seule façon de voir les chars. Le grand festival d’automne est le 9 et 10 octobre.',
      },
      {
        id: 'takayama-higashiyama',
        name: 'Promenade de Higashiyama',
        category: 'culture',
        description:
          'Sentier de 3,5 km reliant une quinzaine de temples et sanctuaires sur la colline est, jusqu’aux ruines du château de Takayama. Tracé volontairement à l’écart du centre, presque désert.',
        photoQuery: 'Higashiyama Takayama temple',
      },
      {
        id: 'takayama-hidanosato',
        name: 'Hida no Sato',
        category: 'culture',
        description:
          'Trentaine de fermes de montagne démontées et remontées autour d’un étang, dont des gasshō-zukuri sauvés de vallées noyées par des barrages. Ateliers de vannerie et de teinture en activité.',
        photoQuery: 'Hida Folk Village Takayama',
        note: 'À 10 min de bus du centre. Utile si Shirakawa-gō est bondé : on y entre dans les maisons sans faire la queue.',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-takayama-hidagyu',
        name: 'Bœuf de Hida',
        nameJa: '飛騨牛',
        kind: 'plat',
        description:
          'Wagyū de la préfecture de Gifu, élevé dans ces vallées. Se mange en steak, mais surtout, dans les rues de Takayama, en brochettes grillées, en nigiri posé sur un craquelin de riz, ou en croquette.',
        photoQuery: 'Hida beef skewer Takayama',
      },
      {
        id: 'spec-takayama-hobamiso',
        name: 'Hōba-miso',
        nameJa: '朴葉味噌',
        kind: 'plat',
        description:
          'Miso mélangé d’oignon vert et de champignons, grillé sur une feuille de magnolia séchée posée sur un brasero. Le plat du petit-déjeuner des auberges de Hida, à manger avec du riz.',
        photoQuery: 'Hoba miso Hida',
      },
      {
        id: 'spec-takayama-mitarashi',
        name: 'Mitarashi dango',
        nameJa: 'みたらし団子',
        kind: 'douceur',
        description:
          'Boulettes de riz grillées sur brochette, badigeonnées de sauce de soja — salées, pas sucrées, contrairement à celles du reste du pays. Vendues dans la rue à Sanmachi.',
        // « Midarashi » et non « mitarashi » : c'est la prononciation de Takayama, et
        // c'est sous ce nom que Commons range les photos prises sur place.
        photoQuery: 'Midarashi dango',
      },
      {
        id: 'spec-takayama-sake',
        name: 'Saké de Hida',
        nameJa: '飛騨の酒',
        kind: 'boisson',
        description:
          'Six brasseries en activité dans le centre historique, alimentées par l’eau de fonte des Alpes et un riz de montagne. Hivers froids et longs : conditions classiques du brassage de qualité.',
        photoQuery: 'Sake brewery Takayama',
      },
    ],
    specialitiesStatus: 'estimate',
    spots: [
      { name: 'Sanmachi-suji', coord: [137.2610, 36.1400], kind: 'quartier' },
      { name: 'Marché matinal de Miyagawa', coord: [137.2620, 36.1440], kind: 'food' },
      { name: 'Promenade de Higashiyama', coord: [137.2680, 36.1420], kind: 'culture' },
    ],
  },
  {
    id: 'shirakawago',
    name: 'Shirakawa-gō',
    nameJa: '白川郷',
    region: 'Préfecture de Gifu',
    coord: [136.9060, 36.2580],
    stay: 'overnight',
    blurb:
      'Village classé au patrimoine mondial pour ses fermes gasshō-zukuri aux toits de chaume à forte pente, conçus pour les hivers de neige lourde.',
    photoId: 'shirakawago',
    galleryQueries: ['Shirakawa-go Ogimachi', 'Gassho-zukuri farmhouse', 'Shirakawa-go autumn'],
    dates: sejour('11-13', '11-14'),
    nights: nuits(1),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'shirakawago-ogimachi',
        name: 'Village d’Ogimachi',
        category: 'culture',
        description:
          'Une centaine de fermes gasshō-zukuri encore habitées, au milieu des rizières et des canaux à truites. Les toits de chaume, à 60 degrés, sont refaits collectivement par le village tous les trente à quarante ans.',
        photoQuery: 'Ogimachi Shirakawa-go village',
      },
      {
        id: 'shirakawago-shiroyama',
        name: 'Belvédère de Shiroyama',
        category: 'nature',
        description:
          'Depuis les ruines du château, la vue d’ensemble du village dans sa vallée — l’image par laquelle on connaît Shirakawa-gō.',
        photoQuery: 'Shirakawago viewpoint Shiroyama',
        note: 'Une quinzaine de minutes à pied par un sentier raide, ou une navette depuis le village.',
      },
      {
        id: 'shirakawago-wadake',
        name: 'Maison Wada-ke',
        category: 'culture',
        description:
          'La plus grande ferme du village, propriété de la famille de chefs de village qui vivait du commerce du salpêtre pour la poudre à canon. Trois étages de combles où l’on élevait les vers à soie, visitables.',
        photoQuery: 'Wada House Shirakawa-go',
      },
      {
        id: 'shirakawago-myozenji',
        name: 'Temple Myōzen-ji',
        category: 'culture',
        description:
          'Rare exemple de temple bouddhique bâti en gasshō-zukuri, avec son clocher au toit de chaume. Le musée voisin montre la charpente de l’intérieur, sans un seul clou.',
        photoQuery: 'Myozenji Shirakawa-go',
      },
      {
        id: 'shirakawago-doburoku',
        name: 'Musée du doburoku',
        category: 'food',
        description:
          'Le village conserve le droit, exceptionnel au Japon, de brasser son propre doburoku — un saké non filtré, trouble et épais — pour ses fêtes d’automne. Le musée en explique le rite et le fait goûter.',
        photoQuery: 'Doburoku sake Shirakawa',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-shirakawago-doburoku',
        name: 'Doburoku',
        nameJa: 'どぶろく',
        kind: 'boisson',
        description:
          'Saké non filtré, laiteux et à peine fermenté, brassé dans les sanctuaires du village pour la fête du doburoku. Le brassage domestique y est toléré par une dérogation ancienne.',
        photoQuery: 'Doburoku',
      },
      {
        id: 'spec-shirakawago-iwana',
        name: 'Truite et omble des viviers',
        nameJa: '岩魚',
        kind: 'plat',
        description:
          'Les canaux d’irrigation qui traversent le village servent de viviers. Poisson grillé au sel sur brochette, vendu le long de la rue principale.',
        photoQuery: 'Ayu no shioyaki',
      },
      {
        id: 'spec-shirakawago-tofu',
        name: 'Ishidōfu',
        nameJa: '石豆腐',
        kind: 'produit',
        description:
          'Tofu de montagne si ferme qu’on peut, dit-on, le porter avec une ficelle. Peu d’eau, beaucoup de soja : une conserve de protéines pour les hivers de neige lourde.',
        // Pas de `photoQuery` : Commons n'a aucune photo d'ishidōfu. Une recherche
        // « tofu » remonte du tofu soyeux — exactement le contraire de celui-ci —
        // ou des plats chinois. L'entrée reste sans image.
        note: 'Aucune photo libre de droits ne montre ce tofu-là : une image de tofu ordinaire donnerait une idée fausse de sa fermeté.',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Nuit sur place tranchée par ta table (1 nuit, du 13 au 14 novembre) : les logements du village sont des minshuku de quelques chambres et partent des mois à l’avance. C’est l’hébergement le plus contraint du voyage.',
      'Les bus Takayama ⇄ Shirakawa-gō ⇄ Kanazawa se réservent : places limitées en haute saison.',
    ],
    spots: [
      { name: 'Village d’Ogimachi', coord: [136.9060, 36.2580], kind: 'culture' },
      { name: 'Belvédère de Shiroyama', coord: [136.9080, 36.2620], kind: 'nature' },
      { name: 'Maison Wada-ke', coord: [136.9060, 36.2570], kind: 'culture' },
    ],
  },
  {
    id: 'kanazawa',
    name: 'Kanazawa',
    nameJa: '金沢',
    region: 'Préfecture d’Ishikawa',
    coord: [136.6480, 36.5780],
    stay: 'overnight',
    blurb:
      'Ancienne capitale du clan Maeda, épargnée par les bombardements. Kenroku-en, quartiers de geishas et de samouraïs, feuille d’or et marché de poissons.',
    photoId: 'kanazawa',
    galleryQueries: ['Kanazawa Ishikawa city', 'Kenrokuen autumn', 'Kanazawa Station Tsuzumimon'],
    dates: sejour('11-14', '11-16'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'kanazawa-kenrokuen',
        name: 'Kenroku-en',
        category: 'nature',
        description:
          'Un des trois grands jardins du Japon, composé sur deux siècles par les seigneurs Maeda. Étangs, ruisseaux détournés d’une rivière voisine, et la lanterne à deux pieds de Kotoji au bord de l’eau.',
        photoQuery: 'Kenrokuen garden Kanazawa',
        note: 'Mi-novembre, les yukitsuri — cônes de cordes tendues depuis le tronc des pins pour protéger les branches de la neige — sont installés : c’est l’image d’hiver du jardin, et elle commence le 1ᵉʳ novembre.',
      },
      {
        id: 'kanazawa-higashi-chaya',
        name: 'Higashi Chaya-gai',
        category: 'quartier',
        description:
          'Quartier des maisons de thé, aux façades de treillis de bois sombre à claire-voie qui laissaient voir la rue sans être vu. Deux maisons se visitent, dont une avec des salles entièrement laquées de rouge.',
        photoQuery: 'Higashi Chaya District Kanazawa',
      },
      {
        id: 'kanazawa-omicho',
        name: 'Marché Ōmichō',
        category: 'food',
        description:
          'Le marché de la ville depuis 1721, toujours celui où les habitants achètent leur poisson : crabe des neiges, crevettes douces, huîtres. Mi-novembre, la saison du crabe vient d’ouvrir.',
        photoQuery: 'Omicho Market Kanazawa',
        note: 'Le 6 novembre ouvre la pêche au crabe zuwai en mer du Japon : c’est un événement local, et les prix des premiers jours sont élevés.',
      },
      {
        id: 'kanazawa-21e',
        name: 'Musée d’art contemporain du XXIᵉ siècle',
        category: 'art',
        description:
          'Bâtiment circulaire tout en verre de SANAA, sans façade principale ni entrée unique. On y trouve la piscine en trompe-l’œil de Leandro Erlich, où les visiteurs semblent marcher sous l’eau.',
        photoQuery: '21st Century Museum of Contemporary Art Kanazawa',
        note: 'Fermé le lundi. Les galeries payantes se réservent par créneau ; les parties gratuites du bâtiment restent accessibles.',
      },
      {
        id: 'kanazawa-nagamachi',
        name: 'Quartier des samouraïs de Nagamachi',
        category: 'quartier',
        description:
          'Ruelles de murs de terre ocre entre canaux, où logeaient les guerriers de rang moyen du clan Maeda. Les murs sont emballés de nattes de paille pour l’hiver, à partir de la mi-décembre.',
        photoQuery: 'Nagamachi samurai district Kanazawa',
      },
      {
        id: 'kanazawa-kinpaku',
        name: 'Feuille d’or',
        category: 'culture',
        description:
          'Kanazawa produit la quasi-totalité de la feuille d’or japonaise, battue à un dix-millième de millimètre. Ateliers ouverts à la pose sur laque ou sur papier, et glaces recouvertes d’une feuille entière dans les rues.',
        photoQuery: 'Kanazawa gold leaf',
      },
      {
        id: 'kanazawa-chateau',
        name: 'Château de Kanazawa et Gyokusen’inmaru',
        category: 'culture',
        description:
          'Enceinte du clan Maeda, dont plusieurs portes et magasins ont été reconstruits à l’ancienne, sans clous. Le jardin Gyokusen’inmaru, restitué à partir de fouilles, est éclairé certains soirs.',
        photoQuery: 'Kanazawa Castle gate',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-kanazawa-kaisendon',
        name: 'Kaisen-don',
        nameJa: '海鮮丼',
        kind: 'plat',
        description:
          'Bol de riz couvert de poisson cru du jour, spécialité des comptoirs du marché Ōmichō. À Kanazawa, il contient presque toujours des amaebi — crevettes douces crues de la mer du Japon.',
        photoQuery: 'Kaisendon seafood rice bowl',
      },
      {
        id: 'spec-kanazawa-jibuni',
        name: 'Jibu-ni',
        nameJa: '治部煮',
        kind: 'plat',
        description:
          'Canard fariné puis mijoté avec du gluten de blé et des légumes, dans un bouillon épaissi et relevé de wasabi. Le plat de banquet de la cuisine de Kaga, servi dans un bol laqué.',
        photoQuery: 'Jibuni',
      },
      {
        id: 'spec-kanazawa-kanikoura',
        name: 'Crabe des neiges de Kaga',
        nameJa: '加能ガニ',
        kind: 'produit',
        description:
          'Zuwai-gani débarqué sur la côte d’Ishikawa, pêché de novembre à mars. La femelle, plus petite, est vendue avec ses œufs sous le nom de kōbako-gani et se mange en quelques semaines seulement.',
        // Le nom latin de l'espèce, faute de photo nommée « zuwaigani » sur Commons.
        photoQuery: 'Chionoecetes opilio',
      },
      {
        id: 'spec-kanazawa-wagashi',
        name: 'Wagashi de Kaga',
        nameJa: '加賀の和菓子',
        kind: 'douceur',
        description:
          'Troisième ville du Japon pour la consommation de pâtisseries traditionnelles, héritage de la culture du thé des Maeda. Le rakugan — sucre et farine de riz pressés dans un moule de bois — en est la forme la plus sèche.',
        photoQuery: 'Wagashi Kanazawa sweets',
      },
    ],
    specialitiesStatus: 'estimate',
    spots: [
      { name: 'Kenroku-en', coord: [136.6620, 36.5620], kind: 'nature' },
      { name: 'Higashi Chaya-gai', coord: [136.6660, 36.5720], kind: 'quartier' },
      { name: 'Marché Ōmichō', coord: [136.6570, 36.5700], kind: 'food' },
      { name: 'Musée d’art du XXIᵉ siècle', coord: [136.6580, 36.5600], kind: 'art' },
    ],
  },
  {
    id: 'toyama',
    name: 'Toyama',
    nameJa: '富山',
    region: 'Préfecture de Toyama',
    coord: [137.2130, 36.7010],
    stay: 'overnight',
    blurb:
      'Port de la mer du Japon adossé aux Alpes. Point de départ occidental de la route alpine Tateyama-Kurobe.',
    photoId: 'toyama',
    galleryQueries: ['Toyama city Japan', 'Fugan Canal Kansui Park', 'Toyama Bay Tateyama'],
    dates: sejour('11-16', '11-17'),
    nights: nuits(1),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'toyama-kansui',
        name: 'Parc Fugan Kansui',
        category: 'nature',
        description:
          'Ancien port fluvial transformé en promenade, avec une passerelle de bois et, par temps clair, les Alpes de Tateyama enneigées alignées derrière le canal.',
        photoQuery: 'Fugan Kansui Park Toyama',
        note: 'Le meilleur créneau pour la vue sur les Alpes est le lever du jour, avant que la brume ne monte — ce qui tombe bien avant le départ du 17.',
      },
      {
        id: 'toyama-chateau',
        name: 'Château de Toyama et son parc',
        category: 'culture',
        description:
          'Donjon reconstruit en 1954 sur les douves d’origine, au centre-ville, abritant le musée municipal. Le parc est le lieu de promenade du centre de Toyama.',
        photoQuery: 'Toyama Castle',
      },
      {
        id: 'toyama-glass',
        name: 'Musée du verre de Toyama',
        category: 'art',
        description:
          'Toyama a fait du verre sa politique culturelle depuis les années 1980. Le musée, dessiné par Kengo Kuma, occupe un bâtiment de bois et de verre en gradins, avec une installation permanente de Dale Chihuly au sommet.',
        photoQuery: 'Toyama Glass Art Museum',
        note: 'Fermé certains jeudis. Il partage le bâtiment avec la bibliothèque municipale, en accès libre.',
      },
      {
        id: 'toyama-iwaseh',
        name: 'Iwase et le tramway de la baie',
        category: 'quartier',
        description:
          'Ancien port de commerce du riz au nord de la ville, avec ses maisons d’armateurs et une brasserie de saké dans une demeure du XIXᵉ siècle. La ligne de tram Portram y descend depuis la gare.',
        photoQuery: 'Iwase Toyama',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-toyama-masuzushi',
        name: 'Masu-zushi',
        nameJa: '鱒寿司',
        kind: 'plat',
        description:
          'Truite salée pressée en un disque de riz vinaigré, enveloppée de feuilles de bambou et serrée sous un cerceau de bois. Le bentō de gare de Toyama depuis 1912, vendu à la découpe en parts triangulaires.',
        // En kana : les photos de masuzushi sont toutes nommées en japonais sur
        // Commons, aucune ne porte la translittération latine.
        photoQuery: 'ますのすし',
      },
      {
        id: 'spec-toyama-shiroebi',
        name: 'Shiro-ebi',
        nameJa: '白えび',
        kind: 'produit',
        description:
          'Petite crevette translucide pêchée presque exclusivement dans la fosse profonde de la baie de Toyama, surnommée « le joyau de la baie ». Servie crue en bol, ou frite en beignets.',
        photoQuery: 'Shiroebi',
      },
      {
        id: 'spec-toyama-buri',
        name: 'Kan-buri',
        nameJa: '寒ブリ',
        kind: 'produit',
        description:
          'Sériole d’hiver, remontée dans les filets d’Himi de fin novembre à février, quand la graisse est à son maximum. La saison commence tout juste au moment du passage.',
        // Le nom latin : « buri » seul remonte des parcs nationaux thaïlandais, et
        // « yellowtail sashimi » des assiettes américaines. Ici c'est le poisson
        // lui-même qui est la spécialité, pas une préparation.
        photoQuery: 'Seriola quinqueradiata',
      },
      {
        id: 'spec-toyama-blackramen',
        name: 'Ramen noir de Toyama',
        nameJa: '富山ブラック',
        kind: 'plat',
        description:
          'Bouillon presque noir de sauce de soja, très salé et poivré, créé dans l’après-guerre pour les ouvriers qui mangeaient leur riz avec. Ce n’est pas une soupe qu’on boit jusqu’au fond.',
        photoQuery: 'Toyama Black ramen',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Une seule nuit, et c’est la base de départ de la traversée du 17 : prévoir un hôtel près de la gare et vérifier le premier départ Dentetsu-Toyama → Tateyama.',
    ],
    spots: [
      { name: 'Château de Toyama', coord: [137.2130, 36.6930], kind: 'culture' },
      { name: 'Parc Fugan Kansui', coord: [137.2140, 36.7080], kind: 'nature' },
    ],
  },
  {
    id: 'tateyama',
    name: 'Route alpine Tateyama-Kurobe',
    nameJa: '立山黒部アルペンルート',
    region: 'Toyama → Nagano',
    coord: [137.5960, 36.5780],
    stay: 'day',
    blurb:
      'Traversée du massif de Tateyama en funiculaire, bus de montagne, téléphérique et bus électrique : de Toyama à Ōgizawa par Murodō (2 450 m) et le barrage de Kurobe.',
    photoId: 'tateyama',
    galleryQueries: ['Tateyama Kurobe Alpine Route', 'Kurobe Dam', 'Murodo Tateyama snow'],
    dates: sejour('11-17', '11-17'),
    nights: nuitsDeduites(0),
    accommodation: {
      status: 'todo',
      note: 'Traversée dans la journée du 17 novembre : aucune nuit sur la route alpine, la nuit du 17 est placée à Shinano-Ōmachi, à la sortie est.',
    },
    activities: [
      {
        id: 'tateyama-murodo',
        name: 'Plateau de Murodō',
        category: 'nature',
        description:
          'Point culminant de la traversée, à 2 450 m : un plateau volcanique entouré des sommets de Tateyama, avec des fumerolles de soufre à Jigokudani. La gare routière la plus haute du Japon.',
        photoQuery: 'Murodo Tateyama plateau',
        note: 'Mi-novembre, la neige est installée. Les sentiers du plateau peuvent être fermés et la visibilité nulle : la traversée reste possible, la promenade pas forcément.',
      },
      {
        id: 'tateyama-mikurigaike',
        name: 'Étang Mikuriga-ike',
        category: 'nature',
        description:
          'Cratère d’explosion rempli d’eau, à dix minutes de marche de Murodō, qui reflète la crête de Tateyama. Le plus profond des lacs d’altitude du massif.',
        photoQuery: 'Mikurigaike Pond Tateyama',
        note: 'Souvent gelé et sous la neige à cette date : le reflet est une image d’été et d’automne.',
      },
      {
        id: 'tateyama-kurobe',
        name: 'Barrage de Kurobe',
        category: 'nature',
        description:
          'Le plus haut barrage du Japon, 186 m de voûte, achevé en 1963 au prix de sept ans de chantier et de 171 morts. On le traverse à pied sur la crête, entre le lac et le vide.',
        photoQuery: 'Kurobe Dam Japan',
        note: 'Les lâchers d’eau en éventail, spectaculaires, s’arrêtent mi-octobre : en novembre le barrage est à sec côté aval.',
      },
      {
        id: 'tateyama-daikanbo',
        name: 'Belvédère de Daikanbō',
        category: 'nature',
        description:
          'Terrasse entre le téléphérique et le bus de tunnel, au-dessus du lac de Kurobe, avec la chaîne d’Ushiro-Tateyama en face. Le téléphérique qui y monte n’a aucun pylône sur 1 700 m.',
        photoQuery: 'Daikanbo Tateyama ropeway',
      },
      {
        id: 'tateyama-shomyo',
        name: 'Chutes de Shōmyō',
        category: 'nature',
        description:
          'Plus haute cascade du Japon, 350 m en quatre paliers, alimentée par les neiges de Tateyama. Elle se trouve sur la route du bus entre Bijodaira et Murodō.',
        photoQuery: 'Shomyo Falls Toyama',
        note: 'Visible depuis le bus, et accessible par une navette distincte depuis Tateyama — ce qui suppose de couper la traversée. À trancher selon l’horaire.',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-tateyama-damcurry',
        name: 'Kurobe Dam curry',
        nameJa: '黒部ダムカレー',
        kind: 'plat',
        description:
          'Curry vert servi au restaurant du barrage : le riz forme la voûte, la sauce fait le lac de retenue, une côtelette figure le bateau de tourisme. Né en 1965 à la cantine du chantier, devenu un plat que les visiteurs japonais viennent chercher exprès.',
        photoQuery: 'Kurobe Dam curry',
        where: 'Restaurant du belvédère du barrage de Kurobe, côté Ōgizawa',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Traversée prévue le 17 novembre 2026. La route est annoncée ouverte jusqu’au 30 novembre, mais toutes les sections ne ferment pas le même jour : le calendrier d’exploitation est à vérifier section par section sur alpen-route.com avant de bloquer les hôtels de Toyama et de Shinano-Ōmachi.',
      'Murodō culmine à 2 450 m : à cette date, c’est l’hiver — neige, verglas, vent, visibilité incertaine. Équipement chaud indispensable.',
      'Traversée d’ouest en est : les bagages ne suivent pas. À faire expédier de Toyama vers Shinano-Ōmachi ou directement vers Nagano (takkyūbin), la veille.',
      'Si une section ferme avant le 17, la traversée devient impossible et cette étape saute : c’est le point de rupture unique du voyage. Prévoir un plan B par le train Toyama → Nagano (via Nagano-Hokuriku Shinkansen), non renseigné ici.',
    ],
    spots: [
      { name: 'Murodō (2 450 m)', coord: [137.5960, 36.5780], kind: 'nature' },
      { name: 'Étang Mikuriga-ike', coord: [137.5940, 36.5760], kind: 'nature' },
      { name: 'Barrage de Kurobe', coord: [137.6640, 36.5660], kind: 'nature' },
    ],
  },
  {
    id: 'omachi',
    name: 'Shinano-Ōmachi',
    nameJa: '信濃大町',
    region: 'Préfecture de Nagano',
    coord: [137.8580, 36.5030],
    stay: 'overnight',
    blurb:
      'Petite ville au pied de la sortie est de la route alpine, adossée aux lacs Nishina et au massif d’Ushiro-Tateyama. Porte d’entrée du parc national des Alpes du Nord.',
    photoId: 'omachi',
    galleryQueries: ['Omachi Nagano', 'Lake Kizaki Nagano', 'Nishina Three Lakes'],
    dates: sejour('11-17', '11-18'),
    nights: nuitsDeduites(1),
    accommodation: {
      status: 'todo',
      note: 'Ōmachi Onsen-kyō, station thermale située sur la ligne de bus Ōgizawa → Shinano-Ōmachi, est plus proche de la sortie de la route alpine que la gare : à comparer. Disponibilité mi-novembre à vérifier, la saison de ski n’est pas encore ouverte.',
    },
    activities: [
      {
        id: 'omachi-onsenkyo',
        name: 'Ōmachi Onsen-kyō',
        category: 'onsen',
        description:
          'Petite station thermale sur la route de la sortie est de la route alpine, à l’entrée du parc national. Eau sulfatée, une dizaine d’auberges, plusieurs bains extérieurs face aux Alpes.',
        photoQuery: 'Omachi Onsen Nagano',
        note: 'C’est l’activité qui va avec cette étape : arriver d’Ōgizawa en fin d’après-midi et se mettre dans un bain. Plusieurs auberges ouvrent leurs bains aux visiteurs de passage.',
      },
      {
        id: 'omachi-alpine-museum',
        name: 'Musée alpin d’Ōmachi',
        category: 'culture',
        description:
          'Musée consacré à l’histoire de l’alpinisme dans les Alpes du Nord et à la géologie du massif, avec la mémoire du chantier du barrage de Kurobe vu du côté de Shinano-Ōmachi.',
        photoQuery: 'Omachi Alpine Museum',
        note: 'Horaires réduits hors saison et jour de fermeture hebdomadaire : à vérifier selon l’heure de sortie de la route alpine.',
      },
      {
        id: 'omachi-nishina',
        name: 'Les trois lacs de Nishina',
        category: 'nature',
        description:
          'Kizaki, Nakatsuna et Aoki : trois lacs alignés au pied du massif d’Ushiro-Tateyama, sur la faille de la fosse magna. Reflets des sommets enneigés au petit matin.',
        photoQuery: 'Lake Kizaki Omachi Nagano',
        note: 'Sur la ligne JR Ōito, entre Shinano-Ōmachi et Hakuba : visibles depuis le train du 18 au matin, sans détour.',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-omachi-shinshu-salmon',
        name: 'Saumon du Shinshū',
        nameJa: '信州サーモン',
        kind: 'produit',
        description:
          'Truite d’élevage mise au point par la préfecture de Nagano dans l’eau froide des Alpes, chair orange et grasse, servie crue. Un produit de terre ferme dans une province sans littoral.',
        photoQuery: 'Salmon sashimi',
      },
      {
        id: 'spec-omachi-soba',
        name: 'Soba d’Ōmachi',
        nameJa: '大町そば',
        kind: 'plat',
        description:
          'Le sarrasin pousse sur les cônes de déjection au pied des Alpes. Ōmachi et la vallée d’Azumino comptent parmi les terroirs de soba les plus réputés du Shinshū.',
        photoQuery: 'Zaru soba',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Étape ajoutée pour couper la journée du 17 novembre : la traversée de la route alpine s’arrête à Ōgizawa, on descend à Shinano-Ōmachi et on rejoint Nagano le lendemain matin. Cela retire 1 h 50 de train et une correspondance à la journée la plus lourde du voyage, qui passe d’environ 9 h à 7 h porte à porte.',
      'Ta table donne « 17–18 nov. Tateyama → Nagano, 1 nuit » : c’est cette nuit-là, ici plutôt qu’à Nagano. Le nombre de nuits du voyage est inchangé (29), et Nagano retrouve exactement les 2 nuits que ta table lui donne.',
      'Cette étape reste une coupure, pas une visite : les trois activités proposées ci-dessus tiennent en une soirée et une matinée, et sont à confirmer selon l’heure de sortie de la route alpine — qui n’est pas connue à ce jour.',
    ],
    spots: [
      { name: 'Gare de Shinano-Ōmachi', coord: [137.8580, 36.5030], kind: 'quartier' },
      { name: 'Lac Kizaki', coord: [137.8330, 36.5560], kind: 'nature' },
    ],
  },
  {
    id: 'nagano',
    name: 'Nagano',
    nameJa: '長野',
    region: 'Préfecture de Nagano',
    coord: [138.1880, 36.6430],
    stay: 'overnight',
    blurb:
      'Ville née autour du Zenkō-ji, temple fondé au VIIᵉ siècle qui abrite la plus ancienne statue bouddhique du Japon.',
    photoId: 'nagano',
    galleryQueries: ['Zenkoji Nagano temple', 'Jigokudani snow monkey', 'Obuse Nagano'],
    dates: sejour('11-18', '11-20'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'nagano-zenkoji',
        name: 'Zenkō-ji',
        category: 'culture',
        description:
          'Temple fondé au VIIᵉ siècle, antérieur à la division du bouddhisme japonais en écoles : il n’appartient donc à aucune. Il abrite la plus ancienne statue bouddhique du pays, que personne n’a le droit de voir.',
        photoQuery: 'Zenkoji Nagano main hall',
        note: 'Sous le sanctuaire intérieur, un couloir totalement noir où l’on cherche à tâtons une clef fixée au mur, censée valoir le salut. C’est l’attrait principal pour les pèlerins japonais.',
      },
      {
        id: 'nagano-jigokudani',
        name: 'Singes de Jigokudani',
        category: 'nature',
        description:
          'Les seuls macaques au monde qui se baignent dans une source chaude, dans une gorge de la vallée de Yokoyu. Le bain a été aménagé en 1964 pour les éloigner de ceux des humains.',
        photoQuery: 'Jigokudani snow monkey hot spring',
        note: 'Un bus jusqu’à Kanbayashi puis 1,6 km de sentier forestier en montée. Les singes sont là toute l’année, mais sans la neige avant janvier — fin novembre donne le bain, pas l’image de carte postale.',
      },
      {
        id: 'nagano-obuse',
        name: 'Obuse',
        category: 'culture',
        description:
          'Petit bourg de marchands à 30 min de train, où Hokusai a passé ses dernières années : le musée Hokusai-kan y conserve les plafonds de chars qu’il a peints à plus de 80 ans. C’est aussi la capitale de la châtaigne.',
        photoQuery: 'Obuse Nagano town',
        note: 'Très fréquenté par les visiteurs japonais, presque pas par les étrangers. Se combine avec Jigokudani : c’est sur la même ligne Nagano Dentetsu.',
      },
      {
        id: 'nagano-togakushi',
        name: 'Togakushi-jinja',
        category: 'culture',
        description:
          'Sanctuaire de montagne en cinq sites étagés, dont le plus haut s’atteint par une allée de cryptomères de quatre siècles, hauts de quarante mètres. Ancien centre d’ascèse de moines-guerriers.',
        photoQuery: 'Togakushi Shrine cedar avenue',
        note: 'Une heure de bus depuis Nagano, et de la marche en altitude : à cette saison, vérifier l’état de la route et la neige avant de s’engager sur le sanctuaire supérieur.',
      },
      {
        id: 'nagano-joyama',
        name: 'Nakamise de Zenkō-ji et Nishinomon',
        category: 'quartier',
        description:
          'L’avenue de 1,8 km qui monte de la gare au temple est l’ancienne rue de pèlerinage, encore bordée d’auberges de moines, de boutiques de miso et de sept ruelles transversales de maisons de bois.',
        photoQuery: 'Zenkoji Nakamise street Nagano',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-nagano-oyaki',
        name: 'Oyaki de Zenkō-ji',
        nameJa: 'おやき',
        kind: 'plat',
        description:
          'Chaussons de sarrasin fourrés de légumes de montagne, grillés sur la pierre ou cuits sous la cendre. Vendus chauds tout le long de l’allée du temple.',
        photoQuery: 'Oyaki dumpling Nagano',
      },
      {
        id: 'spec-nagano-miso',
        name: 'Miso de Shinshū',
        nameJa: '信州味噌',
        kind: 'produit',
        description:
          'Miso de riz clair et salé, longuement fermenté, qui représente à lui seul une bonne moitié de la production japonaise. Plusieurs fabriques historiques dans la rue du temple.',
        // « Miso » seul remontait un pot de miso viennois au habanero. La pâte, donc,
        // et non le pot : la vignette montre du miso, pas celui de Shinshū en
        // particulier — aucune photo n'en existe.
        photoQuery: 'Miso paste',
      },
      {
        id: 'spec-nagano-kuri',
        name: 'Châtaignes d’Obuse',
        nameJa: '小布施栗',
        kind: 'douceur',
        description:
          'Châtaignes cultivées à Obuse depuis le XIVᵉ siècle et offertes au shogun. Transformées en kuri-kanoko et en kuri-yōkan par des confiseurs installés là depuis plus de deux siècles.',
        photoQuery: 'Kurikinton',
      },
      {
        id: 'spec-nagano-apple',
        name: 'Pommes du Shinshū',
        nameJa: '信州りんご',
        kind: 'produit',
        description:
          'Deuxième région pomicole du Japon. Novembre est le cœur de la récolte des variétés tardives, Fuji et Shinano-gold : c’est la bonne semaine pour en acheter au bord de la route.',
        photoQuery: 'Nagano apples orchard',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Deux nuits, exactement comme ta table les donne (« 18–20 nov. Nagano, 2 nuits ») : la nuit du 17 est désormais à Shinano-Ōmachi, voir l’étape précédente.',
      'Deux nuits pour le Zenkō-ji, les singes de Jigokudani et éventuellement Obuse : c’est l’étape la plus confortable en temps du voyage. Si tu cherches une nuit à déplacer ailleurs — Kurashiki, par exemple —, c’est ici qu’elle est.',
      'Fin novembre est tôt pour voir les singes dans la neige : l’image attendue est plutôt celle de janvier-février. Les singes sont là toute l’année, mais sans le décor.',
    ],
    spots: [{ name: 'Zenkō-ji', coord: [138.1875, 36.6620], kind: 'culture' }],
  },
  {
    id: 'kurashiki',
    name: 'Kurashiki',
    nameJa: '倉敷',
    region: 'Préfecture d’Okayama',
    coord: [133.7690, 34.6010],
    stay: 'overnight',
    blurb:
      'Quartier Bikan : canal bordé d’entrepôts à riz blanchis à la chaux, saules et musée Ōhara — le premier musée d’art occidental du Japon.',
    photoId: 'kurashiki',
    galleryQueries: ['Kurashiki Bikan historical quarter', 'Kurashiki canal', 'Ohara Museum of Art'],
    dates: sejour('11-20', '11-21'),
    nights: nuits(1),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'kurashiki-bikan',
        name: 'Quartier Bikan',
        category: 'quartier',
        description:
          'Canal creusé au XVIIᵉ siècle pour acheminer le riz de l’intérieur vers la mer, bordé d’entrepôts aux murs blancs à jointures noires, de saules et de barques à fond plat.',
        photoQuery: 'Kurashiki Bikan canal',
        note: 'Le quartier s’éclaire à la tombée de la nuit et se vide de ses visiteurs à la journée : c’est le meilleur moment, et il tombe le soir du 20.',
      },
      {
        id: 'kurashiki-ohara',
        name: 'Musée d’art Ōhara',
        category: 'art',
        description:
          'Premier musée d’art occidental du Japon, ouvert en 1930 par un industriel du textile local. Greco, Monet, Gauguin, Rodin — achetés en Europe pour son peintre ami avant la guerre.',
        photoQuery: 'Ohara Museum of Art Kurashiki',
        note: 'Fermé le lundi. Le 21 novembre 2026 est un samedi : compatible, sous réserve de fermeture exceptionnelle.',
      },
      {
        id: 'kurashiki-ivy',
        name: 'Ivy Square',
        category: 'culture',
        description:
          'Filature de coton en brique rouge de 1889, couverte de lierre, reconvertie en hôtel, ateliers et musées. C’est de cette usine que vient la fortune qui a payé le musée Ōhara.',
        photoQuery: 'Kurashiki Ivy Square',
      },
      {
        id: 'kurashiki-achi',
        name: 'Sanctuaire Achi et le mont Tsurugata',
        category: 'nature',
        description:
          'La colline qui domine le quartier Bikan, avec un pin taillé en éventail de 500 ans dans l’enceinte du sanctuaire, et la vue sur les toits de tuiles depuis le sentier.',
        photoQuery: 'Achi Shrine Kurashiki',
      },
      {
        id: 'kurashiki-denim',
        name: 'Rue du denim',
        category: 'quartier',
        description:
          'Kojima, quartier sud de Kurashiki, produit l’essentiel du denim japonais et a fabriqué le premier jean du pays en 1965. Une rue d’ateliers et de boutiques d’usine, très courue des Japonais.',
        photoQuery: 'Kojima Jeans Street',
        note: 'Kojima est à une vingtaine de minutes en train et bus du quartier Bikan : peu compatible avec une seule nuit et une matinée. À écarter, sauf si le denim est une raison de venir.',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-kurashiki-mamakari',
        name: 'Mamakari',
        nameJa: 'ままかり',
        kind: 'plat',
        description:
          'Petit sprat de la mer intérieure, mariné au vinaigre. Son nom signifie « emprunter du riz au voisin » : on en mangerait tellement qu’on finirait sa ration.',
        photoQuery: 'Mamakari',
      },
      {
        id: 'spec-kurashiki-barazushi',
        name: 'Bara-zushi',
        nameJa: 'ばら寿司',
        kind: 'plat',
        description:
          'Riz vinaigré recouvert de poisson, de crevettes et de légumes en couches. Né, dit-on, d’un décret seigneurial limitant les repas à un plat : tout a été mis dans le même.',
        // Le même plat sous son autre nom d'Okayama : « chirashizushi » remonte des
        // assiettes de sushi quelconques, « matsuri-zushi » les photos prises ici.
        photoQuery: 'Matsuri zushi Okayama',
      },
      {
        id: 'spec-kurashiki-kibidango',
        name: 'Kibi dango',
        nameJa: 'きび団子',
        kind: 'douceur',
        description:
          'Boulettes de millet et de riz gluant, souvenir d’Okayama, rattachées à la légende de Momotarō — l’enfant né d’une pêche, que la province revendique comme sienne.',
        photoQuery: 'Kibi dango Okayama',
      },
      {
        id: 'spec-kurashiki-muscat',
        name: 'Raisin et pêches d’Okayama',
        nameJa: '岡山の果物',
        kind: 'produit',
        description:
          'La préfecture est surnommée « le pays du soleil » pour son faible taux de pluie : muscat d’Alexandrie et pêches blanches y sont cultivés sous serre et vendus à prix de cadeau.',
        photoQuery: 'Muscat of Alexandria',
        note: 'La saison du muscat s’achève en octobre : fin novembre, il faudra se contenter des conserves et des pâtisseries.',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Une seule nuit, précédée d’une journée de transport de ~5 h 15 depuis Nagano : la visite du quartier Bikan se fera surtout le matin du 21.',
      'Le musée Ōhara ferme le lundi. Le 20 novembre 2026 est un vendredi et le 21 un samedi : c’est compatible, mais à revérifier (fermetures exceptionnelles).',
    ],
    spots: [
      { name: 'Quartier Bikan', coord: [133.7715, 34.5951], kind: 'quartier' },
      { name: 'Musée d’art Ōhara', coord: [133.7727, 34.5947], kind: 'art' },
      { name: 'Ivy Square', coord: [133.7740, 34.5940], kind: 'culture' },
    ],
  },
  {
    id: 'hiroshima',
    name: 'Hiroshima & Miyajima',
    nameJa: '広島・宮島',
    region: 'Préfecture de Hiroshima',
    coord: [132.4750, 34.3980],
    stay: 'overnight',
    blurb:
      'Le dôme de Genbaku et le parc du Mémorial de la Paix, classés au patrimoine mondial, dans une ville entièrement reconstruite après 1945. Miyajima, à une heure de là, porte le torii d’Itsukushima planté dans la mer.',
    photoId: 'hiroshima',
    galleryQueries: [
      'Itsukushima Shrine torii Miyajima',
      'Hiroshima Peace Memorial Park',
      'Momijidani Park Miyajima autumn',
      'Hiroshima city',
    ],
    dates: sejour('11-21', '11-23'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'hiroshima-dome',
        name: 'Dôme de Genbaku et parc du Mémorial de la Paix',
        category: 'culture',
        description:
          'Les ruines de l’ancienne chambre de commerce, laissées en l’état sous l’hypocentre, et le parc qui prolonge son axe : le cénotaphe, la flamme, le monument aux enfants et ses milliers de grues de papier.',
        photoQuery: 'Genbaku Dome Hiroshima',
      },
      {
        id: 'hiroshima-musee',
        name: 'Musée du Mémorial de la Paix',
        category: 'culture',
        description:
          'Le récit du 6 août 1945 par les objets de ceux qui l’ont vécu. Le bâtiment principal, de Kenzō Tange, est le premier édifice moderniste japonais classé bien culturel important.',
        photoQuery: 'Hiroshima Peace Memorial Museum',
        note: 'Compter deux heures, et un moment difficile. C’est la visite que tous les écoliers japonais font au moins une fois.',
      },
      {
        id: 'hiroshima-itsukushima',
        name: 'Sanctuaire d’Itsukushima',
        category: 'culture',
        description:
          'Sanctuaire sur pilotis dont le grand torii vermillon est planté dans la mer : l’île entière était considérée comme divine, et l’on n’y accostait que par cette porte, à marée haute.',
        photoQuery: 'Itsukushima Shrine floating torii',
        note: 'Tout dépend de la marée : le torii dans l’eau à marée haute, accessible à pied à marée basse. Les horaires de marée de la journée choisie décident du programme.',
      },
      {
        id: 'hiroshima-momijidani',
        name: 'Vallée de Momijidani',
        category: 'nature',
        description:
          'Un vallon derrière le sanctuaire planté de deux cents érables, au pied du mont Misen. Les cerfs sika y circulent librement, comme partout sur l’île.',
        photoQuery: 'Momijidani Park Miyajima maple',
        note: 'Fin novembre est le pic des couleurs : c’est aussi la semaine la plus chargée de l’année sur l’île.',
      },
      {
        id: 'hiroshima-misen',
        name: 'Mont Misen',
        category: 'nature',
        description:
          'Sommet de l’île à 535 m, avec une forêt primaire, des rochers en équilibre et une flamme que la tradition dit allumée sans interruption depuis douze siècles — celle qui a servi à allumer la flamme de la Paix.',
        photoQuery: 'Mount Misen Miyajima',
        note: 'Téléphérique jusqu’à Shishiiwa, puis 30 min de marche rocailleuse jusqu’au vrai sommet. Le téléphérique ferme tôt.',
      },
      {
        id: 'hiroshima-shukkeien',
        name: 'Jardin Shukkei-en',
        category: 'nature',
        description:
          'Jardin de promenade de 1620 organisé autour d’un étang qui imite un lac chinois, avec un pont de pierre en dos d’âne. Rasé en 1945, il a été replanté à l’identique.',
        photoQuery: 'Shukkeien Garden Hiroshima',
      },
      {
        id: 'hiroshima-okonomi',
        name: 'Okonomimura',
        category: 'food',
        description:
          'Un immeuble de trois étages entièrement occupé par des comptoirs d’okonomiyaki, une vingtaine en tout, chacun autour de sa plaque chauffante. Institution locale née des baraques de l’après-guerre.',
        photoQuery: 'Okonomimura Hiroshima',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-hiroshima-okonomiyaki',
        name: 'Okonomiyaki de Hiroshima',
        nameJa: 'お好み焼き',
        kind: 'plat',
        description:
          'Contrairement à celui d’Osaka, il est monté en couches sans mélanger la pâte : crêpe fine, montagne de chou, nouilles yakisoba, œuf sur le dessus. Né du rationnement de la farine après 1945.',
        photoQuery: 'Hiroshima okonomiyaki',
      },
      {
        id: 'spec-hiroshima-kaki',
        name: 'Huîtres de la mer intérieure',
        nameJa: '広島牡蠣',
        kind: 'produit',
        description:
          'Hiroshima fournit à elle seule une bonne moitié des huîtres du Japon, élevées sur radeaux dans la baie. La saison ouvre en novembre : grillées en coquille dans les rues de Miyajima.',
        photoQuery: 'Grilled oysters Miyajima',
      },
      {
        id: 'spec-hiroshima-momiji',
        name: 'Momiji manjū',
        nameJa: 'もみじ饅頭',
        kind: 'douceur',
        description:
          'Petits gâteaux en forme de feuille d’érable, fourrés de pâte de haricot, inventés à Miyajima vers 1906 pour les pèlerins. On les trouve aussi frits sur brochette.',
        photoQuery: 'Momiji manju Miyajima',
      },
      {
        id: 'spec-hiroshima-tsukemen',
        name: 'Tsuke-men de Hiroshima',
        nameJa: '広島つけ麺',
        kind: 'plat',
        description:
          'Nouilles froides à tremper dans une sauce pimentée, servies avec du chou et du concombre. Plat d’été à l’origine, mangé toute l’année, et propre à la ville.',
        photoQuery: 'Tsukemen',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Miyajima n’était pas dans l’itinéraire que tu m’avais donné au départ : ta table l’ajoute. Traité ici comme une excursion depuis Hiroshima (train JR ligne San’yō jusqu’à Miyajimaguchi, puis ferry), et non comme une étape avec nuit — dis-moi si tu voulais dormir sur l’île.',
      'Deux nuits pour la ville et l’île : compter une demi-journée à Hiroshima et une journée entière à Miyajima, transferts compris.',
      'Fin novembre est le pic des couleurs d’automne dans la vallée de Momijidani : c’est la plus belle période et la plus fréquentée. Ferries et hébergements se remplissent.',
      'Une taxe de séjour insulaire (visitor tax) est perçue à l’embarquement pour Miyajima, en plus du billet de ferry.',
    ],
    spots: [
      { name: 'Dôme de Genbaku', coord: [132.4536, 34.3955], kind: 'culture' },
      { name: 'Parc du Mémorial de la Paix', coord: [132.4520, 34.3917], kind: 'culture' },
      { name: 'Jardin Shukkei-en', coord: [132.4680, 34.4010], kind: 'nature' },
      { name: 'Torii d’Itsukushima (Miyajima)', coord: [132.3196, 34.2960], kind: 'culture' },
      { name: 'Vallée de Momijidani (Miyajima)', coord: [132.3230, 34.2900], kind: 'nature' },
      { name: 'Mont Misen (Miyajima)', coord: [132.3190, 34.2770], kind: 'nature' },
    ],
  },
  {
    id: 'naoshima',
    name: 'Naoshima',
    nameJa: '直島',
    region: 'Préfecture de Kagawa',
    coord: [133.9970, 34.4560],
    stay: 'day',
    blurb:
      'Île-musée de la mer intérieure de Seto : architecture de Tadao Andō, collections Benesse, et les citrouilles de Yayoi Kusama posées face à la mer.',
    photoId: 'naoshima',
    galleryQueries: ['Naoshima Kagawa island', 'Yayoi Kusama pumpkin Naoshima', 'Benesse House Naoshima'],
    dates: sejour('11-23', '11-23'),
    nights: nuitsDeduites(0),
    accommodation: {
      status: 'todo',
      note: 'Visite dans la journée du 23 novembre, en chemin vers Takamatsu où sont placées les deux nuits.',
    },
    activities: [
      {
        id: 'naoshima-chichu',
        name: 'Chichū Art Museum',
        category: 'art',
        description:
          'Musée entièrement enterré dessiné par Tadao Andō, éclairé à la seule lumière du jour : cinq Nymphéas de Monet dans une salle de marbre blanc, et des pièces de Turrell et De Maria construites sur mesure.',
        photoQuery: 'Chichu Art Museum Naoshima',
        note: 'Réservation obligatoire par créneau horaire, en ligne et à l’avance. C’est le point à régler avant tout le reste de la journée.',
      },
      {
        id: 'naoshima-benesse',
        name: 'Benesse House Museum',
        category: 'art',
        description:
          'Musée et hôtel dans le même bâtiment, sur une colline face à la mer intérieure : les œuvres sont accrochées dans des couloirs ouverts sur l’extérieur, sans vitre ni climatisation.',
        photoQuery: 'Benesse House Museum Naoshima',
      },
      {
        id: 'naoshima-pumpkins',
        name: 'Les citrouilles de Yayoi Kusama',
        category: 'art',
        description:
          'La rouge, creuse et pénétrable, à la descente du ferry de Miyanoura ; la jaune à pois noirs, posée sur un ancien quai de béton à l’autre bout de l’île, face au large.',
        // Pas de `photoQuery` : aucune photo de cette œuvre n'est disponible sous
        // licence libre sur Commons, et on n'en publie pas d'autre. L'entrée
        // s'affiche sans image plutôt qu'avec la photo d'un autre sujet.
        note: 'La citrouille jaune a été emportée par un typhon en 2021 et réinstallée en 2022 : c’est bien la même œuvre, refabriquée. Aucune photo libre de droits n’existe pour cette sculpture : elle est donc décrite ici, pas montrée.',
      },
      {
        id: 'naoshima-arthouse',
        name: 'Art House Project à Honmura',
        category: 'art',
        description:
          'Sept maisons vides du vieux village confiées à des artistes : un temple à escalier de verre, une pièce inondée où des chiffres lumineux comptent sous l’eau, une salle qu’on traverse dans le noir total.',
        photoQuery: 'Art House Project Honmura Naoshima',
        note: 'Billet commun aux maisons, à retirer au centre de Honmura. Elles sont dispersées dans les ruelles : compter deux heures.',
      },
      {
        id: 'naoshima-ando',
        name: 'Andō Museum',
        category: 'art',
        description:
          'Une maison de bois centenaire de Honmura dont l’intérieur a été entièrement refait en béton par Tadao Andō : le contraste des deux matières est le sujet même du musée.',
        photoQuery: 'Ando Museum Naoshima',
      },
    ],
    activitiesStatus: 'estimate',
    warnings: [
      'Le 23 novembre 2026 est un lundi — jour de fermeture des musées de l’île — mais c’est aussi un jour férié (Kinrō Kansha no Hi). Le réseau Benesse ouvre les lundis fériés et reporte alors la fermeture au mardi, soit le 24. Si cette règle vaut encore en 2026, l’île se visite donc le 23 et pas le 24. À vérifier sur benesse-artsite.jp : c’est ce point qui décide de l’ordre des deux journées.',
      'Le 23 cumule ~2 h 40 de transport depuis Hiroshima et la visite de l’île, bagages en main : journée très chargée.',
      'Le Chichū Art Museum se réserve à l’avance, par créneau horaire.',
      'Visite avec les bagages : vérifier les consignes du port de Miyanoura.',
    ],
    spots: [
      { name: 'Chichū Art Museum', coord: [133.9930, 34.4520], kind: 'art' },
      { name: 'Benesse House Museum', coord: [133.9980, 34.4480], kind: 'art' },
      { name: 'Red Pumpkin (Miyanoura)', coord: [133.9942, 34.4642], kind: 'art' },
      { name: 'Yellow Pumpkin', coord: [134.0010, 34.4470], kind: 'art' },
    ],
  },
  {
    id: 'takamatsu',
    name: 'Takamatsu',
    nameJa: '高松',
    region: 'Préfecture de Kagawa, Shikoku',
    coord: [134.0470, 34.3500],
    stay: 'overnight',
    blurb:
      'Porte d’entrée de Shikoku, patrie des udon sanuki. Le jardin Ritsurin y déploie six étangs et treize collines composées.',
    photoId: 'takamatsu',
    galleryQueries: ['Takamatsu Kagawa city', 'Ritsurin Garden autumn', 'Kotohira-gu shrine'],
    dates: sejour('11-23', '11-25'),
    nights: nuitsDeduites(2),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'takamatsu-ritsurin',
        name: 'Jardin Ritsurin',
        category: 'nature',
        description:
          'Six étangs et treize collines composées sur 75 hectares, avec le mont Shiun en fond de décor emprunté. Un siècle de travaux des seigneurs Matsudaira, et un pavillon de thé au bord de l’eau.',
        photoQuery: 'Ritsurin Garden Takamatsu',
        note: 'Ouvert du lever au coucher du soleil, sans jour de fermeture. Fin novembre, les érables du jardin nord sont éclairés le soir certaines semaines.',
      },
      {
        id: 'takamatsu-tamamo',
        name: 'Château de Tamamo',
        category: 'culture',
        description:
          'Un des rares châteaux du Japon dont les douves sont remplies d’eau de mer, à même le port : on y entrait en bateau. Le donjon a disparu, les tourelles et la porte d’eau sont d’origine.',
        photoQuery: 'Takamatsu Castle Tamamo',
      },
      {
        id: 'takamatsu-kotohira',
        name: 'Kotohira-gū',
        category: 'culture',
        description:
          'Sanctuaire des marins au sommet de 785 marches, l’un des grands pèlerinages populaires du Japon depuis l’époque d’Edo — « aller à Konpira » était le voyage d’une vie pour les gens du peuple.',
        photoQuery: 'Kotohiragu shrine Kagawa',
        note: 'Une heure de train depuis Takamatsu. Les 785 marches sont réelles ; des porteurs en palanquin ont longtemps fait le trajet pour ceux qui ne pouvaient pas monter.',
      },
      {
        id: 'takamatsu-yashima',
        name: 'Plateau de Yashima',
        category: 'nature',
        description:
          'Mesa au-dessus de la mer intérieure, site d’une bataille décisive de 1185 entre les clans Taira et Minamoto. Vue sur les îles, et un musée de maisons traditionnelles de Shikoku au pied.',
        photoQuery: 'Yashima Takamatsu view',
      },
      {
        id: 'takamatsu-udon',
        name: 'Tournée des udon sanuki',
        category: 'food',
        description:
          'La préfecture de Kagawa compte des centaines de fabriques d’udon, dont beaucoup ne servent qu’à midi et où l’on cuit ses nouilles soi-même dans un panier. Les Japonais viennent exprès en faire la tournée.',
        photoQuery: 'Sanuki udon Kagawa',
        note: 'Beaucoup ferment vers 14 h, et le lundi. Les plus réputées sont à la campagne, hors de la ville.',
      },
      {
        id: 'takamatsu-shikoku-mura',
        name: 'Shikoku Mura',
        category: 'culture',
        description:
          'Trente-trois bâtiments ruraux de Shikoku remontés à flanc de colline : un théâtre de kabuki de village, une maison de fabrication de sucre, un pont de lianes suspendu de la vallée d’Iya.',
        photoQuery: 'Shikoku Mura',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-takamatsu-udon',
        name: 'Udon sanuki',
        nameJa: '讃岐うどん',
        kind: 'plat',
        description:
          'Nouilles de blé épaisses et très fermes, la spécialité qui définit la préfecture — premier consommateur d’udon du pays, et de loin. Servies froides avec un filet de soja, ou dans un bouillon clair.',
        photoQuery: 'Sanuki udon noodles',
      },
      {
        id: 'spec-takamatsu-honetsuki',
        name: 'Honetsuki-dori',
        nameJa: '骨付鳥',
        kind: 'plat',
        description:
          'Cuisse de poulet entière avec l’os, marinée à l’ail et rôtie longuement au four. Née à Marugame dans les années 1950, elle se mange à la main et se partage.',
        photoQuery: 'Honetsukidori',
      },
      {
        id: 'spec-takamatsu-wasanbon',
        name: 'Wasanbon',
        nameJa: '和三盆',
        kind: 'douceur',
        description:
          'Sucre de canne raffiné à la main à Kagawa et Tokushima, pétri et séché pendant des semaines : il fond en poudre et sert aux wagashi les plus fins. Moulé en petites figures colorées.',
        photoQuery: 'Wasanbon',
      },
      {
        id: 'spec-takamatsu-olive',
        name: 'Olives et huile de Shōdoshima',
        nameJa: '小豆島オリーブ',
        kind: 'produit',
        description:
          'L’île voisine de Shōdoshima a réussi les premières oliveraies du Japon en 1908 et en reste le principal producteur. Olives en saumure, huile, et même du bœuf nourri de tourteaux d’olive.',
        photoQuery: 'Shodoshima olive Japan',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Ta table réunit « Takamatsu/Naoshima » en une ligne de 2 nuits. Les deux nuits sont donc placées ici, à Takamatsu, et Naoshima devient une visite dans la journée du 23 : une seule réservation d’hôtel. Si tu voulais dormir sur Naoshima, c’est à changer.',
      'Autre montage possible, si Naoshima est fermé le 23 : rejoindre Takamatsu directement le 23 et faire l’île en excursion le 24. Le trajet du 23 change alors complètement.',
    ],
    spots: [
      { name: 'Jardin Ritsurin', coord: [134.0430, 34.3290], kind: 'nature' },
      { name: 'Château de Tamamo', coord: [134.0510, 34.3510], kind: 'culture' },
    ],
  },
  {
    id: 'matsuyama',
    name: 'Matsuyama',
    nameJa: '松山',
    region: 'Préfecture d’Ehime, Shikoku',
    coord: [132.7657, 33.8416],
    stay: 'overnight',
    blurb:
      'Plus grande ville de Shikoku. Son donjon d’origine domine la colline de Katsuyama, et Dōgo Onsen, mentionné dès les plus anciennes chroniques du Japon, se visite dans un bâtiment de bois de 1894.',
    photoId: 'matsuyama',
    galleryQueries: ['Matsuyama Ehime city', 'Dogo Onsen Honkan', 'Matsuyama Castle Ehime'],
    dates: sejour('11-25', '11-27'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'matsuyama-chateau',
        name: 'Château de Matsuyama',
        category: 'culture',
        description:
          'Donjon d’origine au sommet de la colline de Katsuyama, un des douze qui n’ont jamais brûlé. L’enceinte est un labyrinthe de portes et de cours conçu pour piéger l’assaillant, encore lisible tel quel.',
        photoQuery: 'Matsuyama Castle keep Ehime',
        note: 'Un télésiège et un funiculaire montent à mi-pente ; le reste se fait à pied. Le parc du sommet est libre, le donjon payant.',
      },
      {
        id: 'matsuyama-dogo',
        name: 'Dōgo Onsen Honkan',
        category: 'onsen',
        description:
          'Bain public de 1894 en bois à trois étages, couronné d’une tour à tambour : le plus ancien onsen en activité du Japon, mentionné dans les chroniques du VIIIᵉ siècle. Il possède encore un bain réservé à la famille impériale.',
        photoQuery: 'Dogo Onsen Honkan Matsuyama',
        note: 'Le bâtiment sort d’une restauration par tranches étalée sur plusieurs années : vérifier quelles salles et quels étages sont ouverts au moment du passage.',
      },
      {
        id: 'matsuyama-dogo-quartier',
        name: 'Rue commerçante de Dōgo et Asuka-no-yu',
        category: 'quartier',
        description:
          'Galerie couverte qui monte du terminus du tramway au bain historique, avec une horloge à automates qui joue toutes les heures. Deux autres bains publics complètent le Honkan, dont un de style Asuka.',
        photoQuery: 'Botchan Karakuri Clock',
      },
      {
        id: 'matsuyama-ishiteji',
        name: 'Ishite-ji',
        category: 'culture',
        description:
          'Cinquante-et-unième des 88 temples du pèlerinage de Shikoku, avec une porte du XIVᵉ siècle classée trésor national et un tunnel creusé dans la colline, tapissé de statues.',
        photoQuery: 'Ishiteji temple Matsuyama',
        note: 'Les pèlerins en blanc du circuit des 88 temples y passent toute l’année : c’est le lieu le plus vivant de la ville sur ce plan.',
      },
      {
        id: 'matsuyama-botchan',
        name: 'Tramway Botchan et le centre-ville',
        category: 'quartier',
        description:
          'Réplique à vapeur du tram de 1888 que Natsume Sōseki décrit dans Botchan, roman écrit ici. Le réseau de tramways ordinaire, lui, dessert toute la ville et reste le moyen de s’y déplacer.',
        photoQuery: 'Botchan train Matsuyama',
      },
      {
        id: 'matsuyama-shiki',
        name: 'Musée Shiki',
        category: 'culture',
        description:
          'Consacré à Masaoka Shiki, né à Matsuyama, qui a refondé le haïku moderne. La ville se revendique capitale du haïku : il y a des boîtes à poèmes dans la rue, où l’on dépose les siens.',
        photoQuery: 'Shiki Memorial Museum Matsuyama',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-matsuyama-taimeshi',
        name: 'Tai-meshi',
        nameJa: '鯛めし',
        kind: 'plat',
        description:
          'Deux plats du même nom : à Matsuyama, une daurade cuite entière sur le riz ; au sud d’Ehime, la daurade crue en tranches avec un œuf cru battu, versée sur le riz.',
        photoQuery: 'Taimeshi',
      },
      {
        id: 'spec-matsuyama-jakoten',
        name: 'Jakoten',
        nameJa: 'じゃこ天',
        kind: 'plat',
        description:
          'Galette de petits poissons broyés entiers — arêtes comprises — et frits. Snack de comptoir et accompagnement d’udon, propre à la côte d’Ehime.',
        photoQuery: 'Jakoten',
      },
      {
        id: 'spec-matsuyama-mikan',
        name: 'Mikan d’Ehime',
        nameJa: '愛媛みかん',
        kind: 'produit',
        description:
          'Ehime est la préfecture des agrumes : mandarines en terrasses sur les pentes face à la mer, et une trentaine de variétés. Novembre est le début de la pleine saison — il y a même des fontaines à jus de mikan.',
        photoQuery: 'Citrus unshiu',
      },
      {
        id: 'spec-matsuyama-botchan-dango',
        name: 'Botchan dango',
        nameJa: '坊っちゃん団子',
        kind: 'douceur',
        description:
          'Brochette de trois boulettes enrobées chacune d’une pâte différente — haricot rouge, œuf, thé vert. Le gâteau de Dōgo, nommé d’après le roman de Sōseki qui le mentionne.',
        photoQuery: 'Botchan dango Matsuyama',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Étape absente de l’itinéraire que tu m’avais donné au départ (…Naoshima/Takamatsu → Fukuoka…) : elle vient de ta table de dates. Je l’ai ajoutée entre Takamatsu et Fukuoka, ce qui crée deux trajets entièrement nouveaux.',
      'Les tarifs de ces deux nouveaux trajets ne sont pas renseignés : je n’ai pas la grille JR Shikoku sous la main et je ne veux pas avancer un chiffre de mémoire. Le total « transports » est donc incomplet tant qu’ils ne sont pas relevés.',
    ],
    spots: [
      { name: 'Château de Matsuyama', coord: [132.7657, 33.8455], kind: 'culture' },
      { name: 'Dōgo Onsen Honkan', coord: [132.7862, 33.8517], kind: 'onsen' },
      { name: 'Ishite-ji', coord: [132.7997, 33.8494], kind: 'culture' },
    ],
  },
  {
    id: 'fukuoka',
    name: 'Fukuoka',
    nameJa: '福岡',
    region: 'Préfecture de Fukuoka, Kyūshū',
    coord: [130.4017, 33.5902],
    stay: 'overnight',
    blurb:
      'Plus grande ville de Kyūshū, réputée pour ses yatai — les échoppes de rue au bord de la rivière Naka — et le ramen tonkotsu de Hakata.',
    photoId: 'fukuoka',
    galleryQueries: ['Fukuoka city Hakata', 'Fukuoka yatai food stall', 'Dazaifu Tenmangu'],
    dates: sejour('11-27', '11-29'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'fukuoka-yatai',
        name: 'Yatai de Nakasu et Tenjin',
        category: 'food',
        description:
          'Une centaine d’échoppes démontables installées chaque soir sur les trottoirs, autour d’un comptoir de dix places : ramen, tempura, brochettes. Fukuoka en concentre l’essentiel de ce qui subsiste au Japon.',
        photoQuery: 'Fukuoka yatai street stall',
        note: 'Ouverture en début de soirée, fermeture tard, souvent pas par mauvais temps. Beaucoup ne prennent que des espèces et limitent le temps passé quand il y a la queue.',
      },
      {
        id: 'fukuoka-dazaifu',
        name: 'Dazaifu Tenmangū',
        category: 'culture',
        description:
          'Sanctuaire dédié à Sugawara no Michizane, divinité des études, entouré de six mille pruniers. Les lycéens de tout le pays viennent y acheter une amulette avant les examens.',
        photoQuery: 'Dazaifu Tenmangu shrine',
        note: 'Trente minutes de train depuis Tenjin. Le pavillon principal est en travaux de réfection de toiture depuis 2023, avec un sanctuaire provisoire remarquable dessiné pour l’occasion : à vérifier.',
      },
      {
        id: 'fukuoka-kushida',
        name: 'Kushida-jinja et Hakata Machiya',
        category: 'culture',
        description:
          'Sanctuaire tutélaire de Hakata, qui abrite toute l’année un char de 13 m du festival Yamakasa. Le musée voisin, dans des maisons de marchands, montre les métiers du tissage et de la poupée de Hakata.',
        photoQuery: 'Kushida Shrine Fukuoka',
      },
      {
        id: 'fukuoka-ohori',
        name: 'Parc Ōhori et les ruines du château de Fukuoka',
        category: 'nature',
        description:
          'Les anciennes douves du château, devenues un grand lac avec des îles reliées par des ponts, et les murs de pierre du château de Kuroda sur la colline voisine. C’est le poumon de la ville.',
        photoQuery: 'Ohori Park Fukuoka',
      },
      {
        id: 'fukuoka-nanzoin',
        name: 'Nanzō-in',
        category: 'culture',
        description:
          'Temple de montagne qui abrite un bouddha couché en bronze de 41 m — la plus grande statue de bronze du monde de ce type. Site de pèlerinage très fréquenté par les Japonais, presque inconnu des étrangers.',
        photoQuery: 'Nanzoin',
        note: 'Vingt-cinq minutes de train JR jusqu’à Kidonanzōin-mae. Le temple a affiché des restrictions d’accès aux visiteurs étrangers par le passé : à vérifier avant d’y aller.',
      },
      {
        id: 'fukuoka-canal-tenjin',
        name: 'Tenjin, Nakasu et la rivière Naka',
        category: 'quartier',
        description:
          'Le centre commerçant de Kyūshū : galeries souterraines de Tenjin, île de Nakasu entre deux bras de rivière, et les quais où l’on marche le soir entre les yatai.',
        photoQuery: 'Tenjin Fukuoka street',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-fukuoka-tonkotsu',
        name: 'Ramen tonkotsu de Hakata',
        nameJa: '博多ラーメン',
        kind: 'plat',
        description:
          'Bouillon d’os de porc bouilli des heures jusqu’à devenir blanc et opaque, nouilles très fines et fermes. On commande une seconde portion de nouilles seules, le kae-dama, dans le bouillon restant.',
        photoQuery: 'Hakata tonkotsu ramen',
      },
      {
        id: 'spec-fukuoka-motsunabe',
        name: 'Motsu-nabe',
        nameJa: 'もつ鍋',
        kind: 'plat',
        description:
          'Fondue de tripes de bœuf avec une montagne de chou et de ciboule, dans un bouillon soja ou miso. Plat d’après-guerre devenu la table d’hiver de Fukuoka.',
        photoQuery: 'Motsunabe hot pot Fukuoka',
      },
      {
        id: 'spec-fukuoka-mentaiko',
        name: 'Mentaiko',
        nameJa: '明太子',
        kind: 'produit',
        description:
          'Œufs de morue marinés au piment, adaptés d’une recette coréenne à Hakata dans les années 1950. Se mangent sur du riz, dans des pâtes, ou en tube à rapporter — le souvenir de Fukuoka.',
        photoQuery: 'Mentaiko',
      },
      {
        id: 'spec-fukuoka-mizutaki',
        name: 'Mizutaki',
        nameJa: '水炊き',
        kind: 'plat',
        description:
          'Poulet mijoté longuement dans de l’eau jusqu’à ce que le bouillon devienne laiteux, sans autre assaisonnement, puis légumes. On boit le bouillon avant de manger le reste.',
        // Pas de `photoQuery` : ni « mizutaki » ni « 水炊き » ne trouvent ce plat sur
        // Commons — la recherche remonte un restaurant de shabu-shabu à Yokohama,
        // qui est une autre marmite. L'entrée reste sans image.
        note: 'Aucune photo libre de droits de ce plat : les images de marmites japonaises disponibles montrent d’autres préparations.',
      },
      {
        id: 'spec-fukuoka-umegaemochi',
        name: 'Umegae mochi',
        nameJa: '梅ヶ枝餅',
        kind: 'douceur',
        description:
          'Galette de riz grillée fourrée de haricot rouge, marquée d’une fleur de prunier, cuite devant le client sur l’allée de Dazaifu depuis des siècles.',
        photoQuery: 'Umegaemochi',
      },
    ],
    specialitiesStatus: 'estimate',
    spots: [
      { name: 'Parc Ōhori', coord: [130.3800, 33.5850], kind: 'nature' },
      { name: 'Yatai de Nakasu', coord: [130.4050, 33.5920], kind: 'food' },
      { name: 'Kushida-jinja', coord: [130.4110, 33.5940], kind: 'culture' },
    ],
  },
  {
    id: 'nagasaki',
    name: 'Nagasaki',
    nameJa: '長崎',
    region: 'Préfecture de Nagasaki, Kyūshū',
    coord: [129.8720, 32.7530],
    stay: 'overnight',
    blurb:
      'Ville portuaire en amphithéâtre, seule ouverte aux étrangers pendant deux siècles de fermeture du pays : Dejima, églises, et le parc de la Paix.',
    photoId: 'nagasaki',
    galleryQueries: ['Nagasaki city view', 'Glover Garden Nagasaki', 'Hashima Gunkanjima island'],
    dates: sejour('11-29', '12-02'),
    nights: nuits(3),
    accommodation: { status: 'todo' },
    activities: [
      {
        id: 'nagasaki-paix',
        name: 'Parc de la Paix et musée de la bombe atomique',
        category: 'culture',
        description:
          'L’hypocentre du 9 août 1945, marqué par une colonne noire, la statue de la Paix, et un musée qui retrace la ville d’avant et la destruction. La cathédrale d’Urakami, à côté, était la plus grande d’Asie de l’Est.',
        photoQuery: 'Nagasaki Peace Park statue',
      },
      {
        id: 'nagasaki-dejima',
        name: 'Dejima',
        category: 'culture',
        description:
          'L’îlot artificiel en éventail où les Hollandais furent confinés pendant deux siècles : le seul point de contact du Japon fermé avec l’Occident. Les entrepôts et la maison du chef de comptoir ont été reconstruits sur les fondations fouillées.',
        photoQuery: 'Dejima Nagasaki',
      },
      {
        id: 'nagasaki-glover',
        name: 'Glover Garden et Ōura',
        category: 'culture',
        description:
          'Les demeures des marchands étrangers de l’ère Meiji, remontées à flanc de colline au-dessus du port, et l’église d’Ōura de 1864 — plus ancienne église en bois du Japon, classée trésor national.',
        photoQuery: 'Glover Garden Nagasaki',
      },
      {
        id: 'nagasaki-inasa',
        name: 'Mont Inasa',
        category: 'nature',
        description:
          'Belvédère à 333 m au-dessus de la baie, atteint par téléphérique : la ville en amphithéâtre, éclairée, est un des trois grands panoramas nocturnes du Japon selon le classement local.',
        photoQuery: 'Mount Inasa Nagasaki night view',
        note: 'Le téléphérique subit des arrêts d’entretien de plusieurs semaines : à vérifier. Un bus monte aussi au sommet.',
      },
      {
        id: 'nagasaki-gunkanjima',
        name: 'Gunkanjima',
        category: 'culture',
        description:
          'Ancienne mine de charbon sous-marine sur un rocher de 480 m de long, bétonné jusqu’aux bords et abandonné d’un coup en 1974. Les premiers immeubles en béton armé du Japon y tiennent encore debout.',
        photoQuery: 'Hashima Gunkanjima Nagasaki',
        note: 'Uniquement par bateau, avec un opérateur agréé, et le débarquement est annulé dès que la mer se lève — c’est fréquent. Prévoir une des trois journées avec une solution de repli.',
      },
      {
        id: 'nagasaki-shinchi',
        name: 'Quartier chinois de Shinchi et le pont aux lunettes',
        category: 'quartier',
        description:
          'Le plus ancien quartier chinois du Japon, avec ses quatre portes, et un peu plus haut le Megane-bashi de 1634 : un pont à deux arches dont le reflet dans la rivière dessine une paire de lunettes.',
        photoQuery: 'Meganebashi Nagasaki bridge',
      },
      {
        id: 'nagasaki-shimabara',
        name: 'Shimabara et Unzen',
        category: 'nature',
        description:
          'La péninsule voisine : un château au pied du volcan Unzen, des canaux à carpes qui traversent les rues, et l’une des plus anciennes stations thermales de Kyūshū, avec ses fumerolles en pleine ville.',
        photoQuery: 'Unzen jigoku',
        note: 'Compter la journée entière depuis Nagasaki. C’est ce que permettent les trois nuits sur place ; à arbitrer contre Gunkanjima.',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-nagasaki-champon',
        name: 'Chanpon',
        nameJa: 'ちゃんぽん',
        kind: 'plat',
        description:
          'Nouilles épaisses cuites directement dans un bouillon de porc et de fruits de mer, avec porc, calamar, chou et kamaboko. Créé à Nagasaki par un restaurateur chinois pour nourrir les étudiants à peu de frais.',
        photoQuery: 'Nagasaki champon noodles',
      },
      {
        id: 'spec-nagasaki-castella',
        name: 'Castella',
        nameJa: 'カステラ',
        kind: 'douceur',
        description:
          'Gâteau de Savoie apporté par les Portugais au XVIᵉ siècle et devenu un gâteau japonais : œufs, farine, sucre et sirop d’amidon, très humide, vendu en pain rectangulaire.',
        photoQuery: 'Castella cake Nagasaki',
      },
      {
        id: 'spec-nagasaki-sara-udon',
        name: 'Sara udon',
        nameJa: '皿うどん',
        kind: 'plat',
        description:
          'La version sèche du chanpon : nouilles fines frites croustillantes, noyées d’une sauce épaissie aux mêmes garnitures. On y ajoute du vinaigre de Worcester, ce qui se fait ici et nulle part ailleurs.',
        photoQuery: 'Sara udon Nagasaki',
      },
      {
        id: 'spec-nagasaki-shippoku',
        name: 'Cuisine shippoku',
        nameJa: '卓袱料理',
        kind: 'plat',
        description:
          'Repas de banquet servi sur une table ronde et partagé, mélange de japonais, de chinois et d’occidental : la seule cuisine née de la position singulière de Nagasaki comme unique port ouvert.',
        photoQuery: 'Shippoku cuisine Nagasaki',
      },
      {
        id: 'spec-nagasaki-toruko',
        name: 'Toruko-raisu',
        nameJa: 'トルコライス',
        kind: 'plat',
        description:
          'Une assiette, trois plats : riz pilaf, spaghetti bolognaise et une côtelette de porc panée sous sauce curry. Plat de brasserie inventé ici dans les années 1950, sans rapport avec la Turquie.',
        photoQuery: 'Toruko rice Nagasaki',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Trois nuits, le séjour le plus long après Tokyo : de quoi sortir de la ville (Gunkanjima, Shimabara) si tu veux étoffer le programme.',
    ],
    spots: [
      { name: 'Glover Garden', coord: [129.8690, 32.7340], kind: 'culture' },
      { name: 'Parc de la Paix', coord: [129.8630, 32.7730], kind: 'culture' },
      { name: 'Dejima', coord: [129.8730, 32.7440], kind: 'culture' },
    ],
  },
  {
    id: 'tokyo-retour',
    name: 'Tokyo',
    nameJa: '東京',
    region: 'Kantō',
    coord: [139.7671, 35.6812],
    stay: 'overnight',
    blurb:
      'Retour dans la capitale par les airs, pour les trois derniers jours du voyage : de quoi reprendre les quartiers laissés de côté à l’arrivée.',
    photoId: 'tokyo',
    galleryQueries: [
      'Rikugien garden autumn',
      'Ueno Park Tokyo',
      'Tokyo Skytree',
      'Yanaka Tokyo street',
      'Marunouchi Tokyo Station',
    ],
    dates: sejour('12-02', '12-05'),
    nights: nuits(3),
    accommodation: {
      status: 'todo',
      note: 'Le vol de 8 h 40 impose de quitter la ville vers 6 h. Deux pistes : dormir près de Hamamatsuchō ou de Shinagawa, d’où partent le monorail et la ligne Keikyū pour Haneda ; ou passer la dernière nuit dans un hôtel de l’aéroport. La deuxième coûte une soirée à Tokyo, la première une heure de sommeil.',
    },
    activities: [
      {
        id: 'tokyo-retour-rikugien',
        name: 'Rikugi-en',
        category: 'nature',
        description:
          'Jardin de 1702 composé pour illustrer quatre-vingt-huit poèmes classiques : collines, étang central et sentiers étroits. Le plus beau jardin d’érables de Tokyo.',
        photoQuery: 'Rikugien garden autumn maple',
        note: 'Début décembre est exactement le pic des couleurs à Tokyo, et le jardin est éclairé le soir pendant cette quinzaine. C’est l’activité la mieux datée du séjour.',
      },
      {
        id: 'tokyo-retour-ueno',
        name: 'Parc d’Ueno et ses musées',
        category: 'art',
        description:
          'Le premier parc public du Japon, où sont rassemblés le Musée national de Tokyo — plus grande collection d’art japonais au monde —, le musée d’art occidental de Le Corbusier et le musée des sciences.',
        photoQuery: 'Ueno Park Tokyo National Museum',
        note: 'La plupart des musées ferment le lundi. Le 2 décembre 2026 est un mercredi, le 3 un jeudi, le 4 un vendredi : pas de conflit.',
      },
      {
        id: 'tokyo-retour-yanaka',
        name: 'Yanaka et Nezu',
        category: 'quartier',
        description:
          'Un des rares quartiers épargnés par le séisme de 1923 et les bombardements : maisons de bois, ateliers, un immense cimetière planté de cerisiers, et la rue commerçante de Yanaka Ginza avec son escalier au soleil couchant.',
        photoQuery: 'Yanaka Ginza Tokyo',
        note: 'Quartier de promenade des Tokyoïtes plus que des étrangers. Se fait à pied depuis Ueno.',
      },
      {
        id: 'tokyo-retour-toyosu',
        name: 'Marché de Toyosu',
        category: 'food',
        description:
          'Le successeur de Tsukiji, où se tient la vente aux enchères du thon : on l’observe depuis une galerie vitrée, tôt le matin. Restaurants de sushi des grossistes au premier étage.',
        photoQuery: 'Toyosu Market Tokyo',
        note: 'Fermé le dimanche et certains mercredis. Les enchères se tiennent vers 5 h 30 : l’accès libre à la galerie haute ne se réserve pas, celui du balcon inférieur si.',
      },
      {
        id: 'tokyo-retour-skytree',
        name: 'Tokyo Skytree et Sumida',
        category: 'quartier',
        description:
          'Tour de 634 m, la plus haute structure du Japon, avec deux plateformes et un plancher de verre. En bas, l’ancien quartier des artisans et la promenade de la rivière Sumida.',
        photoQuery: 'Tokyo Skytree tower',
        note: 'Par temps clair et en hiver, le Fuji est visible depuis la plateforme — décembre est la meilleure saison pour ça. Billet daté conseillé.',
      },
      {
        id: 'tokyo-retour-kagurazaka',
        name: 'Kagurazaka',
        category: 'quartier',
        description:
          'Ancien quartier de geishas sur une pente, dont les ruelles pavées et les impasses de restaurants subsistent derrière la rue principale. Une forte présence française y a laissé des boulangeries et un lycée.',
        photoQuery: 'Kagurazaka Tokyo alley',
      },
      {
        id: 'tokyo-retour-marunouchi',
        name: 'Gare de Tokyo, Marunouchi et le palais impérial',
        category: 'culture',
        description:
          'La façade de brique de 1914 restaurée à l’identique, l’avenue Naka-dōri éclairée pour l’hiver, et les jardins est du palais impérial avec les fondations du donjon d’Edo.',
        photoQuery: 'Tokyo Station Marunouchi building',
        note: 'Les illuminations de Marunouchi commencent mi-novembre : elles seront en place. Les jardins du palais ferment le lundi et le vendredi.',
      },
    ],
    activitiesStatus: 'estimate',
    specialities: [
      {
        id: 'spec-tokyo-monjayaki',
        name: 'Monjayaki',
        nameJa: 'もんじゃ焼き',
        kind: 'plat',
        description:
          'Pâte très liquide étalée à la spatule sur la plaque, où elle prend une consistance de crème gratinée qu’on racle par petites portions. Spécialité de Tokyo, et de la rue de Tsukishima qui en compte une cinquantaine de comptoirs.',
        photoQuery: 'Monjayaki Tsukishima Tokyo',
      },
      {
        id: 'spec-tokyo-fukagawameshi',
        name: 'Fukagawa-meshi',
        nameJa: '深川めし',
        kind: 'plat',
        description:
          'Riz aux palourdes et à la ciboule, mijoté dans un bouillon de miso : le repas des pêcheurs de la baie d’Edo, dans le quartier de Fukagawa. Un plat de la ville d’avant, encore servi à l’est de la rivière.',
        photoQuery: 'Fukagawameshi',
      },
      {
        id: 'spec-tokyo-dorayaki',
        name: 'Dorayaki',
        nameJa: 'どら焼き',
        kind: 'douceur',
        description:
          'Deux petites galettes moelleuses refermées sur de la pâte de haricot rouge. Sa forme moderne est née dans une confiserie de Ueno au début du XXᵉ siècle, et les maisons du quartier en vendent encore à la pièce.',
        photoQuery: 'Dorayaki Japanese sweet',
      },
    ],
    specialitiesStatus: 'estimate',
    warnings: [
      'Trois nuits du 2 au 5 décembre : c’est bien une étape, plus une simple correspondance.',
      'Vol de retour confirmé : Haneda, le 5 décembre à 8 h 40. En comptant la fermeture de l’enregistrement vers 7 h 40, il faut être au terminal vers 6 h 40 et donc quitter le centre de Tokyo autour de 6 h. La journée du 5 décembre n’existe pas : le voyage se termine en réalité le soir du 4.',
      'À VÉRIFIER avant de réserver l’hôtel : l’heure du premier monorail depuis Hamamatsuchō, que je n’ai pas trouvée publiée. Si elle est postérieure à 5 h 45 environ, il faut un taxi ou une nuit près de l’aéroport.',
    ],
  },
]

export const DESTINATIONS: Destination[] = ETAPES.map((etape, index) => ({
  ...etape,
  order: index + 1,
}))

export const DESTINATION_BY_ID: Record<string, Destination> = Object.fromEntries(
  DESTINATIONS.map((d) => [d.id, d]),
)

export function destination(id: string) {
  const found = DESTINATION_BY_ID[id]
  if (!found) throw new Error(`Étape inconnue : « ${id} » (voir src/data/destinations.ts)`)
  return found
}

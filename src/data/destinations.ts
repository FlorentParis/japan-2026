/**
 * LES ÉTAPES DU VOYAGE — source de vérité.
 *
 * ▸ Pour renseigner une étape, il suffit d'éditer son objet ici : dates, nuits,
 *   hôtel, activités. Rien d'autre à toucher, tout le site en découle
 *   (carte, timeline, budget, compteurs, page « à compléter »).
 *
 * ▸ Ce qui n'a pas été fourni est marqué `certainty: 'todo'`. Aucune date,
 *   aucun prix, aucun hôtel, aucune activité n'a été inventé.
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

export const DESTINATIONS: Destination[] = [
  {
    id: 'tokyo-arrivee',
    name: 'Tokyo',
    nameJa: '東京',
    region: 'Kantō',
    coord: [139.7671, 35.6812],
    order: 1,
    stay: 'overnight',
    blurb:
      'Point d’entrée du voyage. La mégapole s’explore par quartiers : Asakusa et son temple, Shibuya et son carrefour, les jardins impériaux.',
    photoId: 'tokyo',
    dates: sejour('11-06', '11-08'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
    warnings: [
      'Aéroport d’arrivée à confirmer (Haneda ou Narita) : il change le premier trajet et son coût.',
      'Arrivée le 6 novembre 2026, départ pour Matsumoto le 8 : avec le décalage horaire, la première journée sur place est courte.',
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
    order: 2,
    stay: 'overnight',
    blurb:
      'Ville des Alpes japonaises, connue pour son donjon noir du XVIᵉ siècle — l’un des cinq châteaux classés trésor national.',
    photoId: 'matsumoto',
    dates: sejour('11-08', '11-10'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 3,
    stay: 'overnight',
    blurb:
      'Vallée d’altitude fermée aux voitures privées, au pied du massif du Hotaka. Balades le long de la rivière Azusa, du pont Kappa aux étangs.',
    photoId: 'kamikochi',
    dates: sejour('11-10', '11-11'),
    nights: nuits(1),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 4,
    stay: 'overnight',
    blurb:
      'Ancienne ville de marchands au cœur de la région de Hida. Rues de bois sombre de Sanmachi-suji, marchés du matin, saké et bœuf de Hida.',
    photoId: 'takayama',
    dates: sejour('11-11', '11-13'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 5,
    stay: 'overnight',
    blurb:
      'Village classé au patrimoine mondial pour ses fermes gasshō-zukuri aux toits de chaume à forte pente, conçus pour les hivers de neige lourde.',
    photoId: 'shirakawago',
    dates: sejour('11-13', '11-14'),
    nights: nuits(1),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 6,
    stay: 'overnight',
    blurb:
      'Ancienne capitale du clan Maeda, épargnée par les bombardements. Kenroku-en, quartiers de geishas et de samouraïs, feuille d’or et marché de poissons.',
    photoId: 'kanazawa',
    dates: sejour('11-14', '11-16'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 7,
    stay: 'overnight',
    blurb:
      'Port de la mer du Japon adossé aux Alpes. Point de départ occidental de la route alpine Tateyama-Kurobe.',
    photoId: 'toyama',
    dates: sejour('11-16', '11-17'),
    nights: nuits(1),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 8,
    stay: 'day',
    blurb:
      'Traversée du massif de Tateyama en funiculaire, bus de montagne, téléphérique et bus électrique : de Toyama à Ōgizawa par Murodō (2 450 m) et le barrage de Kurobe.',
    photoId: 'tateyama',
    dates: sejour('11-17', '11-17'),
    nights: nuitsDeduites(0),
    accommodation: {
      status: 'todo',
      note: 'Traversée dans la journée du 17 novembre : aucune nuit sur la route alpine, la nuit du 17 est placée à Nagano.',
    },
    activities: [],
    activitiesStatus: 'todo',
    warnings: [
      'Traversée prévue le 17 novembre 2026. La route est annoncée ouverte jusqu’au 30 novembre, mais toutes les sections ne ferment pas le même jour : le calendrier d’exploitation est à vérifier section par section sur alpen-route.com avant de bloquer les hôtels de Toyama et de Nagano.',
      'Murodō culmine à 2 450 m : à cette date, c’est l’hiver — neige, verglas, vent, visibilité incertaine. Équipement chaud indispensable.',
      'Traversée d’ouest en est : les bagages ne suivent pas. À faire expédier de Toyama vers Nagano (takkyūbin), la veille.',
    ],
    spots: [
      { name: 'Murodō (2 450 m)', coord: [137.5960, 36.5780], kind: 'nature' },
      { name: 'Étang Mikuriga-ike', coord: [137.5940, 36.5760], kind: 'nature' },
      { name: 'Barrage de Kurobe', coord: [137.6640, 36.5660], kind: 'nature' },
    ],
  },
  {
    id: 'nagano',
    name: 'Nagano',
    nameJa: '長野',
    region: 'Préfecture de Nagano',
    coord: [138.1880, 36.6430],
    order: 9,
    stay: 'overnight',
    blurb:
      'Ville née autour du Zenkō-ji, temple fondé au VIIᵉ siècle qui abrite la plus ancienne statue bouddhique du Japon.',
    photoId: 'nagano',
    dates: sejour('11-17', '11-20'),
    nights: nuitsDeduites(3),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
    warnings: [
      'Ta table sépare « 17–18 nov. Tateyama → Nagano, 1 nuit » et « 18–20 nov. Nagano, 2 nuits ». J’ai donc réuni les nuits du 17, 18 et 19 à Nagano : une seule réservation de 3 nuits. Si tu comptais dormir ailleurs le 17 — Shinano-Ōmachi, au pied de la sortie est de la route alpine, par exemple — c’est ici qu’il faut le corriger.',
      'Arrivée tardive le 17 : traversée de la route alpine puis descente vers Nagano, environ 9 h de trajet cumulé. Hôtel près de la gare, et dîner à prévoir tard.',
    ],
    spots: [{ name: 'Zenkō-ji', coord: [138.1875, 36.6620], kind: 'culture' }],
  },
  {
    id: 'kurashiki',
    name: 'Kurashiki',
    nameJa: '倉敷',
    region: 'Préfecture d’Okayama',
    coord: [133.7690, 34.6010],
    order: 10,
    stay: 'overnight',
    blurb:
      'Quartier Bikan : canal bordé d’entrepôts à riz blanchis à la chaux, saules et musée Ōhara — le premier musée d’art occidental du Japon.',
    photoId: 'kurashiki',
    dates: sejour('11-20', '11-21'),
    nights: nuits(1),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 11,
    stay: 'overnight',
    blurb:
      'Le dôme de Genbaku et le parc du Mémorial de la Paix, classés au patrimoine mondial, dans une ville entièrement reconstruite après 1945. Miyajima, à une heure de là, porte le torii d’Itsukushima planté dans la mer.',
    photoId: 'hiroshima',
    dates: sejour('11-21', '11-23'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 12,
    stay: 'day',
    blurb:
      'Île-musée de la mer intérieure de Seto : architecture de Tadao Andō, collections Benesse, et les citrouilles de Yayoi Kusama posées face à la mer.',
    photoId: 'naoshima',
    dates: sejour('11-23', '11-23'),
    nights: nuitsDeduites(0),
    accommodation: {
      status: 'todo',
      note: 'Visite dans la journée du 23 novembre, en chemin vers Takamatsu où sont placées les deux nuits.',
    },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 13,
    stay: 'overnight',
    blurb:
      'Porte d’entrée de Shikoku, patrie des udon sanuki. Le jardin Ritsurin y déploie six étangs et treize collines composées.',
    photoId: 'takamatsu',
    dates: sejour('11-23', '11-25'),
    nights: nuitsDeduites(2),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 14,
    stay: 'overnight',
    blurb:
      'Plus grande ville de Shikoku. Son donjon d’origine domine la colline de Katsuyama, et Dōgo Onsen, mentionné dès les plus anciennes chroniques du Japon, se visite dans un bâtiment de bois de 1894.',
    photoId: 'matsuyama',
    dates: sejour('11-25', '11-27'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 15,
    stay: 'overnight',
    blurb:
      'Plus grande ville de Kyūshū, réputée pour ses yatai — les échoppes de rue au bord de la rivière Naka — et le ramen tonkotsu de Hakata.',
    photoId: 'fukuoka',
    dates: sejour('11-27', '11-29'),
    nights: nuits(2),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 16,
    stay: 'overnight',
    blurb:
      'Ville portuaire en amphithéâtre, seule ouverte aux étrangers pendant deux siècles de fermeture du pays : Dejima, églises, et le parc de la Paix.',
    photoId: 'nagasaki',
    dates: sejour('11-29', '12-02'),
    nights: nuits(3),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
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
    order: 17,
    stay: 'overnight',
    blurb:
      'Retour dans la capitale par les airs, pour les trois derniers jours du voyage : de quoi reprendre les quartiers laissés de côté à l’arrivée.',
    photoId: 'tokyo',
    dates: sejour('12-02', '12-05'),
    nights: nuits(3),
    accommodation: { status: 'todo' },
    activities: [],
    activitiesStatus: 'todo',
    warnings: [
      'Trois nuits du 2 au 5 décembre : c’est bien une étape, plus une simple correspondance. Reste à caler le vol international du retour — départ le 5 décembre ?',
    ],
  },
]

export const DESTINATION_BY_ID: Record<string, Destination> = Object.fromEntries(
  DESTINATIONS.map((d) => [d.id, d]),
)

export function destination(id: string) {
  const found = DESTINATION_BY_ID[id]
  if (!found) throw new Error(`Étape inconnue : « ${id} » (voir src/data/destinations.ts)`)
  return found
}

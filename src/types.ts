/**
 * Modèle de données du voyage.
 *
 * Principe directeur : la *qualité* de chaque information fait partie de son type.
 * On ne peut pas écrire un prix sans dire s'il est confirmé, estimé, ou à compléter.
 * L'UI s'appuie sur `certainty` pour ne jamais présenter une estimation comme un fait.
 */

/** Fiabilité d'une donnée. `todo` = information manquante, à renseigner. */
export type Certainty =
  /** Fourni par le voyageur : réservation, billet acheté, date arrêtée. */
  | 'confirmed'
  /** Calculé ou relevé sur une source publique : à vérifier avant le départ. */
  | 'estimate'
  /** Pas encore renseigné. L'UI affiche une pastille « à compléter ». */
  | 'todo'

/** Coordonnée en ordre GeoJSON : [longitude, latitude]. */
export type Coord = [number, number]

export type Money = {
  /** Montant en yens. Absent si la donnée est `todo`. */
  jpy?: number
  /**
   * Montant en euros, quand c'est la devise dans laquelle la dépense a
   * réellement été payée — un billet d'avion acheté en Europe, par exemple.
   *
   * C'est alors la donnée d'origine, et la seule exacte : le montant en yens en
   * est une conversion au taux indicatif de `JPY_PER_EUR`, jamais l'inverse.
   * L'affichage en euros montre donc le chiffre payé, au centime près.
   */
  eur?: number
  certainty: Certainty
  /** Contexte : « siège non réservé », « varie selon la compagnie »… */
  note?: string
  /** Par personne (défaut) ou pour le groupe entier. */
  scope?: 'per-person' | 'total'
}

export type Duration = {
  minutes: number
  certainty: Certainty
  /** Contexte : « hors correspondance », « selon l'affluence »… */
  note?: string
}

/** Une date ISO (AAAA-MM-JJ) ou l'absence de date, qualifiée. */
export type DateInfo = {
  start?: string
  end?: string
  certainty: Certainty
}

export type Photo = {
  url: string
  width: number
  height: number
  /** Nom du fichier Wikimedia Commons. */
  file: string
  author: string
  license: string
  sourcePage: string
}

/** Moyens de transport. Chacun a son propre style de tracé sur la carte. */
export type TransportMode =
  | 'shinkansen'
  | 'train'
  | 'bus'
  | 'ferry'
  | 'plane'
  | 'ropeway'
  | 'walk'

/** Couverture par un pass ferroviaire. */
export type PassCoverage = 'covered' | 'not-covered' | 'partial' | 'unknown'

/**
 * Un point géographique nommé : ville, gare, port, aéroport, arrêt de bus, col.
 * Les trajets référencent des `Place` par identifiant — les coordonnées ne sont
 * jamais dupliquées.
 */
export type Place = {
  id: string
  name: string
  nameJa?: string
  kind: 'city' | 'station' | 'port' | 'airport' | 'stop' | 'landmark'
  coord: Coord
}

export type Accommodation = {
  status: Certainty
  name?: string
  /** Type de chambre / de logement. */
  room?: string
  /** Prix total du séjour dans cet hébergement. */
  price?: Money
  nights?: number
  bookingUrl?: string
  /** Quartier ou adresse indicative. */
  area?: string
  note?: string
}

export type ActivityCategory =
  | 'culture'
  | 'nature'
  | 'food'
  | 'art'
  | 'onsen'
  | 'quartier'
  | 'autre'

export type Activity = {
  /**
   * Identifiant unique dans tout le site, préfixé par l'étape
   * (`takayama-sanmachi`). C'est **aussi** la clé de sa photo dans `PHOTOS` :
   * pas de second identifiant à maintenir en parallèle.
   */
  id: string
  name: string
  category: ActivityCategory
  description?: string
  /**
   * Termes de recherche Wikimedia Commons. `scripts/fetch-photos.ts` les
   * interroge et enregistre la photo retenue sous l'`id` ci-dessus.
   *
   * Absent = pas de photo cherchée. Présent mais sans résultat exploitable =
   * l'activité s'affiche sans image, jamais avec celle d'un autre lieu.
   */
  photoQuery?: string
  coord?: Coord
  price?: Money
  duration?: Duration
  url?: string
  note?: string
}

/** Ce qu'on a dans l'assiette, dans le verre, ou qu'on rapporte. */
export type SpecialityKind =
  /** Plat salé. */
  | 'plat'
  /** Sucrerie, pâtisserie, wagashi. */
  | 'douceur'
  /** Saké, thé, bière, eau-de-vie. */
  | 'boisson'
  /** Produit brut ou à emporter : fruit, poisson, conserve. */
  | 'produit'
  /** Objet artisanal, pas comestible. */
  | 'artisanat'

/**
 * Une spécialité locale rattachée à une étape.
 *
 * Comme les activités, ces entrées sont des **suggestions** : elles ne viennent
 * pas du voyageur. D'où `Destination.specialitiesStatus`, qui le dit à l'UI.
 */
export type Speciality = {
  /** Unique dans tout le site, et clé de sa photo dans `PHOTOS`. Voir `Activity.id`. */
  id: string
  name: string
  nameJa?: string
  kind: SpecialityKind
  description: string
  /** Voir `Activity.photoQuery`. */
  photoQuery?: string
  /** Où en trouver, quand un lieu précis et vérifiable est connu. */
  where?: string
  price?: Money
  note?: string
}

/** Nature du passage sur une étape. */
export type StayKind =
  /** Au moins une nuit sur place. */
  | 'overnight'
  /** Visite sans nuit (traversée, excursion). */
  | 'day'
  /** Simple point de passage / correspondance. */
  | 'transit'
  /** Pas encore décidé. */
  | 'unknown'

export type Destination = {
  id: string
  name: string
  nameJa?: string
  /** Préfecture / région. */
  region: string
  coord: Coord
  /** Numéro d'ordre dans le parcours, à partir de 1. */
  order: number
  stay: StayKind
  /** Description factuelle courte, affichée sous le titre. */
  blurb: string
  /** Photo de tête. Clé dans `PHOTOS`, alimentée par `scripts/fetch-photos.ts`. */
  photoId?: string
  /**
   * Recherches Wikimedia Commons qui complètent la galerie de l'étape, en plus
   * de la photo de tête et de celles des activités. Objectif : au moins neuf
   * images par lieu — le script prévient quand une galerie reste en dessous.
   */
  galleryQueries?: string[]
  dates: DateInfo
  nights?: { count: number; certainty: Certainty }
  accommodation: Accommodation
  activities: Activity[]
  /**
   * `todo` = aucune activité renseignée. `estimate` = ce sont des propositions
   * documentées, pas des choix du voyageur ni des réservations.
   */
  activitiesStatus: Certainty
  specialities?: Speciality[]
  /** Même sens que `activitiesStatus`, pour les spécialités locales. */
  specialitiesStatus?: Certainty
  /** Avertissements factuels : fermeture saisonnière, réservation obligatoire… */
  warnings?: string[]
  /** Points d'intérêt géolocalisés affichés sur la carte de détail. */
  spots?: { name: string; coord: Coord; kind?: ActivityCategory }[]
}

/**
 * Un tronçon atomique : un seul moyen de transport, un seul service.
 * C'est l'unité que la carte dessine — d'où l'absence totale d'ambiguïté.
 */
export type Leg = {
  id: string
  mode: TransportMode
  /** Identifiants de `Place`. */
  fromPlace: string
  toPlace: string
  /** Nom du service : « Shinkansen Kagayaki », « Nohi Bus », « Ferry Shikoku Kisen ». */
  service?: string
  /** Ligne ou opérateur, quand c'est utile. */
  line?: string
  duration?: Duration
  cost?: Money
  passCoverage: PassCoverage
  /**
   * Points intermédiaires du tracé, en plus du départ et de l'arrivée.
   * Sert à faire suivre au trait le corridor réel (vallée, ligne, détroit)
   * plutôt qu'une droite à vol d'oiseau.
   */
  via?: Coord[]
  note?: string
}

/**
 * Le déplacement complet d'une étape à la suivante : une suite de `Leg`.
 * Un voyage Nagano → Kurashiki contient 3 legs (Shinano, Shinkansen, omnibus)
 * et chacun est tracé séparément sur la carte.
 */
export type Journey = {
  id: string
  /** Identifiants de `Destination`. */
  fromDestination: string
  toDestination: string
  legs: Leg[]
  /**
   * Correspondances explicites, avec le temps de battement conseillé.
   * Quand un billet unique couvre plusieurs legs (forfait de la route alpine,
   * billet direct Hakata → Nagasaki), le prix est porté par le premier leg
   * concerné et les suivants portent la mention « inclus » : la somme des legs
   * reste donc juste, sans double comptage.
   */
  connections?: { place: string; note: string }[]
  /** Points à vérifier : dernier départ, consigne à bagages, saisonnalité… */
  warnings?: string[]
  /**
   * Comment lire la géométrie. Aucun de nos tracés n'est un relevé GPS :
   * `schematic` suit le corridor par waypoints, `great-circle` est un arc calculé.
   */
  geometryKind: 'schematic' | 'great-circle'
}

/** Un pass ferroviaire candidat, pour l'analyse « est-ce rentable ? ». */
export type RailPass = {
  id: string
  name: string
  /** Durée de validité en jours consécutifs. */
  days: number
  price: Money
  /** Ce que le pass couvre, en clair. */
  scope: string
  /** Identifiants de `Leg` couverts par ce pass. */
  coveredLegs: string[]
  url?: string
}

export type Flight = {
  label: string
  from: string
  to: string
  date?: string
  /** Heure locale de décollage, « HH:MM ». */
  departureTime?: string
  /** Heure locale d'atterrissage, « HH:MM ». */
  arrivalTime?: string
  airline?: string
  number?: string
  /**
   * Prix du billet. Quand un aller-retour est acheté d'un bloc, le prix est
   * porté par le vol aller et le retour n'en porte aucun : même convention que
   * les `Leg` couverts par un billet groupé, pour ne rien compter deux fois.
   */
  price?: Money
  certainty: Certainty
  note?: string
}

/**
 * Un transfert d'aéroport : il encadre le voyage sans faire partie de la chaîne
 * des étapes.
 *
 * Ces trajets ne sont pas des `Journey` parce qu'ils ne relient pas deux étapes
 * — ils relient un aéroport à la ville où l'on dort déjà. Les compter comme des
 * déplacements d'étape à étape faussait les totaux et le tracé de la carte ;
 * les passer sous silence laissait au contraire un mouvement inexpliqué au début
 * et à la fin du voyage. D'où ce type à part.
 */
export type Transfer = {
  id: string
  label: string
  date?: string
  legs: Leg[]
  warnings?: string[]
}

export type Trip = {
  title: string
  subtitle: string
  /** Année ou saison du voyage, si connue. */
  period: DateInfo
  travellers?: { count: number; certainty: Certainty }
  heroPhotoId: string
  /** Vols internationaux, hors trajets intérieurs. */
  flights: Flight[]
  /** Trajets aéroport ⇄ ville, à l'arrivée et au départ. */
  transfers?: Transfer[]
  passes: RailPass[]
  /** Valeurs par défaut du calculateur de budget (ajustables dans l'UI). */
  budgetDefaults: {
    foodPerDayPerPerson: number
    activitiesPerDayPerPerson: number
    localTransportPerDayPerPerson: number
  }
}

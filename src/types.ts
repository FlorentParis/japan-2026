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
  id: string
  name: string
  category: ActivityCategory
  description?: string
  /** Clé dans PHOTOS. */
  photoId?: string
  coord?: Coord
  price?: Money
  duration?: Duration
  url?: string
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
  photoId?: string
  dates: DateInfo
  nights?: { count: number; certainty: Certainty }
  accommodation: Accommodation
  activities: Activity[]
  /** `todo` = aucune activité renseignée pour l'instant. */
  activitiesStatus: Certainty
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
  airline?: string
  number?: string
  certainty: Certainty
  note?: string
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
  passes: RailPass[]
  /** Valeurs par défaut du calculateur de budget (ajustables dans l'UI). */
  budgetDefaults: {
    foodPerDayPerPerson: number
    activitiesPerDayPerPerson: number
    localTransportPerDayPerPerson: number
  }
}

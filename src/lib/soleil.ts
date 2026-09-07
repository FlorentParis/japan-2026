/**
 * LEVER, COUCHER ET DERNIÈRE LUMIÈRE — calculés, jamais relevés.
 *
 * Pourquoi cette information a sa place dans ce carnet : le voyage se déroule du
 * 6 novembre au 5 décembre, et à cette saison le Japon perd le jour très tôt.
 * Le soleil se couche vers 16 h 30 à Tokyo fin novembre, plus tôt encore dans
 * les vallées du Nord. Une journée de visite utile fait dix heures, pas douze —
 * et arriver à 15 h à Shirakawa-gō, c'est arriver à une heure de la nuit. Aucune
 * autre donnée du site ne le dit.
 *
 * C'est la seule famille de chiffres du carnet qui ne vienne ni d'une
 * réservation ni d'une grille publique : elle est **calculée**. Ce qui la rend
 * d'une nature différente de tout le reste, et parfaitement compatible avec la
 * règle du projet — rien n'est inventé ici. L'algorithme est l'équation du lever
 * du soleil dans sa forme usuelle (Jean Meeus, *Astronomical Algorithms*, celle
 * qu'emploie le calculateur solaire de la NOAA) ; les seules entrées sont la
 * date et les coordonnées déjà présentes dans `data/destinations.ts` ; le
 * résultat est reproductible au chiffre près et concorde avec les almanachs à
 * moins d'une minute. D'où la pastille « estimation » à l'écran, au sens exact
 * que lui donne `CERTAINTY_HINT` : « relevé sur une source publique ou calculé ».
 *
 * Deux limites, dites à l'écran plutôt que tues :
 * ▸ le modèle ignore l'altitude et les conditions de réfraction du jour ;
 * ▸ c'est le soleil **géométrique**, celui d'un horizon plat. Dans une vallée
 *   encaissée — Kamikōchi, Takayama, la route alpine — la crête coupe le soleil
 *   bien avant l'heure calculée. La lumière utile finit plus tôt que ce qui est
 *   affiché, et le carnet le précise là où il l'affiche.
 *
 * Une première version de ce fichier employait l'approximation en série de
 * Fourier de la NOAA, plus courte de moitié. Elle a été remplacée parce qu'elle
 * suppose une année de 365 jours pile : son écart dépend donc de la position de
 * l'année dans le cycle bissextil, et rien dans le code ne dit de combien. La
 * forme ci-dessous part du jour julien et n'a pas cette dérive — pour une donnée
 * dont tout l'intérêt est de dire à quelle minute la lumière s'en va, la version
 * vérifiable valait les trente lignes de plus.
 *
 * Points de contrôle, à Tokyo : 4 h 26 → 19 h 00 au solstice d'été,
 * 6 h 47 → 16 h 31 à celui d'hiver.
 */
import type { Coord } from '../types'

/**
 * Décalage du Japon sur UTC, en minutes.
 *
 * Constant toute l'année : le Japon n'applique pas d'heure d'été. C'est ce qui
 * permet d'écrire une heure japonaise sans jamais consulter le fuseau de
 * l'appareil — le carnet se lit depuis la France avant le départ, et un horaire
 * converti dans le fuseau du lecteur n'aurait aucun sens ici.
 */
const JAPON_UTC_MIN = 9 * 60

/** Jour julien du 1ᵉʳ janvier 2000 à 12 h TT — l'origine des calculs. */
const J2000 = 2_451_545.0

/** Obliquité de l'écliptique, en degrés. */
const OBLIQUITE = 23.4397

/**
 * Hauteur du centre du soleil au moment où l'on parle de lever et de coucher :
 * −0,833°, soit un peu **sous** l'horizon.
 *
 * Ce n'est pas 0° — le disque a un rayon apparent (environ 16′) et l'atmosphère
 * le relève par réfraction (environ 34′). Quand on voit le soleil toucher
 * l'horizon, son centre est déjà passé dessous. C'est la valeur des almanachs.
 */
const HAUTEUR_HORIZON = -0.833

/**
 * Fin du crépuscule civil : le soleil à 6° sous l'horizon.
 *
 * C'est l'instant où l'on ne peut plus lire dehors ni photographier sans
 * trépied — la vraie fin de la journée, une demi-heure environ après le coucher.
 * En novembre au Japon, cette demi-heure est une part non négligeable de ce qu'il
 * reste de lumière : la taire ferait terminer les journées trop tôt.
 */
const HAUTEUR_CREPUSCULE = -6

const sin = (degres: number) => Math.sin((degres * Math.PI) / 180)
const cos = (degres: number) => Math.cos((degres * Math.PI) / 180)
const asin = (x: number) => (Math.asin(x) * 180) / Math.PI
const acos = (x: number) => (Math.acos(x) * 180) / Math.PI

/**
 * Nombre de jours depuis J2000 pour une date `AAAA-MM-JJ`.
 *
 * La date est lue à midi UTC — même convention que `jour()` dans `format.ts`, et
 * pour la même raison : à minuit, une heure de décalage suffirait à changer le
 * quantième. Ce compte est entier, comme l'exige l'algorithme : il désigne un
 * jour, pas un instant.
 */
function joursDepuisJ2000(iso: string): number {
  const midiUtcMs = new Date(`${iso}T12:00:00Z`).getTime()
  // 2440587,5 est le jour julien de l'époque Unix (1ᵉʳ janvier 1970 à 0 h UTC).
  return Math.round(midiUtcMs / 86_400_000 + 2_440_587.5 - J2000)
}

/**
 * Convertit un jour julien en minutes depuis minuit, heure du Japon, arrondies à
 * la minute.
 *
 * L'arrondi est fait ici, une fois, plutôt que laissé à chaque affichage : sans
 * lui, `formatMinutes()` recevrait 1019,7 et écrirait « 16 h 60 » — une heure qui
 * n'existe pas. Le repliement sur 1 440 en tient compte.
 */
function minutesAuJapon(jourJulien: number): number {
  // +0,5 : le jour julien commence à midi. +9 h : passage à l'heure japonaise.
  const fractionDuJour = jourJulien + 0.5 + JAPON_UTC_MIN / 1440
  const minutes = Math.round((fractionDuJour - Math.floor(fractionDuJour)) * 1440)
  return minutes % 1440
}

/**
 * La course du soleil un jour donné, en un lieu donné.
 *
 * Toutes les heures sont en **minutes depuis minuit, heure du Japon** — voir
 * `formatMinutes()` pour les écrire. Les champs sont optionnels parce qu'ils
 * peuvent réellement manquer (voir `angleHoraire`), pas par précaution de style.
 */
export type Soleil = {
  lever?: number
  coucher?: number
  /** Midi solaire : l'instant où le soleil est au plus haut. */
  midi: number
  /** Fin du crépuscule civil — la dernière lumière exploitable. */
  crepuscule?: number
  /** Durée entre lever et coucher, en minutes. */
  duree?: number
}

/**
 * L'angle horaire, en degrés, auquel le soleil atteint une hauteur donnée.
 *
 * `undefined` quand il ne l'atteint jamais ce jour-là : soleil de minuit ou nuit
 * polaire. Le cas ne se produit nulle part au Japon, mais un `Math.acos` hors de
 * [−1, 1] renvoie `NaN`, et un « NaN h » à l'écran serait exactement la fausse
 * valeur que ce projet refuse. Le trou est donc typé.
 */
function angleHoraire(
  latitude: number,
  declinaison: number,
  hauteur: number,
): number | undefined {
  const cosinus =
    (sin(hauteur) - sin(latitude) * sin(declinaison)) / (cos(latitude) * cos(declinaison))
  if (cosinus < -1 || cosinus > 1) return undefined
  return acos(cosinus)
}

/**
 * Le soleil d'une date en un point, à partir des seules coordonnées de nos données.
 *
 * `coord` est en ordre GeoJSON — longitude puis latitude — comme partout ailleurs
 * dans le site.
 */
export function soleilDuJour(date: string, coord: Coord): Soleil {
  const [longitude, latitude] = coord
  const n = joursDepuisJ2000(date)

  // Midi solaire moyen, en jours depuis J2000. La longitude est comptée positive
  // vers l'est dans nos données, et l'algorithme la veut positive vers l'ouest :
  // d'où le signe. Un degré vaut quatre minutes de décalage.
  const jourMoyen = n - longitude / 360

  // Anomalie moyenne du soleil, puis équation du centre : ce que l'orbite
  // elliptique de la Terre ajoute à un mouvement qu'on suppose d'abord circulaire.
  const anomalie = (357.5291 + 0.98560028 * jourMoyen) % 360
  const centre =
    1.9148 * sin(anomalie) + 0.02 * sin(2 * anomalie) + 0.0003 * sin(3 * anomalie)

  // Longitude écliptique du soleil. 102,9372° est la longitude du périhélie.
  const ecliptique = (anomalie + centre + 180 + 102.9372) % 360

  // Midi solaire vrai : le moyen, corrigé de l'équation du temps (ses deux termes
  // sont exactement ces deux sinus).
  const transit = J2000 + jourMoyen + 0.0053 * sin(anomalie) - 0.0069 * sin(2 * ecliptique)

  const declinaison = asin(sin(ecliptique) * sin(OBLIQUITE))
  const ha = angleHoraire(latitude, declinaison, HAUTEUR_HORIZON)
  const haCrepuscule = angleHoraire(latitude, declinaison, HAUTEUR_CREPUSCULE)

  return {
    midi: minutesAuJapon(transit),
    lever: ha === undefined ? undefined : minutesAuJapon(transit - ha / 360),
    coucher: ha === undefined ? undefined : minutesAuJapon(transit + ha / 360),
    crepuscule:
      haCrepuscule === undefined ? undefined : minutesAuJapon(transit + haCrepuscule / 360),
    // Calculée sur l'angle horaire, et non par différence des deux heures
    // repliées sur 1 440 : la soustraction donnerait une durée négative dès qu'un
    // lever ou un coucher enjambe minuit.
    duree: ha === undefined ? undefined : Math.round((2 * ha * 1440) / 360),
  }
}

/**
 * L'instant présent, heure du Japon : la date locale japonaise et les minutes
 * écoulées depuis son minuit.
 *
 * Dérivé de l'horloge UTC de l'appareil, jamais de son fuseau : le carnet donne
 * la même réponse qu'il soit lu de Paris ou de Matsumoto. Seule l'exactitude de
 * l'horloge compte, et le décalage japonais est fixe.
 */
export function maintenantAuJapon(instant: Date = new Date()): {
  date: string
  minutes: number
} {
  const japon = new Date(instant.getTime() + JAPON_UTC_MIN * 60_000)
  const mois = String(japon.getUTCMonth() + 1).padStart(2, '0')
  const quantieme = String(japon.getUTCDate()).padStart(2, '0')
  return {
    date: `${japon.getUTCFullYear()}-${mois}-${quantieme}`,
    minutes: japon.getUTCHours() * 60 + japon.getUTCMinutes(),
  }
}

/**
 * Ce qu'il reste de jour à un instant donné, en minutes.
 *
 * Trois réponses distinctes, et c'est tout l'intérêt : le nombre de minutes
 * restantes, `0` quand le soleil est déjà couché, et `undefined` quand la
 * question ne se pose pas — avant le lever, ou heure du coucher inconnue.
 * Confondre `0` et `undefined` ferait annoncer « plus de jour » à cinq heures du
 * matin.
 */
export function lumiereRestante(soleil: Soleil, minutes: number): number | undefined {
  if (soleil.coucher === undefined || soleil.lever === undefined) return undefined
  if (minutes < soleil.lever) return undefined
  return Math.max(0, soleil.coucher - minutes)
}

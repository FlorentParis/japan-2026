/**
 * Conversion des données du voyage en GeoJSON pour la carte.
 *
 * Un tronçon = une `LineString`. Rien n'est agrégé : la carte ne peut donc pas
 * afficher un trait « Tokyo — Hiroshima » sans le détail des moyens de transport,
 * puisqu'un tel trait n'existe nulle part dans les données.
 */
import type { Feature, FeatureCollection, LineString, Point } from 'geojson'
import { DESTINATIONS } from '../data/destinations'
import { JOURNEYS } from '../data/journeys'
import { place } from '../data/places'
import type { Coord, Destination, Journey, Leg, TransportMode } from '../types'
import { bounds, legDistanceKm, legPath } from './geo'
import { modeStyle } from './modes'

export type LegProperties = {
  legId: string
  journeyId: string
  mode: TransportMode
  /** « Shinkansen Sakura », « Nohi Bus »… */
  service: string
  from: string
  to: string
  km: number
  /** Numéro d'ordre du trajet dans le voyage, pour l'étiquette. */
  step: number
}

/**
 * `kind` distingue un lieu de visite de l'hôtel réservé : la carte les dessine
 * différemment, sans quoi le point où l'on dort se confondrait avec le Sensō-ji.
 */
export type SpotProperties = {
  name: string
  destinationId: string
  kind: 'repere' | 'hebergement'
}

function legFeature(leg: Leg, journey: Journey, step: number): Feature<LineString, LegProperties> {
  return {
    type: 'Feature',
    properties: {
      legId: leg.id,
      journeyId: journey.id,
      mode: leg.mode,
      service: leg.service ?? modeStyle(leg.mode).label,
      from: place(leg.fromPlace).name,
      to: place(leg.toPlace).name,
      km: Math.round(legDistanceKm(leg)),
      step,
    },
    geometry: { type: 'LineString', coordinates: legPath(leg) },
  }
}

/** Tous les tronçons du voyage, prêts à être stylés par mode. */
export const LEGS_GEOJSON: FeatureCollection<LineString, LegProperties> = {
  type: 'FeatureCollection',
  features: JOURNEYS.flatMap((journey, i) =>
    journey.legs.map((leg) => legFeature(leg, journey, i + 1)),
  ),
}

/** Cadre englobant l'ensemble du parcours. */
export const TRIP_BOUNDS = bounds([
  ...LEGS_GEOJSON.features.flatMap((f) => f.geometry.coordinates as Coord[]),
  ...DESTINATIONS.map((d) => d.coord),
])

export function journeyBounds(journey: Journey) {
  return bounds(journey.legs.flatMap(legPath))
}

/**
 * Points d'une étape — affichés seulement quand elle est sélectionnée : ses
 * repères de visite, et l'hôtel s'il est réservé et localisé.
 */
export function spotsGeoJSON(dest?: Destination): FeatureCollection<Point, SpotProperties> {
  const point = (
    name: string,
    coord: Coord,
    kind: SpotProperties['kind'],
  ): Feature<Point, SpotProperties> => ({
    type: 'Feature',
    properties: { name, destinationId: dest?.id ?? '', kind },
    geometry: { type: 'Point', coordinates: coord },
  })

  const hotel = dest?.accommodation
  return {
    type: 'FeatureCollection',
    features: [
      ...(dest?.spots ?? []).map((spot) => point(spot.name, spot.coord, 'repere')),
      // Sans coordonnées, pas de repère : une adresse ne se place pas au jugé.
      ...(hotel?.coord ? [point(hotel.name ?? 'Hébergement', hotel.coord, 'hebergement')] : []),
    ],
  }
}

/** Les coordonnées à faire tenir dans le cadre quand une étape est sélectionnée. */
export function spotCoords(dest?: Destination): Coord[] {
  return spotsGeoJSON(dest).features.map((f) => f.geometry.coordinates as Coord)
}

export const EMPTY_POINTS: FeatureCollection<Point, SpotProperties> = {
  type: 'FeatureCollection',
  features: [],
}

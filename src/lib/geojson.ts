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

export type SpotProperties = { name: string; destinationId: string }

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

/** Points d'intérêt d'une étape — affichés seulement quand elle est sélectionnée. */
export function spotsGeoJSON(dest?: Destination): FeatureCollection<Point, SpotProperties> {
  return {
    type: 'FeatureCollection',
    features: (dest?.spots ?? []).map((spot) => ({
      type: 'Feature' as const,
      properties: { name: spot.name, destinationId: dest?.id ?? '' },
      geometry: { type: 'Point' as const, coordinates: spot.coord },
    })),
  }
}

export const EMPTY_POINTS: FeatureCollection<Point, SpotProperties> = {
  type: 'FeatureCollection',
  features: [],
}

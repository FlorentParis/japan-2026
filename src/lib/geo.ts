/** Géométrie : distances, tracés, cadrages. Rien de spécifique à la carte ici. */
import type { Coord, Journey, Leg } from '../types'
import { place } from '../data/places'

const R_EARTH_KM = 6371
const rad = (deg: number) => (deg * Math.PI) / 180

/** Distance orthodromique entre deux points, en kilomètres. */
export function haversineKm([lon1, lat1]: Coord, [lon2, lat2]: Coord): number {
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R_EARTH_KM * Math.asin(Math.sqrt(a))
}

/** Longueur cumulée d'une polyligne, en kilomètres. */
export function pathLengthKm(path: Coord[]): number {
  let total = 0
  for (let i = 1; i < path.length; i++) total += haversineKm(path[i - 1], path[i])
  return total
}

/**
 * Arc géodésique entre deux points, échantillonné.
 * Utilisé pour les vols : une droite en projection Mercator serait fausse,
 * et un trait tendu ne se lit pas comme un vol.
 */
export function greatCircle(from: Coord, to: Coord, steps = 48): Coord[] {
  const [lon1, lat1] = from.map(rad) as Coord
  const [lon2, lat2] = to.map(rad) as Coord
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2,
      ),
    )
  if (d === 0) return [from, to]

  const points: Coord[] = []
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const a = Math.sin((1 - f) * d) / Math.sin(d)
    const b = Math.sin(f * d) / Math.sin(d)
    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2)
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2)
    const z = a * Math.sin(lat1) + b * Math.sin(lat2)
    points.push([
      (Math.atan2(y, x) * 180) / Math.PI,
      (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
    ])
  }
  return points
}

/**
 * Tracé d'un leg : départ, waypoints, arrivée.
 * Les vols passent par un arc géodésique ; tout le reste suit ses waypoints.
 */
export function legPath(leg: Leg): Coord[] {
  const from = place(leg.fromPlace).coord
  const to = place(leg.toPlace).coord

  if (leg.mode === 'plane') return greatCircle(from, to)

  // Cas particulier : un leg qui boucle sur le même lieu (traversée du barrage
  // à pied) n'a de sens que par ses waypoints.
  if (leg.fromPlace === leg.toPlace && leg.via?.length) return [from, ...leg.via, to]

  return [from, ...(leg.via ?? []), to]
}

/** Distance d'un leg, le long de son tracé. */
export function legDistanceKm(leg: Leg): number {
  return pathLengthKm(legPath(leg))
}

export function journeyDistanceKm(journey: Journey): number {
  return journey.legs.reduce((sum, leg) => sum + legDistanceKm(leg), 0)
}

/** Cadre englobant une liste de points, au format attendu par MapLibre. */
export function bounds(coords: Coord[]): [[number, number], [number, number]] {
  const lons = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ]
}

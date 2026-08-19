/**
 * Fond de carte : source distante, secours local, et détection de WebGL.
 *
 * Principe : l'itinéraire est *notre* donnée, le fond de carte est un service
 * tiers. Si le tiers est injoignable (réseau d'entreprise, filtrage, hors
 * ligne), le tracé doit rester visible — c'est lui qui porte l'information.
 */
import type { StyleSpecification } from 'maplibre-gl'

/**
 * OpenFreeMap, style Positron : vectoriel, libre, sans clé API ni compte.
 * Les données viennent d'OpenStreetMap.
 */
export const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

/**
 * Secours si le fond distant ne répond pas : un simple aplat couleur papier.
 * Aucune requête réseau, aucune police à télécharger — les noms d'étapes sont
 * des éléments HTML, ils s'affichent donc quand même.
 */
export const STYLE_SECOURS: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'fond-uni', type: 'background', paint: { 'background-color': '#e7e0d2' } }],
}

/**
 * MapLibre dessine en WebGL. Sur un poste où l'accélération matérielle est
 * désactivée (fréquent sur une machine d'entreprise), le constructeur lève une
 * exception : autant le savoir avant, pour afficher une explication utile
 * plutôt qu'un cadre vide.
 */
export function webglDisponible(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * LA CARTE — tout le parcours sur une seule vue.
 *
 * Ce qui est dessiné, et comment :
 * ▸ chaque tronçon est une ligne indépendante, stylée selon son mode
 *   (couleur + forme du trait, définis dans `lib/modes.ts`) ;
 * ▸ un liseré blanc passe sous chaque ligne pour qu'elle reste lisible
 *   au-dessus du fond de carte et lorsque deux tracés se superposent ;
 * ▸ les étapes sont de vrais boutons HTML : cliquables à la souris, au doigt
 *   et au clavier, avec leur numéro d'ordre ;
 * ▸ sélectionner une étape ou un trajet recadre la carte et estompe le reste.
 *
 * Robustesse : le fond de carte vient d'un service tiers, le tracé vient de nos
 * données. Si le tiers ne répond pas, on bascule sur un fond uni et le tracé
 * reste affiché, avec un bandeau qui dit ce qui manque. Si le navigateur ne
 * fournit pas de WebGL, on l'explique et on renvoie vers l'itinéraire en liste
 * plutôt que de laisser un cadre vide.
 *
 * Honnêteté cartographique : aucun tracé n'est un relevé GPS. Les lignes
 * terrestres et maritimes suivent le corridor réel par points de passage, les
 * vols sont des arcs géodésiques calculés. C'est écrit sous la carte.
 */
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import { DESTINATIONS, destination } from '../data/destinations'
import { JOURNEY_BY_ID, JOURNEYS } from '../data/journeys'
import { STYLE_SECOURS, STYLE_URL, webglDisponible } from '../lib/fond-de-carte'
import { bounds, legPath } from '../lib/geo'
import {
  EMPTY_POINTS,
  LEGS_GEOJSON,
  TRIP_BOUNDS,
  spotCoords,
  spotsGeoJSON,
  type LegProperties,
} from '../lib/geojson'
import { MODE_ORDER, MODE_STYLES } from '../lib/modes'
import { cameraDuration } from '../lib/motion'
import { useTrip } from '../state/trip-state'
import type { TransportMode } from '../types'

const HIT_LAYER = 'leg-hit'

/**
 * Les deux calques de points d'une étape : ses repères de visite, et l'hôtel
 * réservé. Ils partagent la source `spots` et se distinguent par `kind`.
 */
const SPOT_LAYERS = ['spot-dots', 'spot-hotel'] as const
const casingLayer = (mode: TransportMode) => `leg-casing-${mode}`
const lineLayer = (mode: TransportMode) => `leg-line-${mode}`

/** Du fond vers le dessus : la marche en dessous, le Shinkansen au-dessus. */
const DRAW_ORDER = [...MODE_ORDER].reverse()

/**
 * Au-delà de ce délai sans réponse ni erreur, on considère le fond distant
 * comme injoignable. Un proxy d'entreprise fait souvent traîner la requête
 * indéfiniment au lieu de la refuser : sans ce garde-fou, la carte resterait
 * sur « chargement » pour toujours.
 */
const DELAI_FOND_MS = 12_000

/** État du fond de carte, indépendant de l'état du tracé. */
type EtatFond = 'attente' | 'distant' | 'secours'

type Props = {
  /** La carte n'anime rien quand elle est masquée, et se remesure en réapparaissant. */
  active: boolean
}

export function MapView({ active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, HTMLButtonElement>>(new Map())

  // `couches` = nos sources et calques sont en place. C'est la condition des
  // effets ci-dessous, distincte de l'état du fond de carte.
  const [couches, setCouches] = useState(false)
  const [fond, setFond] = useState<EtatFond>('attente')
  const [panne, setPanne] = useState<string | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const [zoomedIn, setZoomedIn] = useState(false)

  // Testé une fois, au premier rendu : inutile de créer la carte pour découvrir
  // que le navigateur ne sait pas la dessiner.
  const [webgl] = useState(webglDisponible)

  const { selection, selectDestination, selectJourney, clearSelection, visibleModes, goTo } =
    useTrip()

  // Les gestionnaires d'événements de MapLibre sont posés une seule fois : ils
  // lisent les actions à travers cette référence, toujours à jour.
  const actionsRef = useRef({ selectDestination, selectJourney, clearSelection })
  useEffect(() => {
    actionsRef.current = { selectDestination, selectJourney, clearSelection }
  }, [selectDestination, selectJourney, clearSelection])

  // ── Création de la carte, une seule fois ────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const markers = markersRef.current

    if (!webgl) return

    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container,
        style: STYLE_URL,
        bounds: TRIP_BOUNDS,
        fitBoundsOptions: { padding: 56 },
        minZoom: 3.5,
        maxZoom: 15,
        // Pas de rotation ni d'inclinaison : sur un itinéraire, ça n'apporte rien
        // et ça désoriente, surtout au doigt.
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: { compact: true },
      })
    } catch (erreur) {
      // C'est précisément le rôle de cet effet : synchroniser React avec un
      // système extérieur qui, ici, refuse de démarrer. On ne peut le savoir
      // qu'en essayant, donc le setState est à sa place.
      // oxlint-disable-next-line react/set-state-in-effect
      setPanne('La carte n’a pas pu être initialisée dans ce navigateur.')
      setDetail(erreur instanceof Error ? erreur.message : String(erreur))
      return
    }

    mapRef.current = map
    // Exposée pour le contrôle en navigateur (`scripts/qa-carte.mjs`), qui vérifie
    // l'état réel de la carte plutôt que la seule présence des éléments HTML.
    ;(window as unknown as { carteMapLibre?: maplibregl.Map }).carteMapLibre = map
    map.touchZoomRotate.disableRotation()
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: 'map-popup',
      maxWidth: '260px',
    })

    /**
     * Pose nos sources et nos calques. Appelée à chaque style chargé — style
     * distant au démarrage, fond de secours ensuite — car un changement de
     * style efface tout ce qu'on avait ajouté. Idempotente.
     *
     * Attention au piège : `isStyleLoaded()` ne dit pas « le style est
     * exploitable » mais « le style *et toutes ses tuiles et images* sont
     * chargés ». Il reste faux pendant tout le chargement du fond, alors que
     * `addSource`/`addLayer` fonctionnent dès que le style est analysé. S'en
     * servir comme condition, c'est ne jamais dessiner l'itinéraire.
     */
    const installerTrace = () => {
      if (map.getSource('legs')) return

      map.addSource('legs', { type: 'geojson', data: LEGS_GEOJSON })
      map.addSource('spots', { type: 'geojson', data: EMPTY_POINTS })

      // 1. Liserés blancs : posés d'abord, donc tous sous les lignes de couleur.
      for (const mode of DRAW_ORDER) {
        const style = MODE_STYLES[mode]
        map.addLayer({
          id: casingLayer(mode),
          type: 'line',
          source: 'legs',
          filter: ['==', ['get', 'mode'], mode],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#ffffff',
            'line-width': style.width + 3.4,
            'line-opacity': 0.85,
          },
        })
      }

      // 2. Les lignes elles-mêmes.
      for (const mode of DRAW_ORDER) {
        const style = MODE_STYLES[mode]
        map.addLayer({
          id: lineLayer(mode),
          type: 'line',
          source: 'legs',
          filter: ['==', ['get', 'mode'], mode],
          layout: { 'line-cap': style.dash ? 'butt' : 'round', 'line-join': 'round' },
          paint: {
            'line-color': style.color,
            'line-width': style.width,
            ...(style.dash ? { 'line-dasharray': style.dash } : {}),
          },
        })
      }

      // 3. Points d'intérêt de l'étape sélectionnée.
      map.addLayer({
        id: 'spot-dots',
        type: 'circle',
        source: 'spots',
        filter: ['==', ['get', 'kind'], 'repere'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#8C5A3B', // --todo : ces repères ne sont pas un programme
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      // 4. L'hôtel réservé : plus gros et vert — la couleur du confirmé, la même
      //    que les liserés de la vue Hôtels. Sans quoi le point où l'on dort se
      //    confondrait avec le Sensō-ji d'à côté.
      map.addLayer({
        id: 'spot-hotel',
        type: 'circle',
        source: 'spots',
        filter: ['==', ['get', 'kind'], 'hebergement'],
        paint: {
          'circle-radius': 7,
          'circle-color': '#2F6B4F', // --confirmed
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      })

      // 5. Zone de clic large et invisible : viser un trait de 3 px au doigt
      //    est impossible, viser 22 px l'est.
      map.addLayer({
        id: HIT_LAYER,
        type: 'line',
        source: 'legs',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#000000', 'line-opacity': 0, 'line-width': 22 },
      })

      setCouches(true)
    }

    // ── Bascule sur le fond de secours ────────────────────────────────────

    // Un style *reçu et analysé* — le seul signal fiable pour dire que le
    // fournisseur a répondu. Ne pas confondre avec `isStyleLoaded()`.
    let styleRecu = false
    let secoursEngage = false

    const basculerVersSecours = (raison: string) => {
      if (secoursEngage) return
      secoursEngage = true
      setFond('secours')
      setDetail(raison)
      // Le style change : nos calques disparaissent, `installerTrace` les
      // remettra au prochain `styledata`. On repasse `couches` à false pour que
      // les filtres et la mise en avant soient réappliqués derrière.
      setCouches(false)
      map.setStyle(STYLE_SECOURS)
    }

    // Un proxy qui ne répond ni oui ni non : on tranche au bout du délai.
    const minuterie = window.setTimeout(() => {
      if (!styleRecu) basculerVersSecours(`Aucune réponse de ${new URL(STYLE_URL).host} en 12 s.`)
    }, DELAI_FOND_MS)

    map.on('error', (event) => {
      const message = event.error?.message ?? 'erreur inconnue'
      // Utile pour diagnostiquer : le bandeau résume, la console détaille.
      console.error('[carte]', message, event.error)
      // Style jamais reçu = fond injoignable. Une tuile isolée qui manque alors
      // que le style est là ne justifie pas de tout basculer.
      if (!styleRecu) basculerVersSecours(message)
    })

    const styleEstPret = () => {
      styleRecu = true
      window.clearTimeout(minuterie)
      if (!secoursEngage) setFond('distant')
      try {
        installerTrace()
      } catch (erreur) {
        // Le tracé est le cœur du site : si sa pose échoue, on veut le savoir.
        console.error('[carte] pose du tracé impossible :', erreur)
      }
    }

    // `styledata` couvre le premier style comme les changements de style ;
    // `load` sert de filet si le premier événement passait avant nos écouteurs.
    map.on('styledata', styleEstPret)
    map.on('load', styleEstPret)

    const describe = (props: LegProperties) => {
      const style = MODE_STYLES[props.mode]
      const el = document.createElement('div')
      const title = document.createElement('strong')
      title.textContent = `${style.icon} ${props.service}`
      const route = document.createElement('span')
      route.textContent = `${props.from} → ${props.to}`
      const km = document.createElement('em')
      km.textContent = `${props.km} km · étape ${props.step}`
      el.append(title, route, km)
      return el
    }

    // Les écouteurs liés à un calque peuvent être posés avant que le calque
    // n'existe : ils ne se déclenchent simplement pas d'ici là.
    map.on('mousemove', HIT_LAYER, (event) => {
      const feature = event.features?.[0]
      if (!feature) return
      map.getCanvas().style.cursor = 'pointer'
      popup
        .setLngLat(event.lngLat)
        .setDOMContent(describe(feature.properties as LegProperties))
        .addTo(map)
    })

    map.on('mouseleave', HIT_LAYER, () => {
      map.getCanvas().style.cursor = ''
      popup.remove()
    })

    map.on('click', HIT_LAYER, (event) => {
      const feature = event.features?.[0]
      if (!feature) return
      const props = feature.properties as LegProperties
      actionsRef.current.selectJourney(props.journeyId, props.legId)
    })

    for (const couche of SPOT_LAYERS) {
      map.on('click', couche, (event) => {
        const feature = event.features?.[0]
        if (!feature) return
        popup.remove()
        const nom = String(feature.properties.name)
        new maplibregl.Popup({ offset: 12, className: 'map-popup', closeButton: false })
          .setLngLat(event.lngLat)
          // L'infobulle dit à quel titre le point est là : un repère de visite et
          // l'hôtel réservé ne se lisent pas de la même façon.
          .setText(feature.properties.kind === 'hebergement' ? `${nom} — hébergement` : nom)
          .addTo(map)
      })
    }

    // Cliquer le fond de carte désélectionne.
    map.on('click', (event) => {
      if (!map.getLayer(HIT_LAYER)) return
      const hits = map.queryRenderedFeatures(event.point, {
        layers: [HIT_LAYER, ...SPOT_LAYERS],
      })
      if (hits.length === 0) actionsRef.current.clearSelection()
    })

    map.on('zoom', () => setZoomedIn(map.getZoom() >= 7.2))

    return () => {
      window.clearTimeout(minuterie)
      popup.remove()
      markers.clear()
      map.remove()
      mapRef.current = null
      setCouches(false)
    }
  }, [webgl])

  // ── Marqueurs d'étape : de vrais boutons ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !couches) return

    const markers: maplibregl.Marker[] = []
    const registry = markersRef.current
    const seen = new Map<string, number>()

    for (const dest of DESTINATIONS) {
      // Tokyo apparaît au départ et à l'arrivée, au même endroit : on décale
      // légèrement le second repère pour que les deux restent cliquables.
      const key = dest.coord.join(',')
      const occurrence = seen.get(key) ?? 0
      seen.set(key, occurrence + 1)

      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'step-marker'
      if (dest.stay === 'day') button.classList.add('step-marker--day')
      button.setAttribute(
        'aria-label',
        `Étape ${dest.order} : ${dest.name}${dest.stay === 'day' ? ' (visite dans la journée)' : ''}`,
      )
      button.innerHTML =
        `<span class="step-marker__dot">${dest.order}</span>` +
        `<span class="step-marker__label">${dest.name}</span>`
      button.addEventListener('click', (event) => {
        event.stopPropagation()
        actionsRef.current.selectDestination(dest.id)
      })

      markers.push(
        new maplibregl.Marker({
          element: button,
          anchor: 'center',
          offset: [0, occurrence * -30],
        })
          .setLngLat(dest.coord)
          .addTo(map),
      )
      registry.set(dest.id, button)
    }

    return () => {
      for (const marker of markers) marker.remove()
      registry.clear()
    }
  }, [couches])

  // ── Filtres par mode ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !couches || !map.getLayer(HIT_LAYER)) return
    for (const mode of MODE_ORDER) {
      const visibility = visibleModes.includes(mode) ? 'visible' : 'none'
      map.setLayoutProperty(casingLayer(mode), 'visibility', visibility)
      map.setLayoutProperty(lineLayer(mode), 'visibility', visibility)
    }
    // La zone de clic suit les filtres, sinon on sélectionnerait un tracé masqué.
    map.setFilter(HIT_LAYER, ['in', ['get', 'mode'], ['literal', visibleModes]])
  }, [visibleModes, couches])

  // ── Mise en avant de la sélection ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !couches || !map.getLayer(HIT_LAYER)) return

    // Étape sélectionnée : on met en avant le trajet d'arrivée et celui de départ.
    // Trajet sélectionné : lui seul.
    const relatedJourneys =
      selection === null
        ? []
        : selection.kind === 'journey'
          ? [selection.id]
          : JOURNEYS.filter(
              (j) => j.fromDestination === selection.id || j.toDestination === selection.id,
            ).map((j) => j.id)

    for (const mode of MODE_ORDER) {
      const style = MODE_STYLES[mode]
      if (relatedJourneys.length === 0) {
        map.setPaintProperty(lineLayer(mode), 'line-opacity', 1)
        map.setPaintProperty(casingLayer(mode), 'line-opacity', 0.85)
        map.setPaintProperty(lineLayer(mode), 'line-width', style.width)
      } else {
        const isRelated = ['in', ['get', 'journeyId'], ['literal', relatedJourneys]]
        map.setPaintProperty(lineLayer(mode), 'line-opacity', ['case', isRelated, 1, 0.22])
        map.setPaintProperty(casingLayer(mode), 'line-opacity', ['case', isRelated, 0.95, 0.15])
        map.setPaintProperty(lineLayer(mode), 'line-width', [
          'case',
          isRelated,
          style.width + 1.4,
          style.width,
        ])
      }
    }

    for (const [id, button] of markersRef.current) {
      button.classList.toggle('is-selected', selection?.kind === 'destination' && selection.id === id)
      button.classList.toggle(
        'is-related',
        selection?.kind === 'journey' &&
          (JOURNEY_BY_ID[selection.id]?.fromDestination === id ||
            JOURNEY_BY_ID[selection.id]?.toDestination === id),
      )
    }

    const spotSource = map.getSource('spots') as maplibregl.GeoJSONSource | undefined
    spotSource?.setData(
      selection?.kind === 'destination' ? spotsGeoJSON(destination(selection.id)) : EMPTY_POINTS,
    )
  }, [selection, couches])

  // ── Recadrage : la carte suit la sélection ──────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !couches || !active) return

    if (!selection) {
      map.fitBounds(TRIP_BOUNDS, { padding: 56, duration: cameraDuration() })
      return
    }

    if (selection.kind === 'destination') {
      const dest = destination(selection.id)
      // Les mêmes points que ceux dessinés, hôtel réservé compris : le cadre ne
      // doit pas laisser dehors un repère qu'on vient d'afficher.
      const spots = spotCoords(dest)
      if (spots.length > 1) {
        map.fitBounds(bounds([dest.coord, ...spots]), {
          padding: 90,
          duration: cameraDuration(),
          maxZoom: 12,
        })
      } else {
        map.easeTo({ center: dest.coord, zoom: Math.max(map.getZoom(), 9), duration: cameraDuration() })
      }
      return
    }

    const journey = JOURNEY_BY_ID[selection.id]
    if (!journey) return
    const target = selection.legId ? journey.legs.find((l) => l.id === selection.legId) : undefined
    const coords = target ? legPath(target) : journey.legs.flatMap(legPath)
    map.fitBounds(bounds(coords), { padding: 70, duration: cameraDuration(), maxZoom: 11 })
  }, [selection, couches, active])

  // Une carte masquée par `display:none` perd ses dimensions : on la remesure.
  useEffect(() => {
    if (active) mapRef.current?.resize()
  }, [active])

  const resetView = () => {
    clearSelection()
    mapRef.current?.fitBounds(TRIP_BOUNDS, { padding: 56, duration: cameraDuration() })
  }

  const reessayerLeFond = () => {
    const map = mapRef.current
    if (!map) return
    setFond('attente')
    setCouches(false)
    map.setStyle(STYLE_URL)
  }

  // WebGL absent ou carte impossible à créer : on le dit, et on propose la
  // seule chose utile — le même itinéraire, en liste.
  if (!webgl || panne) {
    return (
      <div className="map-shell map-shell--panne">
        <div className="map-panne">
          <h3>Carte indisponible</h3>
          <p>
            {panne ??
              'Ce navigateur ne fournit pas de contexte WebGL : la carte ne peut pas être dessinée.'}
          </p>
          <p className="map-panne__detail">
            {detail ??
              'Cause la plus fréquente : accélération matérielle désactivée dans le navigateur.'}
          </p>
          <button type="button" className="button" onClick={() => goTo('itineraire')}>
            Voir l’itinéraire en liste
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`map-shell${zoomedIn ? ' map-shell--labels' : ''}`}>
      <div ref={containerRef} className="map-canvas" />
      <button type="button" className="map-reset" onClick={resetView}>
        Voir tout le parcours
      </button>

      {fond === 'secours' && (
        <div className="map-avertissement" role="status">
          <p>
            <strong>Fond de carte indisponible.</strong> Le tracé de l’itinéraire et les étapes
            restent affichés, sans le décor (villes, reliefs, côtes).
          </p>
          {detail && <p className="map-avertissement__detail">{detail}</p>}
          <button type="button" onClick={reessayerLeFond}>
            Réessayer
          </button>
        </div>
      )}

      {/* Texte distinct de celui du chargement du module (voir App.tsx) : ça
          permet de savoir lequel des deux bloque. */}
      {!couches && <p className="map-loading">Initialisation de la carte…</p>}
    </div>
  )
}

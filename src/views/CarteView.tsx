/**
 * VUE CARTE — carte et frise chronologique côte à côte.
 *
 * Sur grand écran : la carte à gauche, la frise à droite, les deux synchronisées.
 * Sur mobile : la carte en haut sur une hauteur fixe, la frise dessous dans sa
 * propre zone de défilement — la page elle-même ne défile pas, donc on ne se
 * retrouve jamais « piégé » dans la carte en essayant de faire défiler l'écran.
 */
import { MapView } from '../components/MapView'
import { ModeLegend } from '../components/ModeLegend'
import { Timeline } from '../components/Timeline'
import { JOURNEY_BY_ID } from '../data/journeys'
import { destination } from '../data/destinations'
import { journeyLabel } from '../lib/derive'
import { useTrip } from '../state/trip-state'

export function CarteView({ active }: { active: boolean }) {
  const { selection, clearSelection } = useTrip()

  const label = (() => {
    if (!selection) return null
    if (selection.kind === 'destination') {
      const dest = destination(selection.id)
      return `Étape ${dest.order} · ${dest.name}`
    }
    const journey = JOURNEY_BY_ID[selection.id]
    return journey ? `Trajet · ${journeyLabel(journey)}` : null
  })()

  return (
    <div className="view view--carte">
      <div className="map-column">
        <div className="map-column__map">
          <MapView active={active} />
          {label && (
            <div className="map-selection">
              <span>{label}</span>
              <button type="button" onClick={clearSelection} aria-label="Annuler la sélection">
                ✕
              </button>
            </div>
          )}
        </div>
        <ModeLegend />
      </div>

      <aside className="timeline-column" aria-label="Frise chronologique du voyage">
        <div className="timeline-column__head">
          <h2>Itinéraire</h2>
          <p>
            Sélectionne une étape ou un trajet : la carte se recentre et le détail s’ouvre ici.
          </p>
        </div>
        <div className="timeline-column__scroll">
          <Timeline compact />
        </div>
      </aside>
    </div>
  )
}

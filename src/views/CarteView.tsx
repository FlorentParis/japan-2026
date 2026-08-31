/**
 * VUE CARTE — carte et frise chronologique.
 *
 * Sur grand écran : la carte à gauche avec sa légende dessous, la frise à
 * droite, les deux synchronisées.
 *
 * Sur mobile : la carte prend tout l'écran et la frise devient un tiroir qu'on
 * fait glisser par le bas (replié / à moitié / plein). La légende, qui mangeait
 * un bon quart de la hauteur alors qu'on ne la consulte qu'une fois, passe
 * derrière un bouton « Modes » dans l'en-tête du tiroir. Résultat : la carte
 * respire, et la liste des étapes s'ouvre en grand d'un seul appui — au lieu
 * d'être coincée dans une bande de 40 % d'écran.
 *
 * La page elle-même ne défile jamais : on ne se retrouve donc pas « piégé » dans
 * la carte en essayant de faire défiler l'écran.
 */
import { useEffect, useState } from 'react'
import { MapView } from '../components/MapView'
import { ModeLegend } from '../components/ModeLegend'
import { Timeline } from '../components/Timeline'
import { JOURNEY_BY_ID } from '../data/journeys'
import { destination } from '../data/destinations'
import { journeyLabel, totalsByMode } from '../lib/derive'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useTiroir, type Palier } from '../lib/useTiroir'
import { useTrip } from '../state/trip-state'

const AIDE_PRISE: Record<Palier, string> = {
  replie: 'Liste des étapes repliée. Ouvrir à moitié.',
  demi: 'Liste des étapes à moitié ouverte. Ouvrir en plein écran.',
  plein: 'Liste des étapes en plein écran. Replier.',
}

export function CarteView({ active }: { active: boolean }) {
  const { selection, clearSelection, visibleModes } = useTrip()

  /*
   * Le tiroir n'existe que sur les écrans empilés. En paysage sur téléphone
   * (écran bas mais large), la mise en page passe côte à côte : un tiroir y
   * recouvrirait la carte pour rien.
   */
  const etroit = useMediaQuery('(max-width: 1023px)')
  const paysageCourt = useMediaQuery('(max-height: 560px) and (min-width: 620px)')
  const enTiroir = etroit && !paysageCourt

  const { cadreRef, teteRef, palier, pret, style, priseProps, entrouvrir, masqueBas } =
    useTiroir(enTiroir)

  const [legendeDemandee, setLegendeDemandee] = useState(false)
  /*
   * Le panneau n'existe que sur mobile. On le dérive du réglage plutôt que de
   * remettre l'état à zéro dans un effet : au retour sur grand écran, la légende
   * redevient simplement une colonne, sans passer par un rendu intermédiaire.
   */
  const legendeOuverte = legendeDemandee && enTiroir

  const modesMasques = totalsByMode().length - visibleModes.length

  // Une sélection venue de la carte n'a aucun intérêt si son détail reste caché
  // sous le tiroir replié : on l'entrouvre.
  useEffect(() => {
    if (selection) entrouvrir()
  }, [selection, entrouvrir])

  useEffect(() => {
    if (!legendeOuverte) return
    const surTouche = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLegendeDemandee(false)
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [legendeOuverte])

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
    <div
      ref={cadreRef}
      className={`view view--carte${enTiroir ? ' view--carte-tiroir' : ''}`}
      data-legende={legendeOuverte ? 'ouverte' : 'fermee'}
    >
      <div className="map-column">
        <div className="map-column__map">
          <MapView active={active} masqueBas={masqueBas} />
          {label && (
            <div className="map-selection">
              <span>{label}</span>
              <button type="button" onClick={clearSelection} aria-label="Annuler la sélection">
                ✕
              </button>
            </div>
          )}
        </div>
        <ModeLegend onFermer={enTiroir ? () => setLegendeDemandee(false) : undefined} />
      </div>

      <aside
        className="timeline-column"
        aria-label="Frise chronologique du voyage"
        data-palier={pret ? palier : undefined}
        style={style}
      >
        <div className="timeline-column__head" ref={teteRef}>
          <span className="timeline-column__barre" aria-hidden="true" />
          <h2>Itinéraire</h2>
          {/*
           * Deux phrases pour la même chose, parce que la place n'est pas la
           * même : dans le tiroir, l'essentiel est d'apprendre qu'on peut le
           * faire glisser — c'est ce qu'on ne devine pas.
           */}
          <p>
            {enTiroir
              ? 'Fais glisser pour ouvrir la liste des étapes.'
              : 'Sélectionne une étape ou un trajet : la carte se recentre et le détail s’ouvre ici.'}
          </p>

          {/*
           * La poignée recouvre tout l'en-tête : au doigt, on attrape le tiroir
           * n'importe où en haut. C'est un bouton posé par-dessus plutôt qu'un
           * en-tête rendu cliquable, afin que le <h2> reste un vrai titre pour
           * les lecteurs d'écran.
           */}
          <button
            type="button"
            className="timeline-column__prise"
            aria-label={AIDE_PRISE[palier]}
            aria-expanded={palier !== 'replie'}
            {...priseProps}
          />

          <button
            type="button"
            className={`timeline-column__filtres${modesMasques > 0 ? ' is-actif' : ''}`}
            onClick={() => setLegendeDemandee((ouverte) => !ouverte)}
            aria-expanded={legendeOuverte}
            aria-label={
              modesMasques > 0
                ? `Modes de transport et légende — ${modesMasques} mode${modesMasques > 1 ? 's' : ''} masqué${modesMasques > 1 ? 's' : ''}`
                : 'Modes de transport et légende'
            }
          >
            <span aria-hidden="true">⚙</span> Modes
            {modesMasques > 0 && (
              <span className="timeline-column__filtres-badge" aria-hidden="true">
                {modesMasques}
              </span>
            )}
          </button>
        </div>

        {/*
         * Replié, le tiroir masque sa liste : `inert` évite qu'une tabulation
         * n'aille se perdre sur des boutons invisibles sous la carte.
         */}
        <div className="timeline-column__scroll" inert={pret && palier === 'replie'}>
          <Timeline compact />
        </div>
      </aside>
    </div>
  )
}

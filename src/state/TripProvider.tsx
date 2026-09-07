import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { dateISO, journeeDu } from '../lib/aujourdhui'
import { usePersistentState } from '../lib/usePersistentState'
import { MODE_ORDER } from '../lib/modes'
import { ecrireRoute, lireRoute, type Route } from '../lib/route'
import type { Currency } from '../lib/format'
import type { TransportMode } from '../types'
import { TripContext, type Selection, type ThemeMode, type TripState, type ViewId } from './trip-state'

/**
 * Section ouverte au chargement.
 *
 * Pendant le séjour, c'est « Aujourd'hui » : sur place, la question n'est pas
 * comment le voyage est bâti mais quel train part maintenant. Avant et après, la
 * journée en cours n'a rien à montrer et l'aperçu reprend sa place — c'est la
 * même règle que partout ici, ne rien afficher qu'on n'ait à afficher.
 *
 * Ce défaut ne s'applique qu'en l'absence d'adresse : un lien partagé désigne
 * explicitement une section, et l'écraser au nom du calendrier viderait le
 * partage de son sens.
 */
function vueInitiale(): ViewId {
  return journeeDu(dateISO(new Date())).phase === 'pendant' ? 'aujourdhui' : 'apercu'
}

/**
 * L'état de départ : l'adresse si elle désigne quelque chose, le défaut sinon.
 *
 * Le garde sur `window` n'est pas décoratif — `scripts/qa-rendu.tsx` rend toutes
 * les vues sous Node, hors navigateur, où `location` n'existe pas. Les effets ne
 * s'exécutent pas au rendu serveur, mais cette fonction, si : elle tourne pendant
 * le premier rendu.
 */
function routeInitiale(): Route {
  if (typeof window === 'undefined') return { view: vueInitiale(), selection: null }
  return lireRoute(window.location.hash) ?? { view: vueInitiale(), selection: null }
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(routeInitiale)
  const [visibleModes, setVisibleModes] = useState<TransportMode[]>([...MODE_ORDER])
  const [currency, setCurrency] = usePersistentState<Currency>('devise', 'jpy')
  const [theme, setTheme] = usePersistentState<ThemeMode>('theme', 'auto')

  const { view, selection } = route

  // Reflète le réglage sur <html data-theme> — la même règle que le script en
  // tête d'index.html, qui a déjà posé l'attribut avant ce premier rendu. En
  // mode « auto », on suit les changements de préférence système en direct
  // (bascule jour/nuit de l'OS) ; sinon il n'y a rien à écouter.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const appliquer = () => {
      const sombre = theme === 'dark' || (theme !== 'light' && mq.matches)
      document.documentElement.dataset.theme = sombre ? 'dark' : 'light'
    }
    appliquer()
    if (theme !== 'auto') return
    mq.addEventListener('change', appliquer)
    return () => mq.removeEventListener('change', appliquer)
  }, [theme])

  /*
   * L'état → l'adresse.
   *
   * `pushState` et non `location.hash = …` : l'affectation directe déclencherait
   * `hashchange`, donc l'écouteur ci-dessous, donc un second rendu pour rien.
   * `pushState` est silencieux, et empile quand même une entrée d'historique —
   * c'est elle qui donne son sens au bouton retour : refermer la fiche ouverte
   * plutôt que quitter le site.
   *
   * Le tout premier passage remplace au lieu d'empiler. Sans quoi arriver sur le
   * site créerait deux entrées pour la même page, et un premier retour ne ferait
   * rien de visible.
   */
  const premierPassage = useRef(true)
  // L'état courant, lisible depuis l'écouteur ci-dessous sans le réabonner à
  // chaque navigation : il n'a besoin de la route que pour réparer une adresse.
  // Tenu à jour ici, dans l'effet, et non pendant le rendu : le seul lecteur est
  // un écouteur d'événement, qui ne peut se déclencher qu'après la validation.
  const routeCourante = useRef(route)
  useEffect(() => {
    routeCourante.current = route
    const cible = ecrireRoute(route)
    if (window.location.hash === cible) {
      premierPassage.current = false
      return
    }
    if (premierPassage.current) {
      premierPassage.current = false
      window.history.replaceState(null, '', cible)
    } else {
      window.history.pushState(null, '', cible)
    }
  }, [route])

  /*
   * L'adresse → l'état, quand elle change sans passer par nous : bouton retour,
   * bouton suivant, ou une adresse tapée à la main.
   *
   * Une adresse illisible ne déplace rien : on reste sur la section ouverte plutôt
   * que de renvoyer le lecteur à l'accueil pour une faute de frappe. Mais on ne la
   * laisse pas dans la barre pour autant — sinon l'adresse affichée désignerait une
   * page où l'on n'est pas, et c'est celle-là qu'on copierait pour la partager. On
   * réécrit donc la vraie, par `replaceState` : l'entrée fautive n'a aucune raison
   * de rester dans l'historique, et remplacer ne déclenche pas `hashchange`, donc
   * ne rappelle pas cet écouteur.
   */
  useEffect(() => {
    const relire = () => {
      const lue = lireRoute(window.location.hash)
      if (lue) setRoute(lue)
      else window.history.replaceState(null, '', ecrireRoute(routeCourante.current))
    }
    window.addEventListener('popstate', relire)
    window.addEventListener('hashchange', relire)
    return () => {
      window.removeEventListener('popstate', relire)
      window.removeEventListener('hashchange', relire)
    }
  }, [])

  const setView = useCallback((next: ViewId) => {
    // La sélection survit au changement de vue : c'est ce qui permet de suivre la
    // même étape de la carte à l'itinéraire sans la rechercher.
    setRoute((current) => ({ ...current, view: next }))
  }, [])

  const selectDestination = useCallback((id: string) => {
    // Re-cliquer la même étape la désélectionne : la carte revient au parcours entier.
    setRoute((current) => ({
      ...current,
      selection:
        current.selection?.kind === 'destination' && current.selection.id === id
          ? null
          : { kind: 'destination', id },
    }))
  }, [])

  const selectJourney = useCallback((id: string, legId?: string) => {
    setRoute((current) => ({
      ...current,
      selection:
        current.selection?.kind === 'journey' &&
        current.selection.id === id &&
        current.selection.legId === legId
          ? null
          : { kind: 'journey', id, legId },
    }))
  }, [])

  const clearSelection = useCallback(() => {
    setRoute((current) => ({ ...current, selection: null }))
  }, [])

  const goTo = useCallback((next: ViewId, nextSelection?: Selection) => {
    setRoute((current) => ({
      view: next,
      selection: nextSelection === undefined ? current.selection : nextSelection,
    }))
  }, [])

  const toggleMode = useCallback((mode: TransportMode) => {
    setVisibleModes((current) =>
      current.includes(mode)
        ? current.filter((m) => m !== mode)
        : MODE_ORDER.filter((m) => m === mode || current.includes(m)),
    )
  }, [])

  const resetModes = useCallback(() => setVisibleModes([...MODE_ORDER]), [])

  const value = useMemo<TripState>(
    () => ({
      selection,
      selectDestination,
      selectJourney,
      clearSelection,
      goTo,
      view,
      setView,
      visibleModes,
      toggleMode,
      resetModes,
      currency,
      setCurrency,
      theme,
      setTheme,
    }),
    [
      selection,
      selectDestination,
      selectJourney,
      clearSelection,
      goTo,
      view,
      setView,
      visibleModes,
      toggleMode,
      resetModes,
      currency,
      setCurrency,
      theme,
      setTheme,
    ],
  )

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

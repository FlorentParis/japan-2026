/**
 * Coquille du site : en-tête, navigation, et la vue courante.
 *
 * La vue « Carte » reste montée en permanence dès sa première ouverture : ré-initialiser
 * MapLibre à chaque aller-retour serait lent et ferait clignoter le fond de carte.
 */
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { BandeauReseau } from './components/BandeauReseau'
import { TRIP } from './data/trip'
import { scrollBehavior } from './lib/motion'
import { useTrip, VIEWS, type ThemeMode } from './state/trip-state'
import { ActivitesView } from './views/ActivitesView'
import { ApercuView } from './views/ApercuView'
import { AujourdhuiView } from './views/AujourdhuiView'
import { BudgetView } from './views/BudgetView'
import { HotelsView } from './views/HotelsView'
import { ItineraireView } from './views/ItineraireView'
import { TransportsView } from './views/TransportsView'

/**
 * MapLibre pèse à lui seul l'essentiel du poids du site : on ne le télécharge
 * qu'à la première ouverture de la vue Carte, pas au chargement de la page.
 */
const CarteView = lazy(() =>
  import('./views/CarteView').then((module) => ({ default: module.CarteView })),
)

/**
 * La vue Photos embarque quelques centaines d'entrées de galerie : même
 * découpage que la carte, on ne la charge qu'à l'ouverture.
 */
const PhotosView = lazy(() =>
  import('./views/PhotosView').then((module) => ({ default: module.PhotosView })),
)

/**
 * Bouton de thème, dans la barre : un seul contrôle qui fait défiler les trois
 * réglages. « Auto » d'abord, parce que c'est le défaut et le choix le plus
 * respectueux — le carnet s'aligne sur le système sans rien imposer. L'icône
 * montre l'état courant, l'info-bulle et l'étiquette pour lecteur d'écran disent
 * lequel et vers quoi le clic mène.
 */
const THEME_CYCLE: Record<ThemeMode, { suivant: ThemeMode; icone: string; nom: string }> = {
  auto: { suivant: 'light', icone: '🌗', nom: 'automatique (système)' },
  light: { suivant: 'dark', icone: '☀️', nom: 'clair' },
  dark: { suivant: 'auto', icone: '🌙', nom: 'sombre' },
}

function Header() {
  const { view, setView, currency, setCurrency, theme, setTheme } = useTrip()
  const themeCourant = THEME_CYCLE[theme]

  /*
   * Sur mobile, les neuf sections ne tiennent pas dans la largeur : la barre
   * défile. Sans ce recentrage, ouvrir « Transports » depuis un lien intérieur
   * laissait l'onglet actif hors du champ de vision — on ne savait plus où on
   * était dans le site.
   */
  const navRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    navRef.current
      ?.querySelector('.app-nav__item.is-current')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: scrollBehavior() })
  }, [view])

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__mark" aria-hidden="true">
          ⛩
        </span>
        <span>
          <strong className="app-header__title">{TRIP.title}</strong>
          <span className="app-header__subtitle">{TRIP.subtitle}</span>
        </span>
      </div>

      <nav className="app-nav" aria-label="Sections du site">
        <ul ref={navRef}>
          {VIEWS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`app-nav__item${view === item.id ? ' is-current' : ''}`}
                onClick={() => setView(item.id)}
                aria-current={view === item.id ? 'page' : undefined}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className="app-nav__label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="app-header__controls">
        <button
          type="button"
          className="app-header__toggle"
          onClick={() => setTheme(themeCourant.suivant)}
          title={`Thème : ${themeCourant.nom}. Cliquer pour passer en ${THEME_CYCLE[themeCourant.suivant].nom}.`}
          aria-label={`Thème ${themeCourant.nom}, changer`}
        >
          <span aria-hidden="true">{themeCourant.icone}</span>
        </button>
        <button
          type="button"
          className="app-header__toggle"
          onClick={() => setCurrency(currency === 'jpy' ? 'eur' : 'jpy')}
          title="Changer la devise d’affichage"
        >
          {currency === 'jpy' ? '¥' : '€'}
        </button>
      </div>
    </header>
  )
}

export default function App() {
  const { view } = useTrip()

  // On garde la carte en vie une fois qu'elle a été ouverte : le drapeau est
  // ajusté pendant le rendu, sans effet, pour ne pas provoquer un second rendu.
  const [mapMounted, setMapMounted] = useState(view === 'carte')
  if (view === 'carte' && !mapMounted) setMapMounted(true)

  // Le titre de l'onglet suit la section : utile pour s'y retrouver entre
  // plusieurs onglets ouverts, et pour un lecteur d'écran au changement de vue.
  useEffect(() => {
    const current = VIEWS.find((item) => item.id === view)
    document.title =
      !current || view === 'apercu'
        ? `${TRIP.title} — carnet d’itinéraire`
        : `${current.label} · ${TRIP.title}`
  }, [view])

  return (
    <div className={`app app--${view}`}>
      <Header />

      {/* Sous l'en-tête et hors du <main> : c'est l'état du site, pas le contenu
          de la section ouverte — et il ne doit pas disparaître en changeant de
          vue. Le bandeau ne rend rien quand il n'a rien à dire, c'est-à-dire
          presque toujours. */}
      <BandeauReseau />

      <main className="app-main">
        {view === 'aujourdhui' && <AujourdhuiView />}
        {view === 'apercu' && <ApercuView />}
        {mapMounted && (
          <div hidden={view !== 'carte'} className="app-main__keepalive">
            <Suspense fallback={<p className="app-main__loading">Chargement de la carte…</p>}>
              <CarteView active={view === 'carte'} />
            </Suspense>
          </div>
        )}
        {view === 'itineraire' && <ItineraireView />}
        {view === 'hotels' && <HotelsView />}
        {view === 'activites' && <ActivitesView />}
        {view === 'photos' && (
          <Suspense fallback={<p className="app-main__loading">Chargement des galeries…</p>}>
            <PhotosView />
          </Suspense>
        )}
        {view === 'budget' && <BudgetView />}
        {view === 'transports' && <TransportsView />}
      </main>

      <footer className="app-footer">
        <p>
          Fond de carte <a href="https://openfreemap.org/" target="_blank" rel="noreferrer noopener">OpenFreeMap</a> ·
          données <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer noopener">OpenStreetMap</a> ·
          photos <a href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer noopener">Wikimedia Commons</a>{' '}
          (auteur et licence indiqués sous chaque image).
        </p>
        <p>
          Toutes les données du voyage vivent dans <code>src/data/</code> — un seul endroit à
          modifier par information.
        </p>
      </footer>
    </div>
  )
}

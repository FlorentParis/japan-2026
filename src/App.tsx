/**
 * Coquille du site : en-tête, navigation, et la vue courante.
 *
 * La vue « Carte » reste montée en permanence dès sa première ouverture : ré-initialiser
 * MapLibre à chaque aller-retour serait lent et ferait clignoter le fond de carte.
 */
import { lazy, Suspense, useEffect, useState } from 'react'
import { TRIP } from './data/trip'
import { useTrip, VIEWS } from './state/trip-state'
import { ActivitesView } from './views/ActivitesView'
import { ApercuView } from './views/ApercuView'
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

function Header() {
  const { view, setView, currency, setCurrency } = useTrip()

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
        <ul>
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

      <button
        type="button"
        className="app-header__currency"
        onClick={() => setCurrency(currency === 'jpy' ? 'eur' : 'jpy')}
        title="Changer la devise d’affichage"
      >
        {currency === 'jpy' ? '¥' : '€'}
      </button>
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

      <main className="app-main">
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

/**
 * BANDEAU D'ÉTAT : hors connexion, et mise à jour disponible.
 *
 * Deux messages seulement, et jamais en même temps — hors réseau, il n'y a pas de
 * nouvelle version à aller chercher. Ils occupent la même place, sous l'en-tête,
 * parce que ce sont les deux seules choses que le site ait à dire sur lui-même
 * plutôt que sur le voyage.
 *
 * Le ton du premier est le même que partout ailleurs dans le carnet : dire ce qui
 * marche et ce qui ne marche pas, sans arrondir. « Mode hors ligne » tout court
 * laisserait croire que la carte s'affichera.
 */
import { useEnLigne, useMiseAJour } from '../lib/reseau'

export function BandeauReseau() {
  const enLigne = useEnLigne()
  const { prete, appliquer } = useMiseAJour()

  if (!enLigne) {
    return (
      // `role="status"` et non `alert` : c'est un changement d'état à signaler,
      // pas une urgence qui doive couper la lecture en cours.
      <p className="bandeau bandeau--hors-ligne" role="status">
        <span className="bandeau__icone" aria-hidden="true">
          ⚡
        </span>
        <span>
          <strong>Hors connexion.</strong> Tout le carnet reste lisible — itinéraire, horaires,
          hôtels, valises, budget. Le fond de carte et les photos jamais affichées, eux, viennent
          d’Internet : ils manqueront jusqu’au retour du réseau.
        </span>
      </p>
    )
  }

  if (prete) {
    return (
      <p className="bandeau bandeau--maj" role="status">
        <span className="bandeau__icone" aria-hidden="true">
          ↻
        </span>
        <span>
          <strong>Une version plus récente du carnet est prête.</strong> Des données ont peut-être
          changé depuis l’installation.
        </span>
        <button type="button" className="button button--ghost" onClick={appliquer}>
          Recharger
        </button>
      </p>
    )
  }

  return null
}

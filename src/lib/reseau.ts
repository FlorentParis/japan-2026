/**
 * ÉTAT DU RÉSEAU ET MISES À JOUR DE L'APPLICATION INSTALLÉE.
 *
 * Le carnet est fait pour être installé sur l'écran d'accueil et consulté sans
 * réseau (voir `scripts/sw-modele.js`). Deux choses en découlent, et ce sont les
 * deux seules que ce fichier gère :
 *
 * ▸ **dire quand on est hors connexion**, parce que le mode hors ligne n'est pas
 *   complet : la carte et les photos jamais affichées viennent de domaines
 *   distants et manqueront. Une carte grise sans explication ferait croire à une
 *   panne du site ;
 * ▸ **proposer de recharger quand une nouvelle version est prête**. Une
 *   application installée ne se rafraîchit pas d'un F5 : sans ce bandeau, une
 *   correction d'horaire poussée la veille du départ pourrait rester invisible
 *   pendant tout le voyage.
 */
import { useCallback, useEffect, useState } from 'react'

/**
 * Une vraie requête, pour savoir si le réseau répond.
 *
 * `navigator.onLine` ne répond qu'à une question plus faible : « une interface
 * réseau est-elle active ». Il se trompe dans les deux sens, et les deux cas se
 * produisent pendant un voyage :
 * ▸ derrière le portail captif d'un wifi d'hôtel, il annonce « en ligne » alors
 *   que rien ne passe ;
 * ▸ au démarrage d'une application installée sans réseau, plusieurs navigateurs
 *   l'annoncent « en ligne » jusqu'au premier échec — c'est ce que `qa-hors-ligne`
 *   a relevé, le bandeau ne s'affichait pas après rechargement.
 *
 * On demande donc au réseau plutôt qu'au drapeau. La cible est le favicon, servi
 * depuis notre propre domaine et pesant quelques centaines d'octets.
 *
 * Le nom du paramètre compte : `sonde-reseau` est le signal convenu avec
 * `scripts/sw-modele.js`, qui laisse alors passer la requête sans l'intercepter.
 * Sans cet accord, le service worker répondrait depuis son cache — ou relaierait
 * la requête depuis son propre contexte — et la sonde conclurait « en ligne » au
 * fond d'un tunnel. L'horodatage, lui, écarte le cache HTTP.
 */
async function sonder(): Promise<boolean> {
  try {
    await fetch(`${import.meta.env.BASE_URL}favicon.svg?sonde-reseau=${Date.now()}`, {
      cache: 'no-store',
    })
    return true
  } catch {
    return false
  }
}

/**
 * Sommes-nous en ligne ?
 *
 * La valeur ne sert qu'à *expliquer* une absence de carte et de photos, jamais à
 * décider quoi afficher : le site rend exactement la même chose dans les deux cas.
 * C'est ce qui autorise une réponse approchée — au pire, on retombe sur le
 * comportement d'avant, des images qui ne viennent pas sans un mot.
 */
export function useEnLigne(): boolean {
  const [enLigne, setEnLigne] = useState(() => navigator.onLine !== false)

  useEffect(() => {
    let vivant = true
    /*
     * `navigator.onLine` est cru sur parole quand il dit « non » : ce sens-là est
     * fiable, immédiat, et gratuit. On ne sonde que pour vérifier un « oui », qui
     * est le seul des deux à mentir. L'ordre importe — sonder d'abord aurait
     * remplacé une réponse sûre par une réponse devinée.
     */
    const verifier = async () => {
      if (navigator.onLine === false) {
        if (vivant) setEnLigne(false)
        return
      }
      const resultat = await sonder()
      if (vivant) setEnLigne(resultat)
    }

    /*
     * Une sonde au montage — c'est elle qui rattrape un démarrage sans réseau.
     * Puis à chaque signal susceptible d'avoir changé la situation : les deux
     * événements du navigateur, et le retour à l'écran, parce qu'un téléphone
     * passe le plus clair de son temps dans une poche, réveillé dans un autre
     * train et sur un autre réseau.
     */
    void verifier()
    const surRetour = () => {
      if (document.visibilityState === 'visible') void verifier()
    }
    window.addEventListener('online', verifier)
    window.addEventListener('offline', verifier)
    document.addEventListener('visibilitychange', surRetour)
    return () => {
      vivant = false
      window.removeEventListener('online', verifier)
      window.removeEventListener('offline', verifier)
      document.removeEventListener('visibilitychange', surRetour)
    }
  }, [])

  return enLigne
}

/**
 * Enregistre le service worker et signale qu'une version plus récente attend.
 *
 * Le service worker n'est **pas** enregistré en développement : il servirait un
 * cache par-dessus le rechargement à chaud de Vite, et chaque modification
 * paraîtrait sans effet.
 */
export function useMiseAJour(): { prete: boolean; appliquer: () => void } {
  const [enAttente, setEnAttente] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

    let vivant = true
    /*
     * Une nouvelle version « prête » se reconnaît à deux conditions réunies : un
     * worker installé qui attend, **et** un worker déjà aux commandes. Sans la
     * seconde, on prendrait la toute première installation — sur un site qui
     * n'était pas encore en cache — pour une mise à jour, et on proposerait de
     * recharger une page qui vient de s'ouvrir.
     */
    const examiner = (registration: ServiceWorkerRegistration) => {
      if (!vivant || !navigator.serviceWorker.controller) return
      if (registration.waiting) setEnAttente(registration.waiting)
    }

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .then((registration) => {
        if (!vivant) return
        examiner(registration)
        registration.addEventListener('updatefound', () => {
          const arrivant = registration.installing
          arrivant?.addEventListener('statechange', () => {
            if (arrivant.state === 'installed') examiner(registration)
          })
        })
      })
      .catch(() => {
        /*
         * Enregistrement refusé : navigation privée, réglage du navigateur, ou
         * site servi sans HTTPS. Il n'y a rien à faire et rien à dire — le site
         * fonctionne exactement comme avant, simplement sans mode hors ligne.
         */
      })

    return () => {
      vivant = false
    }
  }, [])

  const appliquer = useCallback(() => {
    if (!enAttente) return
    /*
     * L'écouteur est posé ici, et pas au montage : `controllerchange` se déclenche
     * aussi à la toute première prise de contrôle du service worker, et un
     * rechargement à ce moment-là ferait clignoter la page dès la première visite.
     * Posé sur le clic, il ne peut répondre qu'à la mise à jour demandée.
     */
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
      once: true,
    })
    enAttente.postMessage('activer-maintenant')
  }, [enAttente])

  return { prete: enAttente !== null, appliquer }
}

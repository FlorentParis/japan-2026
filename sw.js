/**
 * SERVICE WORKER — le carnet consultable sans réseau.
 *
 * ⚠️ Ce fichier est un **modèle**. Il n'est pas servi tel quel : `sw-plugin.ts`
 * remplace les deux marqueurs ci-dessous (la version et la liste à précharger) au
 * moment du build, quand les noms de fichiers empreintés sont enfin connus, et
 * écrit le résultat dans `dist/sw.js`. Le modifier ici, jamais dans `dist/`.
 *
 * Les marqueurs ne sont volontairement pas nommés dans cette en-tête : ils doivent
 * n'apparaître qu'une seule fois chacun dans le fichier, et `sw-plugin.ts` refuse
 * de construire si ce n'est pas le cas — une substitution qui tombe dans un
 * commentaire livrerait un service worker inerte, sans le moindre message.
 *
 * ------------------------------------------------------------------------------
 * POURQUOI. Le carnet sera lu depuis un téléphone, dans un train entre Toyama et
 * Nagano, avec une carte SIM étrangère et des tunnels. Or tout ce qu'il raconte —
 * l'itinéraire, les horaires, les adresses d'hôtel, les envois de valise — est
 * déjà dans le paquet JavaScript : il n'y a aucune API derrière. Sans service
 * worker, une coupure réseau rend pourtant l'ensemble inaccessible, pour la seule
 * raison qu'`index.html` n'a pas pu être rechargé. C'est ce gâchis-là que ce
 * fichier supprime.
 *
 * DEUX RÉSERVES, dites honnêtement dans l'interface (voir `lib/reseau.ts` et le
 * bandeau de `App.tsx`) plutôt que passées sous silence :
 * ▸ les tuiles de la carte viennent d'OpenFreeMap ;
 * ▸ les photos viennent de Wikimedia Commons et des sites des établissements.
 * Ni l'une ni l'autre n'est embarquée — ce serait des centaines de mégaoctets, et
 * pour les photos, une redistribution que le carnet ne fait pas. Elles sont donc
 * gardées **au fur et à mesure** : ce qu'on a regardé une fois reste visible hors
 * connexion, le reste ne l'est pas. C'est aussi ce qui économise le forfait en
 * itinérance, une tuile déjà vue n'étant jamais retéléchargée.
 */

/** Empreinte du lot de fichiers de ce build. Change → l'ancien cache est purgé. */
const VERSION = '5038ab42ac58'

/** Le site complet, tel que le build vient de l'émettre. */
const COQUILLE = [
  "./apple-touch-icon.png",
  "./assets/CarteView-B2k4QVOw.css",
  "./assets/CarteView-CejKsApX.js",
  "./assets/PhotosView-BbXwSwu2.js",
  "./assets/galleries.generated-DsWbZiIW.js",
  "./assets/index-1sjO76Hx.js",
  "./assets/index-Jjo-5Gm2.css",
  "./assets/rolldown-runtime-hePW80VL.js",
  "./favicon.svg",
  "./icone-192.png",
  "./icone-512.png",
  "./icone-maskable-512.png",
  "./index.html",
  "./manifest.webmanifest"
]

/** La page à servir pour toute navigation : le site n'a qu'un seul document. */
const DOCUMENT = './index.html'

const CACHE_COQUILLE = `carnet-coquille-${VERSION}`

/**
 * Cache des ressources distantes (tuiles, photos). Volontairement **non** versionné :
 * une nouvelle version du site ne périme pas une tuile déjà téléchargée, et la
 * purger obligerait à la reprendre au prix du forfait.
 */
const CACHE_DISTANT = 'carnet-distant'

/**
 * Plafond du cache distant, en nombre d'entrées.
 *
 * Une tuile pèse quelques dizaines de kilooctets, une photo de Commons quelques
 * centaines : 500 entrées tiennent dans une trentaine de mégaoctets, loin du quota
 * d'un navigateur mobile. Au-delà, les plus anciennes partent — les caches du
 * navigateur conservant l'ordre d'insertion, « la plus ancienne » est simplement la
 * première clé.
 */
const PLAFOND_DISTANT = 500

/**
 * Ce qu'on accepte de garder d'un autre domaine : les images, quelle qu'en soit la
 * provenance, et tout ce que demande le fond de carte (tuiles, fontes, style).
 *
 * Une liste de domaines d'hébergeurs se serait périmée à la première réservation
 * ajoutée ; « les images » se maintient tout seul.
 */
function distantAGarder(requete) {
  const hote = new URL(requete.url).hostname
  return requete.destination === 'image' || hote === 'tiles.openfreemap.org'
}

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches.open(CACHE_COQUILLE).then((cache) => cache.addAll(COQUILLE)),
  )
  // Pas de `skipWaiting()` ici : une mise à jour qui prend la main pendant qu'on
  // lit une page échangerait le code sous les pieds de l'onglet. La nouvelle
  // version attend, le site propose de recharger, et c'est le message
  // « activer-maintenant » ci-dessous qui débloque.
})

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    (async () => {
      // Les coquilles des builds précédents n'ont plus d'utilité : leurs fichiers
      // portent d'autres empreintes et ne seront plus jamais demandés.
      const noms = await caches.keys()
      await Promise.all(
        noms
          .filter((nom) => nom.startsWith('carnet-coquille-') && nom !== CACHE_COQUILLE)
          .map((nom) => caches.delete(nom)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (evenement) => {
  if (evenement.data === 'activer-maintenant') self.skipWaiting()
})

/** Range une réponse dans le cache distant, en tenant le plafond. */
async function garderDistant(requete, reponse) {
  const cache = await caches.open(CACHE_DISTANT)
  await cache.put(requete, reponse)
  const clefs = await cache.keys()
  if (clefs.length > PLAFOND_DISTANT) {
    await Promise.all(clefs.slice(0, clefs.length - PLAFOND_DISTANT).map((clef) => cache.delete(clef)))
  }
}

/**
 * Cache d'abord, réseau ensuite.
 *
 * C'est la bonne stratégie pour tout ce que sert ce site : les fichiers de la
 * coquille portent une empreinte dans leur nom — un contenu modifié est un
 * fichier différent, jamais une version périmée du même — et les tuiles comme les
 * photos ne changent pas d'un jour à l'autre. Rien à revalider, donc, et un
 * affichage instantané.
 */
async function cacheDAbord(requete, { distant }) {
  const trouve = await caches.match(requete, { ignoreSearch: false })
  if (trouve) return trouve

  const reponse = await fetch(requete)
  /*
   * Une réponse « opaque » (image d'un domaine sans CORS) ne laisse pas lire son
   * statut : on la garde quand même, parce que c'est le cas de la plupart des
   * photos, et qu'une image en erreur est de toute façon cassée avec ou sans
   * cache. Les réponses lisibles, elles, ne sont gardées que si elles ont réussi —
   * mettre une 404 en cache la rendrait définitive.
   */
  if (distant && (reponse.type === 'opaque' || reponse.ok)) {
    await garderDistant(requete, reponse.clone())
  }
  return reponse
}

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request

  // Ni les POST, ni les requêtes d'extensions : rien à mettre en cache, et une
  // écriture ne se rejoue pas.
  if (requete.method !== 'GET') return
  if (!requete.url.startsWith('http')) return

  /*
   * La sonde réseau de `lib/reseau.ts` doit atteindre le réseau, ou échouer. Elle
   * est donc la seule requête que ce fichier laisse délibérément passer sans y
   * toucher : la servir depuis le cache — ou même seulement la relayer — lui
   * ferait répondre « en ligne » alors qu'il n'y a pas de réseau, et le bandeau
   * hors connexion ne s'afficherait jamais.
   */
  if (new URL(requete.url).searchParams.has('sonde-reseau')) return

  /*
   * Toute navigation renvoie le document du site. Il n'y a qu'une page, et c'est
   * ce qui permet à l'application installée de démarrer sans réseau : sans cette
   * branche, ouvrir l'icône hors connexion afficherait l'écran d'erreur du
   * navigateur, avec pourtant tout le site en cache juste derrière.
   */
  if (requete.mode === 'navigate') {
    evenement.respondWith(
      caches
        .match(DOCUMENT, { cacheName: CACHE_COQUILLE })
        .then((trouve) => trouve ?? fetch(requete)),
    )
    return
  }

  const memeOrigine = new URL(requete.url).origin === self.location.origin
  if (memeOrigine) {
    evenement.respondWith(cacheDAbord(requete, { distant: false }))
    return
  }

  if (distantAGarder(requete)) {
    evenement.respondWith(cacheDAbord(requete, { distant: true }))
  }
  // Tout le reste part au réseau sans que ce fichier s'en mêle : ne pas appeler
  // `respondWith` laisse le navigateur faire exactement ce qu'il aurait fait.
})

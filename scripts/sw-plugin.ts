/**
 * PLUGIN VITE : fabrique `dist/sw.js` à partir de `scripts/sw-modele.js`.
 *
 * Un service worker de précache a besoin de la liste exacte des fichiers du site,
 * empreintes comprises (`index-Bq3k9.js`). Cette liste n'existe qu'à la fin du
 * build : l'écrire à la main dans le modèle serait la garantie de la voir se
 * désynchroniser au premier changement de code — et un précache qui référence un
 * fichier disparu échoue *en entier*, laissant le site sans mode hors connexion,
 * silencieusement.
 *
 * D'où ce plugin, qui relève la liste au moment où elle est juste. Il évite aussi
 * d'ajouter `vite-plugin-pwa` et Workbox aux dépendances : le carnet n'a besoin
 * d'aucune des stratégies qu'ils apportent — un seul document, des fichiers
 * empreintés, deux domaines distants — et `sw-modele.js` tient en cent lignes
 * lisibles.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, posix, relative, sep } from 'node:path'
import type { Plugin } from 'vite'

const MODELE = join(import.meta.dirname, 'sw-modele.js')

/** Tous les fichiers d'un dossier, en chemins relatifs à `racine`, style URL. */
function fichiers(dossier: string, racine: string): string[] {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name)
    if (entree.isDirectory()) return fichiers(chemin, racine)
    return [relative(racine, chemin).split(sep).join(posix.sep)]
  })
}

/**
 * Substitue un marqueur du modèle, en exigeant qu'il y soit exactement une fois.
 *
 * Ce contrôle n'est pas du zèle : la première version de ce plugin nommait les
 * marqueurs dans le commentaire d'en-tête du modèle, et `String.replace` a
 * remplacé cette mention-là. Le build a réussi, le site s'est déployé, et le
 * service worker livré tentait de mettre en cache une liste nommée `__PRECACHE__`
 * — hors ligne, il n'y avait rien. Aucun message nulle part.
 */
function substituer(source: string, marqueur: string, valeur: string): string {
  const occurrences = source.split(marqueur).length - 1
  if (occurrences !== 1) {
    throw new Error(
      `sw-modele.js : le marqueur ${marqueur} apparaît ${occurrences} fois, il en faut exactement une.`,
    )
  }
  return source.replace(marqueur, valeur)
}

export function serviceWorker(): Plugin {
  return {
    name: 'carnet-service-worker',
    // Aucun intérêt en développement : le serveur de Vite recharge les modules à
    // chaud, et un service worker qui sert un cache par-dessus rendrait chaque
    // modification invisible — le grand classique du « pourquoi ma page ne
    // change pas ».
    apply: 'build',

    writeBundle(options) {
      const dist = options.dir
      if (!dist) return

      /*
       * On relit le dossier de sortie plutôt que le `bundle` de Rollup : le
       * contenu de `public/` (manifeste, icônes, favicon) est recopié par Vite
       * sans passer par Rollup, il n'apparaît donc pas dans le bundle. Or ce sont
       * précisément les fichiers dont l'application installée a besoin au
       * démarrage.
       */
      const aPrecacher = fichiers(dist, dist)
        // Le service worker ne se met pas lui-même en cache : le navigateur le
        // gère à part, et une version en cache l'empêcherait d'être remplacée.
        .filter((nom) => nom !== 'sw.js')
        // Les cartes de source ne servent qu'au débogage sur un poste de
        // développement : les précharger coûterait des mégaoctets au premier
        // lancement, sur un forfait, pour rien.
        .filter((nom) => !nom.endsWith('.map'))
        .sort()

      /*
       * La version est l'empreinte du contenu de tout le lot. Elle sert d'unique
       * déclencheur de mise à jour : un octet changé quelque part donne un nom de
       * cache différent, donc une nouvelle installation puis la purge de l'ancien.
       * Un simple numéro à incrémenter à la main aurait fini oublié.
       */
      const empreinte = createHash('sha256')
      for (const nom of aPrecacher) {
        empreinte.update(nom)
        empreinte.update(readFileSync(join(dist, nom)))
      }

      let source = readFileSync(MODELE, 'utf8')
      source = substituer(source, '__VERSION__', empreinte.digest('hex').slice(0, 12))
      source = substituer(
        source,
        '__PRECACHE__',
        JSON.stringify(
          aPrecacher.map((nom) => `./${nom}`),
          null,
          2,
        ),
      )

      writeFileSync(join(dist, 'sw.js'), source)

      const poids = aPrecacher.reduce((total, nom) => total + statSync(join(dist, nom)).size, 0)
      this.info(
        `sw.js — ${aPrecacher.length} fichiers préchargés, ${(poids / 1024 / 1024).toFixed(1)} Mo`,
      )
    },
  }
}

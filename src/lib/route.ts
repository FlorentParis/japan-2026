/**
 * L'ADRESSE DE LA PAGE ↔ L'ÉTAT DU SITE.
 *
 * Le carnet est une application d'une seule page : sans ce fichier, la section
 * ouverte et l'étape sélectionnée ne vivaient qu'en mémoire. Trois conséquences,
 * toutes vécues :
 * ▸ recharger la page ramenait à l'aperçu, quoi qu'on fût en train de lire ;
 * ▸ envoyer « regarde l'étape de Kanazawa » était impossible — le lien partagé
 *   ouvrait l'accueil, et il fallait décrire le chemin à suivre ;
 * ▸ sur Android, le bouton retour **quittait le site** au lieu de refermer la
 *   fiche ouverte, ce qui est le geste que tout le monde fait d'abord.
 *
 * Le choix du **fragment** (`#/carte/etape/kanazawa`) et non d'un vrai chemin
 * n'est pas une facilité : le site est publié sur GitHub Pages, qui sert des
 * fichiers statiques et ne sait pas réécrire `/hotels` vers `index.html`. Un
 * chemin donnerait un 404 à quiconque ouvrirait le lien partagé — c'est-à-dire
 * précisément le cas qu'on cherche à faire marcher. Le fragment, lui, n'est
 * jamais envoyé au serveur.
 *
 * Ce qui n'est **pas** dans l'adresse, et volontairement : la devise, le thème et
 * les filtres de la carte. Ce sont des réglages du lecteur, conservés par
 * `usePersistentState` ; les mettre dans le lien imposerait le thème sombre de
 * l'expéditeur au destinataire. L'adresse porte ce qu'on regarde, pas comment on
 * le regarde.
 */
import { DESTINATIONS } from '../data/destinations'
import { JOURNEYS } from '../data/journeys'
import { VIEWS, type Selection, type ViewId } from '../state/trip-state'

export type Route = { view: ViewId; selection: Selection }

const VUES = new Set<string>(VIEWS.map((item) => item.id))

/** Segment d'URL par nature de sélection. En français, comme le reste du site. */
const SEGMENT = { destination: 'etape', journey: 'trajet' } as const

/**
 * Lit une adresse et rend l'état correspondant, ou `undefined` si elle ne désigne
 * aucune section connue — au premier chargement, l'adresse est vide, et c'est le
 * cas le plus courant.
 *
 * Une sélection introuvable est **écartée sans écarter la vue** : un lien vers une
 * étape renommée depuis ouvre quand même la bonne section, au lieu de laisser une
 * sélection fantôme que la carte chercherait à centrer. C'est la même règle que
 * partout ici — ne rien afficher qu'on ne sache afficher.
 */
export function lireRoute(hash: string): Route | undefined {
  const segments = hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        // Un `%` isolé dans l'adresse fait lever `decodeURIComponent` : le segment
        // brut ne correspondra à aucun identifiant, et la sélection sera écartée.
        return segment
      }
    })

  const [vue, nature, id, legId] = segments
  if (!vue || !VUES.has(vue)) return undefined
  const view = vue as ViewId

  if (nature === SEGMENT.destination && id && DESTINATIONS.some((dest) => dest.id === id)) {
    return { view, selection: { kind: 'destination', id } }
  }

  if (nature === SEGMENT.journey && id) {
    const journey = JOURNEYS.find((item) => item.id === id)
    if (journey) {
      // Un tronçon qui n'appartient pas à ce trajet est ignoré, le trajet reste :
      // mieux vaut le tracé complet qu'une sélection de tronçon impossible.
      const leg = journey.legs.some((item) => item.id === legId) ? legId : undefined
      return { view, selection: { kind: 'journey', id, legId: leg } }
    }
  }

  return { view, selection: null }
}

/** L'adresse d'un état. Toujours préfixée de `#`, pour se comparer à `location.hash`. */
export function ecrireRoute({ view, selection }: Route): string {
  const segments: string[] = [view]

  if (selection?.kind === 'destination') {
    segments.push(SEGMENT.destination, selection.id)
  } else if (selection?.kind === 'journey') {
    segments.push(SEGMENT.journey, selection.id)
    if (selection.legId) segments.push(selection.legId)
  }

  return `#/${segments.map(encodeURIComponent).join('/')}`
}

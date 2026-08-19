/**
 * Tailles de vignettes Wikimedia.
 *
 * Les URLs de vignettes portent la largeur demandée dans le chemin :
 * `.../Fichier.jpg/1920px-Fichier.jpg`. On peut donc obtenir d'autres tailles
 * sans nouvelle requête à l'API, et laisser le navigateur choisir la bonne — sans
 * ça, une galerie de vingt images afficherait vingt fichiers de 1 920 px dans des
 * cases de 300 px, soit plusieurs mégaoctets pour rien.
 *
 * Mais on ne demande **pas** n'importe quelle largeur : Wikimedia ne rend plus
 * que des tailles standard, et toute autre valeur répond 404. C'est ce qui
 * rendait des photos invisibles ici — le `srcSet` proposait 400, 800 et 1600 px,
 * trois largeurs hors liste, et un navigateur qui trouve un `srcSet` ignore
 * l'attribut `src`. D'où cette constante : la seule liste dans laquelle puiser.
 */
import type { Photo } from '../types'

/** Les largeurs que Wikimedia rend en production. Toute autre valeur donne 404. */
export const LARGEURS_WIKIMEDIA = [20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840] as const

/**
 * Celles qu'on propose au navigateur : de la vignette de 3,5 rem devant une
 * spécialité jusqu'à la visionneuse plein écran. Les tailles en dessous de
 * 120 px ne servent à rien ici, celles au-dessus de 1 920 px n'existent pas dans
 * les données (l'API est interrogée à 1 600, qui remonte au palier de 1 920).
 */
const LARGEURS_UTILISEES = LARGEURS_WIKIMEDIA.filter((l) => l >= 120 && l <= 1920)

const MOTIF_VIGNETTE = /\/(\d+)px-([^/]*)$/

/**
 * `srcSet` d'une photo, ou `undefined` quand son URL n'est pas une vignette —
 * c'est le cas des fichiers plus petits que la largeur demandée, que Commons
 * sert alors tels quels. Rien à décliner dans ce cas.
 */
export function jeuDeSources(photo: Photo): string | undefined {
  if (!MOTIF_VIGNETTE.test(photo.url)) return undefined
  const utiles = LARGEURS_UTILISEES.filter((largeur) => largeur <= photo.width)
  if (utiles.length < 2) return undefined
  return utiles.map((l) => `${photo.url.replace(MOTIF_VIGNETTE, `/${l}px-$2`)} ${l}w`).join(', ')
}

/**
 * Le nom du fichier en clair, pour légender une photo dans une visionneuse.
 *
 * C'est délibérément la seule légende possible : le générateur ne connaît de
 * chaque image que son nom sur Commons, et broder une description de ce qu'on
 * croit y voir serait inventer une donnée.
 */
export function titreDeFichier(file: string): string {
  return file.replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ')
}

/**
 * PHOTOS DES HÉBERGEMENTS RÉSERVÉS.
 *
 * ⚠️ C'est la seule exception photographique du site, et elle est délibérée.
 * Partout ailleurs les images viennent de Wikimedia Commons sous licence libre,
 * choisies par `scripts/fetch-photos.ts`. Ici, non : ce sont les photos que
 * l'établissement publie lui-même de ses murs et de ses chambres. Aucun fonds
 * libre ne montre l'intérieur d'un hôtel de quartier, et une image « d'ambiance »
 * prise ailleurs serait exactement la donnée inventée que ce projet refuse.
 *
 * Conséquences assumées :
 * ▸ ces images ne sont **pas** libres de droits. Elles sont **liées** à leur
 *   serveur d'origine, jamais recopiées : aucun fichier sous droits n'entre dans
 *   le dépôt ni dans `dist/`. Le carnet est privé et n'est pas publié.
 * ▸ `author` porte le nom de l'établissement et `license` la nature du droit
 *   d'usage à défaut de licence. `Figure` affiche ce crédit sous chaque image, en
 *   lien vers la page source — même règle que pour Commons.
 * ▸ `npm run photos` ne touche pas à ce fichier : il est écrit à la main, ce qui
 *   est tenable pour un hébergement réservé de temps en temps.
 * ▸ `jeuDeSources()` ne rend rien pour ces URL (elles ne suivent pas le motif de
 *   vignette de Commons) : les images sont servies telles quelles, sans `srcSet`.
 *   D'où le carrousel plutôt qu'une grille — `loading="lazy"` ne charge que la
 *   vue affichée.
 *
 * Comment relever à nouveau ces valeurs : ouvrir la page officielle de
 * l'établissement (`sourcePage`), qui porte un bloc JSON listant ses photos avec
 * leur catégorie et leurs dimensions réelles, sur le serveur
 * `…/property_photos/<code de l'établissement>/`. Les largeurs et hauteurs
 * ci-dessous en sont recopiées, pas mesurées à l'œil — y compris le 1921 px de
 * `df4e6059.jpg`, tel que la source le donne.
 */
import type { Photo } from '../types'

/**
 * Ce que la source dit du sujet d'une photo, et rien de plus.
 *
 * Les catégories viennent du JSON de l'établissement (`room`, `facility`) : c'est
 * la seule légende défendable, comme le nom de fichier l'est pour Commons.
 * Décrire ce qu'on croit voir sur l'image serait broder.
 */
export type SujetHebergement = 'chambre' | 'établissement'

export type PhotoHebergement = Photo & { sujet: SujetHebergement }

const TABIST_ASAKUSA = 'https://tabist.co.jp/en/h/B13HUSA'
const TABIST_ASAKUSA_PHOTOS =
  'https://tabist-public-prod.s3.ap-northeast-1.amazonaws.com/property_photos/B13HUSA/'

/** Fabrique une entrée à partir du nom de fichier chez l'établissement. */
const tabistAsakusa = (
  file: string,
  sujet: SujetHebergement,
  width = 1920,
  height = 1440,
): PhotoHebergement => ({
  url: `${TABIST_ASAKUSA_PHOTOS}${file}`,
  width,
  height,
  file,
  author: 'Tabist Urban Stays Asakusa',
  license: 'photo de l’établissement',
  sourcePage: TABIST_ASAKUSA,
  sujet,
})

/**
 * Les photos d'un hébergement, par `Accommodation.photosId`.
 *
 * Sélection : les catégories `facility` et `room` de la source dont le JSON donne
 * les dimensions. Écartées volontairement — les images dont le sujet est le
 * quartier et non l'hôtel (Asakusa et le Skytree sont déjà couverts par la
 * galerie Commons de l'étape) et les panneaux d'horaires, illisibles à cette
 * taille. Les treize retenues ont été regardées une à une : chacune montre bien
 * le bâtiment, ses parties communes ou une chambre.
 */
export const PHOTOS_HEBERGEMENT: Record<string, PhotoHebergement[]> = {
  // La première est celle que l'établissement désigne comme photo principale
  // (`selection: "MAIN"`) : elle ouvre donc le carrousel.
  'tabist-urban-stays-asakusa': [
    tabistAsakusa('62d96be7.jpg', 'établissement'),
    tabistAsakusa('aa75da2f.jpg', 'chambre'),
    tabistAsakusa('0e408cd8.jpg', 'chambre'),
    tabistAsakusa('d7260fe4.jpg', 'chambre'),
    tabistAsakusa('1d54fc0d.jpg', 'chambre'),
    tabistAsakusa('a658663d.jpg', 'chambre'),
    tabistAsakusa('5a6ef73b.jpg', 'établissement'),
    tabistAsakusa('df4e6059.jpg', 'établissement', 1921),
    tabistAsakusa('0b5b3a2e.jpg', 'établissement'),
    tabistAsakusa('bd18b402.jpg', 'établissement'),
    tabistAsakusa('ab992c88.jpg', 'établissement'),
    tabistAsakusa('f50c3ba6.jpg', 'établissement'),
    tabistAsakusa('f2d040ef.jpg', 'établissement'),
  ],
}

/** Les photos d'un hébergement, ou un tableau vide : jamais celles d'un autre. */
export function photosHebergement(photosId?: string): PhotoHebergement[] {
  return (photosId ? PHOTOS_HEBERGEMENT[photosId] : undefined) ?? []
}

/**
 * LES PHOTOS D'UNE ÉTAPE — dans l'itinéraire et dans la fiche ouverte sur la carte.
 *
 * Une seule photo par ville disait peu de choses du lieu : ici défile toute la
 * galerie de l'étape, et un clic ouvre l'image en grand dans la visionneuse.
 *
 * Ce fichier ne fait que choisir les photos et les légender ; le défilement, les
 * flèches et le compteur sont dans `Carrousel`, qui sert aussi aux photos des
 * hébergements réservés.
 *
 * Tant que le morceau des galeries n'est pas arrivé — et lors du rendu hors
 * navigateur de `npm run qa`, où il n'arrive jamais — c'est la photo de tête,
 * présente dans le lot initial, qui s'affiche seule. Jamais de trou, jamais de
 * fenêtre vide.
 */
import { PHOTOS } from '../data/photos.generated'
import { useGalerie } from '../lib/useGalerie'
import { titreDeFichier } from '../lib/vignettes'
import { Carrousel } from './Carrousel'

/**
 * « Kanazawa — Kenrokuen Kotojitoro ». Le nom du fichier Commons est tout ce
 * qu'on sait de l'image : décrire ce qu'on croit y voir serait inventer.
 */
function legende(name: string, file: string): string {
  return `${name} — ${titreDeFichier(file)}`
}

export function PhotoCarrousel({
  destId,
  name,
  photoId,
  ratio,
  className,
  sizes,
}: {
  destId: string
  name: string
  /** Photo de tête, affichée d'emblée : elle ouvre le carrousel. */
  photoId?: string
  ratio?: string
  className?: string
  sizes?: string
}) {
  const galerie = useGalerie(destId)

  // La galerie de l'étape commence par sa photo de tête (le générateur l'y met) :
  // il n'y a donc rien à concaténer, et aucun doublon à craindre.
  const tete = photoId ? PHOTOS[photoId] : undefined
  const complement = tete ? [tete] : []
  const photos = galerie && galerie.length > 0 ? galerie : complement

  const lot = photos.map((photo) => ({ photo, legende: legende(name, photo.file) }))

  return <Carrousel lot={lot} label={name} ratio={ratio} className={className} sizes={sizes} />
}

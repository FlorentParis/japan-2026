/**
 * CARROUSEL DES PHOTOS D'UNE ÉTAPE — dans l'itinéraire et dans la fiche ouverte
 * sur la carte.
 *
 * Une seule photo par ville disait peu de choses du lieu : ici défile toute la
 * galerie de l'étape, et un clic ouvre l'image en grand dans la visionneuse.
 *
 * Le défilement est celui du navigateur (`scroll-snap`), pas une pile de
 * `transform` pilotée en JavaScript : le glissement au doigt, l'inertie et la
 * molette horizontale marchent alors sans qu'on ait à les réécrire, et le
 * carrousel reste utilisable si le morceau des galeries n'arrive jamais.
 *
 * Justement : tant qu'il n'est pas arrivé — et lors du rendu hors navigateur de
 * `npm run qa` — c'est la photo de tête, présente dans le lot initial, qui
 * s'affiche seule. Jamais de trou, jamais de fenêtre vide.
 */
import { useRef, useState } from 'react'
import { PHOTOS } from '../data/photos.generated'
import { scrollBehavior } from '../lib/motion'
import { useGalerie } from '../lib/useGalerie'
import { titreDeFichier } from '../lib/vignettes'
import { Figure } from './ui'

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
  ratio = '16 / 9',
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
  const piste = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  // La galerie de l'étape commence par sa photo de tête (le générateur l'y met) :
  // il n'y a donc rien à concaténer, et aucun doublon à craindre.
  const tete = photoId ? PHOTOS[photoId] : undefined
  const complement = tete ? [tete] : []
  const photos = galerie && galerie.length > 0 ? galerie : complement
  if (photos.length === 0) return null

  const lot = photos.map((photo) => ({
    photo,
    legende: legende(name, photo.file),
  }))

  const surDefilement = () => {
    const element = piste.current
    if (element && element.clientWidth > 0) {
      setIndex(Math.round(element.scrollLeft / element.clientWidth))
    }
  }

  const aller = (pas: number) => {
    const element = piste.current
    if (!element) return
    const cible = Math.min(Math.max(index + pas, 0), photos.length - 1)
    element.scrollTo({ left: cible * element.clientWidth, behavior: scrollBehavior() })
  }

  // La galerie arrive après le premier rendu : d'ici là la piste ne contenait
  // qu'une image, et un rang mémorisé plus grand n'aurait plus de sens.
  const rang = Math.min(index, photos.length - 1)
  const plusieurs = photos.length > 1

  return (
    <div className={`carrousel${className ? ` ${className}` : ''}`}>
      <section
        className="carrousel__piste"
        ref={piste}
        onScroll={surDefilement}
        // Zone défilable au clavier : sans `tabIndex`, les flèches du clavier ne
        // l'atteignent pas, et le carrousel ne serait manœuvrable qu'à la souris.
        tabIndex={0}
        aria-label={`${photos.length} photos de ${name}`}
      >
        <ul className="carrousel__liste">
          {photos.map((photo) => (
            <li key={photo.file} className="carrousel__vue">
              <Figure
                photo={photo}
                alt={legende(name, photo.file)}
                ratio={ratio}
                groupe={lot}
                sizes={sizes}
                className="photo--carrousel"
              />
            </li>
          ))}
        </ul>
      </section>

      {plusieurs && (
        <>
          <button
            type="button"
            className="carrousel__fleche carrousel__fleche--avant"
            onClick={() => aller(-1)}
            disabled={rang === 0}
            aria-label="Photo précédente"
          >
            ‹
          </button>
          <button
            type="button"
            className="carrousel__fleche carrousel__fleche--apres"
            onClick={() => aller(1)}
            disabled={rang >= photos.length - 1}
            aria-label="Photo suivante"
          >
            ›
          </button>
          <p className="carrousel__compteur">
            {rang + 1} / {photos.length}
          </p>
        </>
      )}
    </div>
  )
}

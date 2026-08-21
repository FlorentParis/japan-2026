/**
 * CARROUSEL — un lot de photos qui défile, et s'ouvre en visionneuse.
 *
 * Il ne sait rien de la provenance des images : il reçoit des `ImageZoomable`
 * déjà légendées et les montre. C'est à l'appelant de dire quelles photos et sous
 * quel titre — la galerie Commons d'une étape pour `PhotoCarrousel`, les photos
 * que publie un hôtel pour `Hebergement`.
 *
 * Le défilement est celui du navigateur (`scroll-snap`), pas une pile de
 * `transform` pilotée en JavaScript : le glissement au doigt, l'inertie et la
 * molette horizontale marchent alors sans qu'on ait à les réécrire.
 *
 * Comme les vues voisines sont hors cadre à droite, le `loading="lazy"` de
 * `Figure` ne charge que celle qu'on regarde : un lot de treize photos pleine
 * taille ne coûte donc qu'une image à l'affichage.
 */
import { useRef, useState } from 'react'
import { scrollBehavior } from '../lib/motion'
import type { ImageZoomable } from '../state/visionneuse-state'
import { Figure } from './ui'

export function Carrousel({
  lot,
  label,
  ratio = '16 / 9',
  className,
  sizes,
}: {
  lot: ImageZoomable[]
  /** Ce que la piste annonce aux lecteurs d'écran : « 13 photos de … ». */
  label: string
  ratio?: string
  className?: string
  sizes?: string
}) {
  const piste = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  if (lot.length === 0) return null

  const surDefilement = () => {
    const element = piste.current
    if (element && element.clientWidth > 0) {
      setIndex(Math.round(element.scrollLeft / element.clientWidth))
    }
  }

  const aller = (pas: number) => {
    const element = piste.current
    if (!element) return
    const cible = Math.min(Math.max(index + pas, 0), lot.length - 1)
    element.scrollTo({ left: cible * element.clientWidth, behavior: scrollBehavior() })
  }

  // Un lot peut s'allonger après le premier rendu — la galerie d'étape arrive en
  // différé : un rang mémorisé plus grand que la piste n'aurait plus de sens.
  const rang = Math.min(index, lot.length - 1)
  const plusieurs = lot.length > 1

  return (
    <div className={`carrousel${className ? ` ${className}` : ''}`}>
      <section
        className="carrousel__piste"
        ref={piste}
        onScroll={surDefilement}
        // Zone défilable au clavier : sans `tabIndex`, les flèches du clavier ne
        // l'atteignent pas, et le carrousel ne serait manœuvrable qu'à la souris.
        tabIndex={0}
        aria-label={`${lot.length} photos de ${label}`}
      >
        <ul className="carrousel__liste">
          {lot.map((image) => (
            <li key={image.photo.file} className="carrousel__vue">
              <Figure
                photo={image.photo}
                alt={image.legende}
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
            disabled={rang >= lot.length - 1}
            aria-label="Photo suivante"
          >
            ›
          </button>
          <p className="carrousel__compteur">
            {rang + 1} / {lot.length}
          </p>
        </>
      )}
    </div>
  )
}

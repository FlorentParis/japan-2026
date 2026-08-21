/**
 * CARROUSEL — une frise de photos qui défile à l'horizontale.
 *
 * Ce n'est pas un diaporama d'une vue à la fois : plusieurs photos sont visibles
 * côte à côte, comme une pellicule, et la frise se pousse au doigt, à la molette
 * horizontale ou par les deux flèches. Voir plusieurs vignettes d'un coup dit
 * mieux ce qu'une étape contient qu'une grande image dont on ignore la suite.
 *
 * Il ne sait rien de la provenance des images : il reçoit des `ImageZoomable`
 * déjà légendées et les montre. C'est à l'appelant de dire quelles photos et sous
 * quel titre — la galerie Commons d'une étape pour `PhotoCarrousel`, les photos
 * que publie un hôtel pour `Hebergement`.
 *
 * Le défilement est celui du navigateur (`scroll-snap`), pas une pile de
 * `transform` pilotée en JavaScript : le glissement au doigt, l'inertie et la
 * molette horizontale marchent alors sans qu'on ait à les réécrire. La largeur
 * d'une vue est réglée en CSS (`--frise-vue`), jamais ici : le pas de défilement
 * est *mesuré* sur le DOM, de sorte qu'un contexte peut changer la taille des
 * vignettes sans qu'aucune ligne de ce fichier ne bouge.
 *
 * Les vues qui dépassent du cadre à droite ne sont pas chargées : le
 * `loading="lazy"` de `Figure` s'en charge, et une frise de trente photos ne
 * coûte que celles qu'on regarde.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { scrollBehavior } from '../lib/motion'
import type { ImageZoomable } from '../state/visionneuse-state'
import { Figure } from './ui'

/**
 * Le pas de la frise : la distance du bord d'une vue au bord de la suivante,
 * gouttière comprise. Mesuré entre deux vues plutôt que calculé, pour ne pas
 * avoir à connaître ici la largeur ni l'espacement décidés par le CSS.
 */
function pasDeFrise(piste: HTMLElement): number {
  const vues = piste.querySelectorAll<HTMLElement>('.carrousel__vue')
  const premiere = vues[0]
  if (!premiere) return piste.clientWidth
  const seconde = vues[1]
  return seconde ? seconde.offsetLeft - premiere.offsetLeft : premiere.offsetWidth
}

/** Ce que la frise montre à cet instant, tout ce dont l'affichage a besoin. */
type EtatFrise = {
  /** Rang de la première vue visible, à partir de 0. */
  rang: number
  /** Combien de vues tiennent dans le cadre. */
  vues: number
  debut: boolean
  fin: boolean
}

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
  // `fin: false` au départ : avant toute mesure, mieux vaut proposer les flèches
  // et les désactiver ensuite que faire apparaître deux boutons après coup. C'est
  // aussi ce que voit le rendu hors navigateur de `npm run qa`, où aucun effet ne
  // s'exécute.
  const [etat, setEtat] = useState<EtatFrise>({ rang: 0, vues: 1, debut: true, fin: false })

  const mesurer = useCallback(() => {
    const element = piste.current
    if (!element) return
    const pas = pasDeFrise(element)
    setEtat({
      rang: pas > 0 ? Math.round(element.scrollLeft / pas) : 0,
      vues: pas > 0 ? Math.max(1, Math.round(element.clientWidth / pas)) : 1,
      debut: element.scrollLeft <= 1,
      // Le défilement n'est pas un nombre entier de pixels (zoom du navigateur,
      // écran à densité fractionnaire) : sans cette tolérance, la flèche de
      // droite resterait active au bout de la frise.
      fin: element.scrollLeft + element.clientWidth >= element.scrollWidth - 1,
    })
  }, [])

  // Deux choses changent la frise sans qu'aucun défilement n'ait eu lieu : le lot
  // s'allonge après le premier rendu (la galerie d'une étape arrive en différé),
  // et le cadre se redimensionne — la largeur d'une vue en dépend, donc le nombre
  // de vues visibles et l'existence même d'un débordement.
  useEffect(() => {
    const element = piste.current
    if (!element) return
    mesurer()
    if (typeof ResizeObserver === 'undefined') return
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(element)
    return () => observateur.disconnect()
  }, [mesurer, lot.length])

  if (lot.length === 0) return null

  const aller = (sens: number) => {
    const element = piste.current
    if (!element) return
    element.scrollBy({ left: sens * pasDeFrise(element), behavior: scrollBehavior() })
  }

  /** Rien à faire défiler : ni flèches, ni compteur. */
  const deborde = !etat.debut || !etat.fin
  const derniereVue = Math.min(etat.rang + etat.vues, lot.length)

  return (
    <div className={`carrousel${className ? ` ${className}` : ''}`}>
      {/* Les flèches se placent sur les bords de la frise : elles sont donc
          positionnées par rapport à elle, et non par rapport au bloc entier —
          sinon le compteur, en dessous, les décalerait vers le bas. */}
      <div className="carrousel__cadre">
        <section
          className="carrousel__piste"
          ref={piste}
          onScroll={mesurer}
          // Zone défilable au clavier : sans `tabIndex`, les flèches du clavier ne
          // l'atteignent pas, et la frise ne serait manœuvrable qu'à la souris.
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

        {deborde && (
          <>
            <button
              type="button"
              className="carrousel__fleche carrousel__fleche--avant"
              onClick={() => aller(-1)}
              disabled={etat.debut}
              aria-label="Photos précédentes"
            >
              ‹
            </button>
            <button
              type="button"
              className="carrousel__fleche carrousel__fleche--apres"
              onClick={() => aller(1)}
              disabled={etat.fin}
              aria-label="Photos suivantes"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Plusieurs vues étant visibles à la fois, le compteur donne la tranche
          affichée : un « 1 / 13 » laisserait croire qu'on n'en voit qu'une. */}
      {deborde && (
        <p className="carrousel__compteur">
          Photos {etat.rang + 1}
          {derniereVue > etat.rang + 1 && <>–{derniereVue}</>} sur {lot.length}
        </p>
      )}
    </div>
  )
}

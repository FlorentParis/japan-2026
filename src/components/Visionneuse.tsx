/**
 * VISIONNEUSE — une photo en grand, et de quoi parcourir les autres du même lot.
 *
 * Le contexte qui permet à n'importe quelle photo de l'ouvrir vit dans
 * `state/visionneuse-state.ts` ; ici, la fenêtre elle-même.
 *
 * C'est un `<dialog>` natif, et non une `<div>` avec un fond sombre : la touche
 * Échap, le piégeage du focus et l'inertie du reste de la page sont alors le
 * travail du navigateur, pas un empilement de gestionnaires d'événements à
 * maintenir.
 *
 * La visionneuse est aussi le seul endroit où le crédit d'une vignette de
 * 3,5 rem devient lisible : sur la fiche, il serait plus grand que l'image.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { jeuDeSources } from '../lib/vignettes'
import {
  VisionneuseContext,
  type ImageZoomable,
  type Ouvrir,
} from '../state/visionneuse-state'

export function Visionneuse({ children }: { children: ReactNode }) {
  const [vue, setVue] = useState<{ groupe: ImageZoomable[]; index: number }>()
  const dialogue = useRef<HTMLDialogElement>(null)

  const ouvrir = useCallback<Ouvrir>((groupe, depart) => {
    if (groupe.length === 0) return
    setVue({ groupe, index: Math.min(Math.max(depart, 0), groupe.length - 1) })
  }, [])

  // `showModal()` exige que l'élément soit déjà dans le DOM : impossible pendant
  // le rendu, d'où l'effet. Le dialogue n'est monté que lorsqu'il y a quelque
  // chose à montrer, ce qui évite d'embarquer une fenêtre vide dans chaque page.
  useEffect(() => {
    const element = dialogue.current
    if (element && !element.open) element.showModal()
  }, [vue])

  const deplacer = useCallback((pas: number) => {
    setVue((actuelle) => {
      if (!actuelle) return actuelle
      const total = actuelle.groupe.length
      return { ...actuelle, index: (actuelle.index + pas + total) % total }
    })
  }, [])

  return (
    <VisionneuseContext.Provider value={ouvrir}>
      {children}
      {vue && (
        <dialog
          ref={dialogue}
          className="visionneuse"
          aria-label="Photo en grand"
          onClose={() => setVue(undefined)}
          // Un clic sur le fond ferme : la cible n'est le dialogue lui-même que
          // lorsqu'on a cliqué à côté de son contenu.
          onClick={(event) => {
            if (event.target === dialogue.current) dialogue.current?.close()
          }}
          onKeyDown={(event) => {
            if (vue.groupe.length < 2) return
            if (event.key === 'ArrowRight') deplacer(1)
            if (event.key === 'ArrowLeft') deplacer(-1)
          }}
        >
          <ContenuVisionneuse
            groupe={vue.groupe}
            index={vue.index}
            deplacer={deplacer}
            fermer={() => dialogue.current?.close()}
          />
        </dialog>
      )}
    </VisionneuseContext.Provider>
  )
}

function ContenuVisionneuse({
  groupe,
  index,
  deplacer,
  fermer,
}: {
  groupe: ImageZoomable[]
  index: number
  deplacer: (pas: number) => void
  fermer: () => void
}) {
  const { photo, legende } = groupe[index]
  const plusieurs = groupe.length > 1

  return (
    <div className="visionneuse__cadre">
      <button
        type="button"
        className="visionneuse__fermer"
        onClick={fermer}
        aria-label="Fermer la photo"
      >
        ✕
      </button>

      {plusieurs && (
        <>
          <button
            type="button"
            className="visionneuse__fleche visionneuse__fleche--avant"
            onClick={() => deplacer(-1)}
            aria-label="Photo précédente"
          >
            ‹
          </button>
          <button
            type="button"
            className="visionneuse__fleche visionneuse__fleche--apres"
            onClick={() => deplacer(1)}
            aria-label="Photo suivante"
          >
            ›
          </button>
        </>
      )}

      <figure className="visionneuse__figure">
        <img
          // La clé force un nouvel élément à chaque photo : sans elle, React
          // réutilise le même `<img>` et l'ancienne image reste affichée le temps
          // que la nouvelle arrive.
          key={photo.file}
          src={photo.url}
          srcSet={jeuDeSources(photo)}
          sizes="100vw"
          alt={legende}
          width={photo.width}
          height={photo.height}
        />
        <figcaption className="visionneuse__legende">
          <span className="visionneuse__titre">{legende}</span>
          <span className="visionneuse__credit">
            {photo.author} · {photo.license} ·{' '}
            <a href={photo.sourcePage} target="_blank" rel="noreferrer noopener">
              page d’origine sur Wikimedia Commons
            </a>
          </span>
          {plusieurs && (
            <span className="visionneuse__compteur" aria-live="polite">
              {index + 1} / {groupe.length} — flèches ← → pour parcourir
            </span>
          )}
        </figcaption>
      </figure>
    </div>
  )
}

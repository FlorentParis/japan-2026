/**
 * Petites briques d'interface partagées.
 *
 * `CertaintyBadge` est la pièce centrale de l'exigence d'honnêteté : chaque
 * chiffre affiché sur le site porte, à côté de lui, la nature de sa source —
 * confirmé, estimé, ou à compléter. Rien n'est présenté comme sûr par défaut.
 */
import { useState, type ReactNode } from 'react'
import { PHOTOS } from '../data/photos.generated'
import { CERTAINTY_HINT, CERTAINTY_LABEL } from '../lib/format'
import { jeuDeSources } from '../lib/vignettes'
import { useVisionneuse, type ImageZoomable } from '../state/visionneuse-state'
import type { Certainty, Photo } from '../types'

export function CertaintyBadge({ certainty, label }: { certainty: Certainty; label?: string }) {
  return (
    <span className={`badge badge--${certainty}`} title={CERTAINTY_HINT[certainty]}>
      {label ?? CERTAINTY_LABEL[certainty]}
    </span>
  )
}

/** Valeur absente, affichée franchement plutôt que remplacée par un zéro. */
export function ToFill({ children }: { children?: ReactNode }) {
  return <span className="to-fill">{children ?? 'à compléter'}</span>
}

/**
 * Recopie un texte dans le presse-papier.
 *
 * Sert aux adresses en japonais : les montrer suffit devant un chauffeur, mais
 * pour les coller dans une application de cartes ou les envoyer par message, il
 * faut pouvoir les prendre — et sélectionner à la main deux lignes de kanji sur un
 * téléphone, dans un train, est une épreuve.
 *
 * L'échec est dit plutôt que passé sous silence : l'API du presse-papier est
 * refusée en navigation privée et hors contexte sécurisé. Le texte reste affiché
 * juste à côté, donc rien n'est perdu — encore faut-il savoir que le bouton n'a
 * rien fait.
 */
export function BoutonCopier({ texte, quoi }: { texte: string; quoi: string }) {
  const [etat, setEtat] = useState<'repos' | 'copie' | 'echec'>('repos')

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(texte)
      setEtat('copie')
    } catch {
      setEtat('echec')
    }
    // Le retour au repos permet de recopier, et évite un « Copié » qui resterait
    // affiché une demi-heure après le geste.
    setTimeout(() => setEtat('repos'), 2500)
  }

  return (
    <button
      type="button"
      className={`copier${etat === 'repos' ? '' : ` copier--${etat}`}`}
      onClick={() => void copier()}
      aria-label={`Copier ${quoi}`}
    >
      {etat === 'copie' ? 'Copié' : etat === 'echec' ? 'Copie refusée' : 'Copier'}
    </button>
  )
}

export function Stat({
  value,
  label,
  hint,
  muted,
}: {
  value: ReactNode
  label: string
  hint?: string
  muted?: boolean
}) {
  return (
    <div className={`stat${muted ? ' stat--muted' : ''}`}>
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
      {hint && <span className="stat__hint">{hint}</span>}
    </div>
  )
}

export function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string
  title: string
  children?: ReactNode
}) {
  return (
    <header className="section-head">
      {eyebrow && <p className="section-head__eyebrow">{eyebrow}</p>}
      <h2 className="section-head__title">{title}</h2>
      {children && <div className="section-head__intro">{children}</div>}
    </header>
  )
}

export function Warnings({ items, title }: { items: string[]; title?: string }) {
  if (items.length === 0) return null
  return (
    <div className="warnings">
      <p className="warnings__title">{title ?? 'À vérifier'}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Photo avec son crédit obligatoire.
 *
 * L'auteur, la licence et le lien vers la page source sont affichés avec chaque
 * image — c'est ce que les licences libres exigent, et ce n'est donc pas
 * décoratif. Presque toutes les images viennent de Wikimedia Commons ; les seules
 * exceptions sont les photos que les hébergements réservés publient d'eux-mêmes
 * (`src/data/hebergements.ts`), qui ne sont pas libres et pour lesquelles ce
 * crédit vaut attribution à défaut de licence.
 *
 * Cliquer dessus l'ouvre en grand. `groupe` dit alors quelles autres photos la
 * visionneuse peut parcourir : la galerie de l'étape, les vignettes d'une fiche…
 * Faute de groupe, c'est la photo seule — agrandie, sans flèches.
 */
export function Figure({
  photo,
  alt,
  ratio,
  className,
  eager,
  sizes,
  groupe,
}: {
  photo: Photo
  alt: string
  ratio?: string
  className?: string
  eager?: boolean
  sizes?: string
  groupe?: ImageZoomable[]
}) {
  const ouvrir = useVisionneuse()

  const image = (
    <img
      src={photo.url}
      srcSet={jeuDeSources(photo)}
      sizes={sizes}
      alt={alt}
      width={photo.width}
      height={photo.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  )

  return (
    <figure className={`photo${className ? ` ${className}` : ''}`} style={{ aspectRatio: ratio }}>
      {ouvrir ? (
        <button
          type="button"
          className="photo__agrandir"
          // Un fichier ne figure qu'une fois dans tout le site (voir `dejaPris`
          // dans le générateur) : son nom suffit donc à retrouver son rang dans
          // le groupe, sans avoir à propager un index de plus.
          onClick={() => {
            const lot = groupe ?? [{ photo, legende: alt }]
            const rang = lot.findIndex((item) => item.photo.file === photo.file)
            ouvrir(lot, Math.max(rang, 0))
          }}
          aria-label={`Agrandir la photo : ${alt}`}
        >
          {image}
        </button>
      ) : (
        image
      )}
      <figcaption className="photo__credit">
        <a href={photo.sourcePage} target="_blank" rel="noreferrer noopener">
          {photo.author} · {photo.license}
        </a>
      </figcaption>
    </figure>
  )
}

/**
 * Photo désignée par son identifiant dans `PHOTOS`.
 *
 * Rend `null` quand l'identifiant n'a pas de photo : une activité sans image
 * s'affiche sans image, jamais avec celle d'un autre lieu.
 */
export function PhotoFigure({
  photoId,
  alt,
  ratio,
  className,
  eager,
  sizes,
  groupe,
}: {
  photoId?: string
  alt: string
  ratio?: string
  className?: string
  eager?: boolean
  sizes?: string
  groupe?: ImageZoomable[]
}) {
  const photo = photoId ? PHOTOS[photoId] : undefined
  if (!photo) return null
  return (
    <Figure
      photo={photo}
      alt={alt}
      ratio={ratio}
      className={className}
      eager={eager}
      sizes={sizes}
      groupe={groupe}
    />
  )
}

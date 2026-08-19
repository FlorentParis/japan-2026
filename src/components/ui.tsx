/**
 * Petites briques d'interface partagées.
 *
 * `CertaintyBadge` est la pièce centrale de l'exigence d'honnêteté : chaque
 * chiffre affiché sur le site porte, à côté de lui, la nature de sa source —
 * confirmé, estimé, ou à compléter. Rien n'est présenté comme sûr par défaut.
 */
import type { ReactNode } from 'react'
import { PHOTOS } from '../data/photos.generated'
import { CERTAINTY_HINT, CERTAINTY_LABEL } from '../lib/format'
import type { Certainty } from '../types'

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
 * Toutes les images viennent de Wikimedia Commons sous licence libre ; l'auteur,
 * la licence et le lien vers la page source sont affichés avec chaque image.
 */
export function PhotoFigure({
  photoId,
  alt,
  ratio,
  className,
  eager,
}: {
  photoId?: string
  alt: string
  ratio?: string
  className?: string
  eager?: boolean
}) {
  const photo = photoId ? PHOTOS[photoId] : undefined
  if (!photo) return null
  return (
    <figure className={`photo${className ? ` ${className}` : ''}`} style={{ aspectRatio: ratio }}>
      <img
        src={photo.url}
        alt={alt}
        width={photo.width}
        height={photo.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
      <figcaption className="photo__credit">
        <a href={photo.sourcePage} target="_blank" rel="noreferrer noopener">
          {photo.author} · {photo.license}
        </a>
      </figcaption>
    </figure>
  )
}

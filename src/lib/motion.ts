/**
 * Réglage système « réduire les animations ».
 *
 * Les feuilles de style le respectent déjà (`base.css`), mais les mouvements
 * pilotés en JavaScript — recadrage de la carte, défilement de la frise — ne
 * passent pas par le CSS : ils doivent le lire eux-mêmes.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Durée d'un recadrage de carte, en millisecondes. */
export function cameraDuration(): number {
  return prefersReducedMotion() ? 0 : 900
}

/** Comportement de défilement pour `scrollIntoView`. */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}

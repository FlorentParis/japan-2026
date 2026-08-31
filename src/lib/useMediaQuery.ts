import { useEffect, useState } from 'react'

function lire(query: string): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches
  )
}

/**
 * Lit une media query depuis React.
 *
 * Les mises en page se règlent en CSS, jamais ici. On n'utilise ce hook que
 * lorsqu'un *comportement* change avec la taille de l'écran — le tiroir de la
 * vue Carte, par exemple, qui se glisse au doigt sur mobile et n'existe pas sur
 * grand écran. Le CSS ne peut pas décider cela tout seul.
 */
export function useMediaQuery(query: string): boolean {
  const [correspond, setCorrespond] = useState(() => lire(query))

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    // C'est exactement le cas prévu par la règle : on se resynchronise avec un
    // système extérieur, dont l'état a pu changer avant que l'écouteur soit posé.
    // oxlint-disable-next-line react/set-state-in-effect
    setCorrespond(mql.matches)
    const surChangement = (event: MediaQueryListEvent) => setCorrespond(event.matches)
    mql.addEventListener('change', surChangement)
    return () => mql.removeEventListener('change', surChangement)
  }, [query])

  return correspond
}

/**
 * Galerie d'une étape, chargée à la demande.
 *
 * `galleries.generated.ts` pèse 160 ko. La vue Photos peut se le permettre : elle
 * est elle-même chargée à la demande. Mais l'itinéraire et la carte affichent
 * maintenant eux aussi plusieurs photos par étape, et ces deux vues font partie du
 * lot initial — un `import` statique depuis leurs composants annulerait tout le
 * découpage décrit dans le README.
 *
 * D'où un `import()` déclenché dans un effet : Vite en fait un morceau à part,
 * partagé avec la vue Photos, téléchargé seulement lorsqu'une fiche d'étape est
 * réellement rendue. Le module n'est demandé qu'une fois pour toute la page, quel
 * que soit le nombre de composants qui l'attendent.
 */
import { useEffect, useState } from 'react'
import type { Photo } from '../types'

type Galeries = Record<string, Photo[]>

let chargees: Galeries | undefined
let enCours: Promise<Galeries> | undefined

function charger(): Promise<Galeries> {
  enCours ??= import('../data/galleries.generated').then((module) => {
    chargees = module.GALLERIES
    return module.GALLERIES
  })
  return enCours
}

/**
 * Rend `undefined` tant que le morceau n'est pas arrivé — et lors du rendu hors
 * navigateur de `npm run qa`, où aucun effet ne s'exécute. L'appelant doit donc
 * savoir se contenter de la photo de tête, qui est, elle, dans le lot initial.
 */
export function useGalerie(destId: string): Photo[] | undefined {
  const [galeries, setGaleries] = useState<Galeries | undefined>(chargees)

  useEffect(() => {
    if (galeries) return
    let vivant = true
    charger().then((toutes) => {
      if (vivant) setGaleries(toutes)
    })
    return () => {
      vivant = false
    }
  }, [galeries])

  return galeries?.[destId]
}

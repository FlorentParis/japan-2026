/**
 * Contexte de la visionneuse : de quoi l'ouvrir, depuis n'importe quelle photo.
 *
 * Séparé du composant `components/Visionneuse.tsx` pour la même raison que
 * `trip-state.ts` l'est de `TripProvider.tsx` : un fichier qui exporte à la fois
 * un composant et un crochet casse le rechargement à chaud de Vite.
 *
 * Pourquoi un contexte plutôt qu'un état local à chaque galerie : il ne doit y
 * avoir qu'une seule fenêtre ouverte à la fois dans toute la page, et n'importe
 * quelle photo du site doit pouvoir l'ouvrir — la vignette d'une spécialité
 * comme le bandeau d'accueil. `Figure` s'y branche tout seul.
 */
import { createContext, useContext } from 'react'
import type { Photo } from '../types'

/** Une photo et la légende sous laquelle elle est montrée. */
export type ImageZoomable = { photo: Photo; legende: string }

/** Ouvre la visionneuse sur `groupe`, à partir de la photo de rang `depart`. */
export type Ouvrir = (groupe: ImageZoomable[], depart: number) => void

export const VisionneuseContext = createContext<Ouvrir | undefined>(undefined)

/**
 * Rend `undefined` hors du fournisseur — le rendu hors navigateur de `npm run qa`
 * en profite : les photos y restent de simples images, sans bouton.
 */
export function useVisionneuse(): Ouvrir | undefined {
  return useContext(VisionneuseContext)
}

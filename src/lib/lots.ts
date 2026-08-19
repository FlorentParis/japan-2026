/**
 * Les lots de photos que la visionneuse peut parcourir.
 *
 * Un lot, c'est ce que les flèches ‹ › atteindront depuis une photo donnée. Il
 * doit donc correspondre à ce qui est réellement montré à l'écran : parcourir
 * une galerie et tomber sur une image absente de la page serait déroutant.
 *
 * Dans `lib/` et non dans `ui.tsx` : ce sont des données, pas du rendu — et un
 * fichier qui exporte à la fois des composants et des fonctions casse le
 * rechargement à chaud de Vite.
 */
import { PHOTOS } from '../data/photos.generated'
import type { ImageZoomable } from '../state/visionneuse-state'

/**
 * Le lot de photos d'une fiche d'étape : sa photo de tête, puis celles de ses
 * activités et de ses spécialités, chacune légendée par ce qu'elle montre.
 *
 * C'est ce qui rend le parcours de la visionneuse utile plutôt qu'arbitraire, et
 * c'est aussi le seul endroit où le crédit d'une vignette de 3,5 rem devient
 * lisible. Les identifiants sans photo sont écartés — jamais remplacés.
 */
export function lotDeLaFiche(dest: {
  name: string
  photoId?: string
  activities: { id: string; name: string }[]
  specialities?: { id: string; name: string }[]
}): ImageZoomable[] {
  const sujets = [
    { id: dest.photoId, legende: dest.name },
    ...dest.activities.map((a) => ({ id: a.id, legende: a.name })),
    ...(dest.specialities ?? []).map((s) => ({ id: s.id, legende: s.name })),
  ]
  return sujets.flatMap(({ id, legende }) => {
    const photo = id ? PHOTOS[id] : undefined
    return photo ? [{ photo, legende }] : []
  })
}

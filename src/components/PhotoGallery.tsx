/**
 * Galerie d'une étape, en grille : toute la galerie, d'un coup, dans la vue
 * Photos. Un clic sur une image l'ouvre en grand dans la visionneuse.
 *
 * Fichier à part, et non une brique de `ui.tsx` : il importe
 * `galleries.generated.ts` *statiquement*, le plus gros fichier de données du
 * projet. Avec `lib/galleries.ts`, ce sont les deux seuls à le faire, et tous
 * deux ne sont atteignables que depuis la vue Photos, chargée à la demande : les
 * quatre cents images de galerie ne sont donc pas téléchargées par un visiteur
 * qui arrive sur l'aperçu. L'itinéraire et la carte, qui font partie du lot
 * initial, passent eux par `lib/useGalerie.ts` et son `import()`.
 *
 * Rien n'est listé à la main ici : `scripts/fetch-photos.ts` construit
 * `GALLERIES`, et un même fichier n'apparaît qu'une fois dans tout le site.
 */
import { GALLERIES } from '../data/galleries.generated'
import { titreDeFichier } from '../lib/vignettes'
import { Figure } from './ui'

export function PhotoGallery({
  destId,
  name,
  max,
  eagerFirst,
}: {
  destId: string
  name: string
  max?: number
  /**
   * Charge la première image sans attendre. Réservé à la galerie visible au
   * chargement : sur une page qui en aligne dix-huit, tout charger d'emblée
   * ferait dix-huit requêtes avant le premier pixel utile.
   */
  eagerFirst?: boolean
}) {
  const photos = GALLERIES[destId] ?? []
  if (photos.length === 0) return null
  const montrees = max ? photos.slice(0, max) : photos
  // Le lot que la visionneuse pourra parcourir : ce qui est montré, et rien de
  // plus — les flèches ne doivent pas mener à une photo absente de la page.
  const lot = montrees.map((photo) => ({
    photo,
    legende: `${name} — ${titreDeFichier(photo.file)}`,
  }))
  return (
    <ul className="gallery">
      {montrees.map((photo, index) => (
        <li key={photo.file} className="gallery__item">
          <Figure
            photo={photo}
            alt={lot[index].legende}
            ratio="4 / 3"
            className="photo--gallery"
            sizes="(max-width: 640px) 45vw, (max-width: 1100px) 30vw, 260px"
            eager={eagerFirst === true && index === 0}
            groupe={lot}
          />
        </li>
      ))}
    </ul>
  )
}

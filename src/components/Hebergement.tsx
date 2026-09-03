/**
 * CE QU'APPORTE UNE RÉSERVATION D'HÉBERGEMENT : adresse en alphabet latin puis en
 * japonais, lien Maps, téléphone, horaires d'arrivée et de départ, photos de
 * l'établissement.
 *
 * Ce bloc complète — il ne répète pas. Le nom, le prix et la pastille de certitude
 * sont déjà affichés par ses deux appelants, chacun à sa façon : la ligne de la
 * vue Hôtels et le champ « Hébergement » de la fiche d'étape. Les redonner ici
 * ferait dire deux fois la même chose à deux endroits de la même ligne.
 *
 * Il rend `null` dès qu'une réservation n'apporte rien de tout cela : les étapes
 * encore à trouver gardent exactement leurs `ToFill`, sans cadre vide dessous.
 */
import { lienMaps, formatTime } from '../lib/format'
import { photosHebergement, type PhotoHebergement } from '../data/hebergements'
import type { Accommodation } from '../types'
import { Carrousel } from './Carrousel'
import { BoutonCopier } from './ui'

/**
 * « Arrivée à partir de 15 h · départ avant 10 h ».
 *
 * Chaque moitié ne s'écrit que si l'heure est connue : une seule heure renseignée
 * donne une seule moitié, aucune ne donne rien du tout.
 */
function horaires(hotel: Accommodation): string | undefined {
  const arrivee = formatTime(hotel.checkIn)
  const depart = formatTime(hotel.checkOut)
  const morceaux = [
    arrivee && `arrivée à partir de ${arrivee}`,
    depart && `départ avant ${depart}`,
  ].filter(Boolean)
  if (morceaux.length === 0) return undefined
  const texte = morceaux.join(' · ')
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

/**
 * La légende d'une photo d'hôtel, à partir de la seule chose que la source en
 * dise : sa catégorie. Comme `titreDeFichier()` pour les photos de Commons —
 * décrire ce qu'on croit voir sur l'image serait broder.
 */
function legende(nom: string, photo: PhotoHebergement): string {
  return `${nom} — ${photo.sujet}`
}

export function Hebergement({
  hotel,
  ratio,
  sizes,
  className,
}: {
  hotel: Accommodation
  ratio?: string
  sizes?: string
  className?: string
}) {
  const photos = photosHebergement(hotel.photosId)
  const heures = horaires(hotel)
  const enJaponais = [hotel.nameJa, hotel.addressJa].filter(Boolean).join('\n')
  if (
    !hotel.address &&
    !hotel.coord &&
    !enJaponais &&
    !hotel.phone &&
    !heures &&
    photos.length === 0
  ) {
    return null
  }

  const nom = hotel.name ?? 'l’hébergement'
  const lot = photos.map((photo) => ({ photo, legende: legende(nom, photo) }))

  return (
    <div className={`hebergement${className ? ` ${className}` : ''}`}>
      {(hotel.address || hotel.coord) && (
        <p className="hebergement__adresse">
          {hotel.address}
          {hotel.coord && (
            <>
              {hotel.address && ' '}
              <a
                className="hebergement__maps"
                href={lienMaps(hotel.coord)}
                target="_blank"
                rel="noreferrer noopener"
              >
                Voir sur Maps
              </a>
            </>
          )}
        </p>
      )}

      {/*
        L'adresse japonaise n'est pas une traduction de courtoisie : c'est la seule
        forme utilisable sur place, à montrer à un chauffeur ou à recopier dans une
        application. Elle est donc mise en avant, pas reléguée en petit gris — et
        `lang="ja"` laisse le système choisir une police qui dessine les kanji.
      */}
      {enJaponais && (
        <p className="hebergement__japonais">
          <span lang="ja">
            {hotel.nameJa && <span className="hebergement__nom-ja">{hotel.nameJa}</span>}
            {hotel.addressJa}
          </span>
          {/* Le nom part avec l'adresse : c'est ce qu'il faut pour retrouver
              l'établissement une fois collé dans une application de cartes. */}
          <BoutonCopier
            texte={enJaponais}
            quoi={hotel.nameJa ? 'le nom et l’adresse en japonais' : 'l’adresse en japonais'}
          />
        </p>
      )}

      {hotel.phone && (
        <p className="hebergement__telephone">
          {/* Numéro cliquable : sur le téléphone qui lira ce carnet, c'est un appel
              en un geste — pour prévenir d'un retard ou chercher une valise. */}
          <a href={`tel:${hotel.phone.replace(/[^\d+]/g, '')}`}>{hotel.phone}</a>
        </p>
      )}

      {heures && <p className="hebergement__horaires">{heures}</p>}

      <Carrousel
        lot={lot}
        label={nom}
        ratio={ratio}
        sizes={sizes}
        className="hebergement__photos"
      />
    </div>
  )
}

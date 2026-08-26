import { useEffect, useState } from 'react'
import { dateISO } from './aujourdhui'

/**
 * La date du jour, telle que l'horloge de l'appareil la donne, et qui change
 * d'elle-même au passage de minuit.
 *
 * En voyage, le site reste ouvert des heures dans un onglet de téléphone : un
 * « aujourd'hui » figé au chargement afficherait le programme de la veille au
 * réveil. Un seul réveil est armé, calé sur le prochain minuit — pas de sondage
 * à la seconde, qui réveillerait l'appareil pour rien.
 */
export function useDateDuJour(): string {
  const [date, setDate] = useState(() => dateISO(new Date()))

  useEffect(() => {
    const maintenant = new Date()
    const minuit = new Date(maintenant)
    minuit.setHours(24, 0, 0, 0)
    // Une seconde de marge : se réveiller pile à l'instant du changement de date
    // relirait parfois encore la veille, à un arrondi d'horloge près.
    const attente = minuit.getTime() - maintenant.getTime() + 1000
    const reveil = setTimeout(() => setDate(dateISO(new Date())), attente)
    return () => clearTimeout(reveil)
    // Rejoué à chaque changement de date : le réveil suivant se recale sur le
    // minuit suivant, et le site tient plusieurs nuits d'affilée.
  }, [date])

  return date
}

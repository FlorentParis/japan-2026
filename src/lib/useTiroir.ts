/**
 * TIROIR glissant par le bas (« bottom sheet »).
 *
 * Trois paliers seulement — replié, à moitié, plein écran. Trois, parce qu'un
 * tiroir libre au pixel se referme par accident et qu'on ne retrouve jamais la
 * hauteur qu'on aimait ; et parce que trois positions se parcourent aussi au
 * clavier (flèches) ou par simples appuis, pas seulement au doigt.
 *
 * Les hauteurs ne sont pas des constantes en dur : le palier replié vaut la
 * hauteur réelle de l'en-tête (mesurée), et le palier plein laisse toujours un
 * bandeau de carte visible. Un texte d'en-tête qui passe sur deux lignes, une
 * police système plus grande, un écran très bas : le tiroir suit, sans qu'aucune
 * valeur magique n'ait à être retouchée.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { prefersReducedMotion } from './motion'

export type Palier = 'replie' | 'demi' | 'plein'

/** Du plus fermé au plus ouvert : l'ordre des appuis et des flèches. */
const ORDRE: readonly Palier[] = ['replie', 'demi', 'plein'] as const

/** Bandeau de carte qu'on garde visible au palier plein, en pixels. */
const CARTE_MINIMALE = 44

/** Déplacement du doigt en dessous duquel on considère qu'il s'agit d'un appui. */
const SEUIL_GLISSEMENT = 6

export function useTiroir(actif: boolean) {
  /** Le cadre qui contient carte et tiroir : il donne la hauteur disponible. */
  const cadreRef = useRef<HTMLDivElement>(null)
  /** L'en-tête du tiroir : sa hauteur *est* celle du palier replié. */
  const teteRef = useRef<HTMLDivElement>(null)

  const [mesures, setMesures] = useState({ cadre: 0, tete: 0 })
  const [palier, setPalier] = useState<Palier>('demi')
  /** Hauteur suivie au doigt, en pixels ; `null` dès que le doigt est relâché. */
  const [glisse, setGlisse] = useState<number | null>(null)

  useEffect(() => {
    const cadre = cadreRef.current
    const tete = teteRef.current
    if (!cadre || !tete || typeof ResizeObserver !== 'function') return

    const relever = () => {
      const suivant = { cadre: cadre.clientHeight, tete: tete.offsetHeight }
      setMesures((actuel) =>
        actuel.cadre === suivant.cadre && actuel.tete === suivant.tete ? actuel : suivant,
      )
    }

    relever()
    const observateur = new ResizeObserver(relever)
    observateur.observe(cadre)
    observateur.observe(tete)
    return () => observateur.disconnect()
  }, [])

  const hauteurs = useMemo(() => {
    const replie = Math.max(56, mesures.tete)
    const plein = Math.max(replie, mesures.cadre - CARTE_MINIMALE)
    const demi = Math.min(plein, Math.max(replie, Math.round(mesures.cadre * 0.5)))
    return { replie, demi, plein }
  }, [mesures])

  /** Le tiroir ne prend la main qu'une fois mesuré : sinon, c'est le CSS. */
  const pret = actif && mesures.cadre > 0 && mesures.tete > 0

  const glissement = useRef<{ y: number; hauteur: number; bouge: boolean } | null>(null)
  /** Vrai juste après un glissement : le `click` qui suit ne doit rien cycler. */
  const aGlisse = useRef(false)

  const deplacer = useCallback(
    (pas: number) =>
      setPalier((courant) => {
        const index = ORDRE.indexOf(courant) + pas
        return ORDRE[Math.min(ORDRE.length - 1, Math.max(0, index))]
      }),
    [],
  )

  const surPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!pret) return
      glissement.current = { y: event.clientY, hauteur: hauteurs[palier], bouge: false }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [pret, hauteurs, palier],
  )

  const surPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const encours = glissement.current
      if (!encours) return
      const delta = encours.y - event.clientY
      if (!encours.bouge && Math.abs(delta) < SEUIL_GLISSEMENT) return
      encours.bouge = true
      setGlisse(Math.min(hauteurs.plein, Math.max(hauteurs.replie, encours.hauteur + delta)))
    },
    [hauteurs],
  )

  const surPointerUp = useCallback(() => {
    const encours = glissement.current
    if (!encours) return
    glissement.current = null
    aGlisse.current = encours.bouge

    if (encours.bouge) {
      const atteinte = glisse ?? encours.hauteur
      // On s'arrête au palier le plus proche, pas là où le doigt s'est levé.
      setPalier(
        ORDRE.reduce((meilleur, candidat) =>
          Math.abs(hauteurs[candidat] - atteinte) < Math.abs(hauteurs[meilleur] - atteinte)
            ? candidat
            : meilleur,
        ),
      )
    }
    setGlisse(null)
  }, [glisse, hauteurs])

  const surClick = useCallback(() => {
    if (aGlisse.current) {
      aGlisse.current = false
      return
    }
    setPalier((courant) => ORDRE[(ORDRE.indexOf(courant) + 1) % ORDRE.length])
  }, [])

  const surKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        deplacer(1)
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        deplacer(-1)
      }
    },
    [deplacer],
  )

  /** Ouvre le tiroir s'il est replié — appelé quand la carte a quelque chose à montrer. */
  const entrouvrir = useCallback(() => {
    setPalier((courant) => (courant === 'replie' ? 'demi' : courant))
  }, [])

  return {
    cadreRef,
    teteRef,
    palier,
    pret,
    entrouvrir,
    /**
     * Ce que le tiroir recouvre, pour que la carte recadre au-dessus. On prend
     * la hauteur du palier, pas celle suivie au doigt (inutile de recadrer
     * pendant le geste), et on la plafonne : au palier plein, une marge de
     * caméra plus haute que la carte elle-même ne veut plus rien dire.
     */
    masqueBas: pret ? Math.min(hauteurs[palier], Math.round(mesures.cadre * 0.55)) : 0,
    /** Hauteur imposée en pixels, ou `undefined` pour laisser faire le CSS. */
    style: pret
      ? ({
          height: `${glisse ?? hauteurs[palier]}px`,
          transition: glisse !== null || prefersReducedMotion() ? 'none' : undefined,
        } satisfies React.CSSProperties)
      : undefined,
    /** À étaler sur la poignée : un vrai bouton, donc utilisable au clavier. */
    priseProps: {
      onPointerDown: surPointerDown,
      onPointerMove: surPointerMove,
      onPointerUp: surPointerUp,
      onPointerCancel: surPointerUp,
      onClick: surClick,
      onKeyDown: surKeyDown,
    },
  }
}

/**
 * CE QUE LES ENVOIS DE VALISE VEULENT DIRE, ÉTAPE PAR ÉTAPE ET JOUR PAR JOUR.
 *
 * `data/bagages.ts` n'écrit qu'une chose par envoi : d'où, vers où, quand. Tout
 * le reste — quelles étapes se font sans valise, ce qu'il y a à faire aujourd'hui,
 * ce que ça coûte — est déduit ici, comme partout ailleurs sur ce site.
 *
 * Le point délicat est la notion d'« étape sans valise », et elle ne s'écrit pas à
 * la main : c'est toute étape dont le rang est **strictement** entre celui du
 * départ et celui de l'arrivée de l'envoi. Kamikōchi n'est donc jamais désigné
 * comme « sans valise » dans les données ; il l'est parce qu'il tombe entre
 * Matsumoto et Takayama. Déplacer l'envoi d'une étape déplace la conséquence
 * d'elle-même.
 */
import { EXPEDITIONS } from '../data/bagages'
import { DESTINATIONS } from '../data/destinations'
import type { Destination, Expedition } from '../types'
import { daysInclusive } from './format'

/** Les envois dans l'ordre chronologique. `AAAA-MM-JJ` : comparer les chaînes suffit. */
export function expeditions(): Expedition[] {
  return [...EXPEDITIONS].sort((a, b) => a.sentOn.localeCompare(b.sentOn))
}

/** Le rang d'une étape dans le parcours, ou `undefined` si l'identifiant est faux. */
function rang(destId: string): number | undefined {
  return DESTINATIONS.find((d) => d.id === destId)?.order
}

/** L'étape désignée par un identifiant. Utilisé pour nommer les deux bouts d'un envoi. */
export function etape(destId: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === destId)
}

/**
 * Les étapes qu'un envoi traverse : celles où l'on n'a pas sa valise.
 *
 * Bornes exclues — on a encore la valise le matin du départ, on la retrouve le
 * soir de l'arrivée. Ce sont les étapes du milieu qui se font avec un sac de jour,
 * et c'est pour elles que l'envoi existe.
 */
export function etapesTraversees(expedition: Expedition): Destination[] {
  const depart = rang(expedition.fromDestination)
  const arrivee = rang(expedition.toDestination)
  if (depart === undefined || arrivee === undefined) return []
  return DESTINATIONS.filter((d) => d.order > depart && d.order < arrivee)
}

/**
 * Nuits passées sans la valise : celles qui tombent entre la remise et la livraison.
 *
 * Déduit des deux dates, et pas du nombre d'étapes traversées — ce serait faux
 * dans les deux sens. La route alpine est une étape sans nuit, et la compter en
 * donnerait une de trop ; Naoshima aussi, alors que la nuit sans valise de cet
 * envoi-là se passe à Hiroshima, avant le départ, donc sur l'étape de départ
 * elle-même. Ce sont les dates qui savent, elles seules.
 */
export function nuitsSansValise(expedition: Expedition): number {
  return daysInclusive(expedition.sentOn, expedition.deliveredOn) - 1
}

export type BagagesDeLEtape = {
  /** Envois qui partent de cette étape. */
  aExpedier: Expedition[]
  /** Envois qui arrivent à cette étape : on y retrouve la valise. */
  aRecuperer: Expedition[]
  /** Envois qui traversent cette étape : elle se fait sans valise. */
  sansValise: Expedition[]
}

/** Tout ce qu'une étape a à dire de la valise. Les trois listes peuvent coexister. */
export function bagagesDeLEtape(destId: string): BagagesDeLEtape {
  const tous = expeditions()
  return {
    aExpedier: tous.filter((e) => e.fromDestination === destId),
    aRecuperer: tous.filter((e) => e.toDestination === destId),
    sansValise: tous.filter((e) => etapesTraversees(e).some((d) => d.id === destId)),
  }
}

/**
 * L'étiquette courte d'une étape, pour la frise : la valise y est-elle ?
 *
 * `undefined` quand il n'y a rien à signaler — l'immense majorité des étapes, où
 * la valise suit sans histoire. Une pastille sur chaque ligne ne dirait plus rien.
 */
export function etiquetteBagage(destId: string): string | undefined {
  const { aExpedier, aRecuperer, sansValise } = bagagesDeLEtape(destId)
  // « Sans valise » d'abord : c'est le seul cas où l'étape entière change de
  // nature. Puis les deux à la fois — Takayama reçoit la valise le 11 et la
  // renvoie le 13, et n'annoncer que le départ y ferait oublier qu'il faut
  // d'abord l'attendre. L'ordre des trois derniers tests n'est pas un classement
  // d'importance : ce sont trois cas qui, à eux seuls, ne coexistent pas.
  if (sansValise.length > 0) return 'sans valise'
  if (aExpedier.length > 0 && aRecuperer.length > 0) return 'valise livrée puis réexpédiée'
  if (aExpedier.length > 0) return 'valise à expédier'
  if (aRecuperer.length > 0) return 'valise livrée ici'
  return undefined
}

export type BagagesDuJour = {
  /** Envois à remettre à la réception ce jour-là. */
  aRemettre: Expedition[]
  /** Envois livrés ce jour-là : on retrouve la valise. */
  aRecevoir: Expedition[]
  /**
   * Envois en cours de route ce jour-là, remise et livraison comprises.
   *
   * Bornes incluses côté remise, exclues côté livraison : le jour où l'on confie
   * la valise, on voyage déjà sans elle ; le jour où elle est livrée, on l'a de
   * nouveau le soir.
   */
  enRoute: Expedition[]
}

/** Ce que la valise fait un jour donné. */
export function bagagesDuJour(date: string): BagagesDuJour {
  const tous = expeditions()
  return {
    aRemettre: tous.filter((e) => e.sentOn === date),
    aRecevoir: tous.filter((e) => e.deliveredOn === date),
    enRoute: tous.filter((e) => e.sentOn <= date && date < e.deliveredOn),
  }
}

/** Vrai s'il y a quelque chose à dire de la valise ce jour-là. */
export function jourAvecBagage(jour: BagagesDuJour): boolean {
  return jour.aRemettre.length > 0 || jour.aRecevoir.length > 0 || jour.enRoute.length > 0
}

/**
 * Les envois dont l'hébergement d'arrivée n'est pas encore réservé.
 *
 * C'est le seul vrai blocage du dispositif : on n'expédie pas une valise vers un
 * hôtel qui n'existe pas encore. Trois des quatre envois sont dans ce cas
 * aujourd'hui, et c'est une contrainte de réservation — l'établissement choisi
 * doit accepter les colis à l'avance, ce que font toutes les chaînes d'affaires.
 */
export function expeditionsSansDestinataire(): Array<{ expedition: Expedition; dest: Destination }> {
  return expeditions().flatMap((expedition) => {
    const dest = etape(expedition.toDestination)
    if (!dest || dest.accommodation.status === 'confirmed') return []
    return [{ expedition, dest }]
  })
}

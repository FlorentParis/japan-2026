/**
 * Style de chaque moyen de transport — SOURCE UNIQUE.
 *
 * La carte, la légende, la timeline et les fiches lisent tous ce fichier :
 * un trait bleu pointillé sur la carte est forcément un ferry, et la légende
 * ne peut pas se désynchroniser du rendu.
 *
 * Chaque mode se distingue par la COULEUR *et* par la FORME du trait (plein,
 * tirets, pointillés, épaisseur) : le parcours reste lisible en noir et blanc,
 * à l'impression, et pour un œil daltonien.
 */
import type { TransportMode } from '../types'

export type ModeStyle = {
  label: string
  /** Pluriel, pour les compteurs. */
  plural: string
  icon: string
  color: string
  /** Épaisseur du trait, en pixels. */
  width: number
  /**
   * Motif de tirets, exprimé en multiples de l'épaisseur (convention MapLibre).
   * `undefined` = trait plein.
   */
  dash?: number[]
  /** Ce que le mode désigne concrètement, affiché dans la légende étendue. */
  hint: string
}

export const MODE_STYLES: Record<TransportMode, ModeStyle> = {
  shinkansen: {
    label: 'Shinkansen',
    plural: 'Shinkansen',
    icon: '🚄',
    color: '#C0442B',
    width: 4.5,
    hint: 'Trait plein épais — train à grande vitesse',
  },
  train: {
    label: 'Train',
    plural: 'Trains',
    icon: '🚆',
    color: '#34508C',
    width: 3,
    hint: 'Trait plein fin — express, rapide ou omnibus',
  },
  bus: {
    label: 'Bus',
    plural: 'Bus',
    icon: '🚌',
    color: '#B8842B',
    width: 3,
    dash: [2.2, 1.6],
    hint: 'Tirets — autocar de ligne ou de montagne',
  },
  ferry: {
    label: 'Ferry',
    plural: 'Ferries',
    icon: '⛴️',
    color: '#1F8A94',
    width: 3.2,
    dash: [0.6, 1.8],
    hint: 'Pointillés ronds — traversée maritime',
  },
  plane: {
    label: 'Avion',
    plural: 'Vols',
    icon: '✈️',
    color: '#6C5896',
    width: 2.6,
    dash: [4, 2.4],
    hint: 'Long tirets en arc — vol intérieur, tracé géodésique',
  },
  ropeway: {
    label: 'Téléphérique',
    plural: 'Téléphériques & funiculaires',
    icon: '🚡',
    color: '#3F7A4E',
    width: 3.2,
    dash: [3, 1.2, 0.7, 1.2],
    hint: 'Tiret-point — câble, funiculaire ou téléphérique',
  },
  walk: {
    label: 'Marche',
    plural: 'Sections à pied',
    icon: '🚶',
    color: '#7C7566',
    width: 2.6,
    dash: [0.4, 1.6],
    hint: 'Pointillés serrés — portion à pied incontournable',
  },
}

export const MODE_ORDER: TransportMode[] = [
  'shinkansen',
  'train',
  'bus',
  'ferry',
  'plane',
  'ropeway',
  'walk',
]

export const modeStyle = (mode: TransportMode) => MODE_STYLES[mode]

/**
 * CONTRÔLE DE RENDU — chaque vue est rendue en HTML hors navigateur.
 *
 * Objectif : détecter les erreurs qu'un simple `tsc` ne voit pas, c'est-à-dire
 * les accesseurs qui lèvent (`place()`, `destination()`), et toute donnée
 * manquante qui s'afficherait en « undefined » ou « NaN » au lieu du champ
 * « à compléter » prévu — ce qui trahirait la règle : jamais de fausse valeur.
 *
 * La vue Carte n'est pas testée ici : MapLibre exige un vrai canevas WebGL.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ModeLegend } from '../src/components/ModeLegend'
import { Timeline } from '../src/components/Timeline'
import { Visionneuse } from '../src/components/Visionneuse'
import { TripProvider } from '../src/state/TripProvider'
import { ActivitesView } from '../src/views/ActivitesView'
import { ApercuView } from '../src/views/ApercuView'
import { BudgetView } from '../src/views/BudgetView'
import { HotelsView } from '../src/views/HotelsView'
import { ItineraireView } from '../src/views/ItineraireView'
import { PhotosView } from '../src/views/PhotosView'
import { TransportsView } from '../src/views/TransportsView'

const cases: Array<[string, () => ReactElement]> = [
  ['Aperçu', () => createElement(ApercuView)],
  ['Itinéraire', () => createElement(ItineraireView)],
  ['Hôtels', () => createElement(HotelsView)],
  ['Activités', () => createElement(ActivitesView)],
  ['Photos', () => createElement(PhotosView)],
  ['Budget', () => createElement(BudgetView)],
  ['Transports', () => createElement(TransportsView)],
  ['Frise (composant)', () => createElement(Timeline, { compact: true })],
  ['Légende (composant)', () => createElement(ModeLegend)],
]

/** Traces d'une donnée mal gérée qui aurait fui dans le HTML. */
const SUSPECT = /undefined|NaN|\[object Object\]/

/**
 * `node .qa/rendu.mjs --dump` écrit le HTML de chaque vue dans `.qa/rendu/`.
 * Pratique pour relire un texte exact — un libellé de date, une phrase de
 * réserve sur les pass — sans ouvrir le navigateur.
 */
const dump = process.argv.includes('--dump')
if (dump) mkdirSync(new URL('./rendu/', import.meta.url), { recursive: true })

let failures = 0

for (const [name, factory] of cases) {
  try {
    // Les deux mêmes fournisseurs que `main.tsx`, et dans le même ordre : sans
    // la visionneuse, les photos se rendraient ici sans leur bouton
    // d'agrandissement, et le contrôle porterait sur un autre HTML que celui du
    // navigateur.
    const html = renderToStaticMarkup(
      createElement(TripProvider, null, createElement(Visionneuse, null, factory())),
    )
    if (dump) {
      // NFD puis suppression des diacritiques : « Aperçu » → « apercu ».
      const slug = name
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[^a-zA-Z]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
      writeFileSync(new URL(`./rendu/${slug}.html`, import.meta.url), html)
    }
    const suspect = SUSPECT.exec(html)
    if (suspect) {
      failures += 1
      console.log(`ÉCHEC  ${name} : le HTML contient « ${suspect[0]} »`)
    } else {
      console.log(`ok     ${name.padEnd(20)} ${String(html.length).padStart(6)} octets`)
    }
  } catch (error) {
    failures += 1
    console.log(`ÉCHEC  ${name} : ${(error as Error).message}`)
  }
}

if (failures > 0) {
  console.log(`\n${failures} vue(s) en échec.`)
  process.exit(1)
}
console.log('\nToutes les vues se rendent sans erreur et sans valeur parasite.')

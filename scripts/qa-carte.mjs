/**
 * CONTRÔLE DE LA CARTE DANS UN VRAI NAVIGATEUR.
 *
 * Les autres contrôles (`qa-donnees`, `qa-rendu`) tournent hors navigateur : ils
 * ne peuvent rien dire de MapLibre, qui a besoin de WebGL et du réseau. C'est
 * exactement là que se cachait le bug « la carte ne s'affiche pas ».
 *
 * Ce script pilote Chrome en mode « headless » via le protocole DevTools, sans
 * aucune dépendance à installer :
 *   1. il ouvre le site,
 *   2. il clique sur l'onglet « Carte »,
 *   3. il relève les erreurs de console, les requêtes en échec et l'état réel
 *      du canevas (taille, nombre de repères, tracés dessinés),
 *   4. il enregistre une capture d'écran dans `.qa/carte.png`.
 *
 * Usage : `npm run preview` dans un terminal, puis `npm run qa:carte` dans un
 * autre. L'URL par défaut inclut la base GitHub Pages configurée dans
 * `vite.config.ts` ; on peut en passer une autre en argument.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const URL_SITE = process.argv[2] ?? 'http://localhost:4173/japan-2026/'
const PORT_DEVTOOLS = 9333

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]

const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function trouverNavigateur() {
  const trouve = CHROMES.find((chemin) => existsSync(chemin))
  if (!trouve) throw new Error('Aucun Chrome ni Edge trouvé : contrôle impossible.')
  return trouve
}

/** Le port DevTools met un instant à répondre après le lancement. */
async function attendreDevtools() {
  for (let essai = 0; essai < 60; essai += 1) {
    try {
      const reponse = await fetch(`http://127.0.0.1:${PORT_DEVTOOLS}/json/list`)
      const cibles = await reponse.json()
      const page = cibles.find((c) => c.type === 'page' && c.webSocketDebuggerUrl)
      if (page) return page
    } catch {
      // pas encore prêt
    }
    await attendre(250)
  }
  throw new Error('DevTools n’a pas répondu.')
}

/** Client CDP minimal : un compteur de messages, une promesse par requête. */
function clientCdp(socket) {
  let id = 0
  const attentes = new Map()
  const evenements = []

  socket.addEventListener('message', (message) => {
    const donnees = JSON.parse(message.data)
    if (donnees.id !== undefined) {
      const attente = attentes.get(donnees.id)
      attentes.delete(donnees.id)
      if (donnees.error) attente?.reject(new Error(donnees.error.message))
      else attente?.resolve(donnees.result)
    } else {
      evenements.push(donnees)
    }
  })

  const envoyer = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1
      attentes.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params }))
    })

  return { envoyer, evenements }
}

async function evaluer(cdp, expression) {
  const resultat = await cdp.envoyer('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (resultat.exceptionDetails) {
    throw new Error(resultat.exceptionDetails.exception?.description ?? 'évaluation échouée')
  }
  return resultat.result.value
}

async function main() {
  const navigateur = trouverNavigateur()
  const profil = join(tmpdir(), `qa-carte-${process.pid}`)
  mkdirSync(profil, { recursive: true })

  const processus = spawn(
    navigateur,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT_DEVTOOLS}`,
      `--user-data-dir=${profil}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1280,900',
      // WebGL logiciel : une machine sans GPU exploitable doit quand même pouvoir
      // rendre la carte, sinon le contrôle mesurerait la machine, pas le site.
      '--enable-unsafe-swiftshader',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  let code = 0
  try {
    const page = await attendreDevtools()
    const socket = new WebSocket(page.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve)
      socket.addEventListener('error', () => reject(new Error('WebSocket DevTools refusée')))
    })

    const cdp = clientCdp(socket)
    await cdp.envoyer('Runtime.enable')
    await cdp.envoyer('Log.enable')
    await cdp.envoyer('Network.enable')
    await cdp.envoyer('Page.enable')

    await cdp.envoyer('Page.navigate', { url: URL_SITE })

    // L'onglet « Carte » : on le désigne par son libellé, comme le ferait un
    // visiteur, plutôt que par une classe CSS. On patiente le temps que React
    // ait monté l'en-tête.
    let clique = false
    for (let essai = 0; essai < 40 && !clique; essai += 1) {
      await attendre(400)
      clique = await evaluer(
        cdp,
        `(() => {
          const bouton = [...document.querySelectorAll('.app-nav__item')]
            .find((b) => b.textContent.includes('Carte'))
          if (!bouton) return false
          bouton.click()
          return true
        })()`,
      )
    }
    if (!clique) {
      const page = await evaluer(
        cdp,
        `({
          url: location.href,
          titre: document.title,
          racine: document.getElementById('root')?.innerHTML.length ?? -1,
          corps: document.body.innerText.slice(0, 400),
        })`,
      )
      console.error('Page atteinte :', JSON.stringify(page, null, 2))
      for (const evenement of cdp.evenements) {
        if (evenement.method === 'Runtime.exceptionThrown') {
          console.error(
            '  exception :',
            evenement.params.exceptionDetails.exception?.description ??
              evenement.params.exceptionDetails.text,
          )
        }
        if (evenement.method === 'Log.entryAdded' && evenement.params.entry.level === 'error') {
          console.error('  journal   :', evenement.params.entry.text)
        }
        if (evenement.method === 'Network.loadingFailed') {
          console.error('  requête   :', evenement.params.errorText)
        }
      }
      throw new Error('Onglet « Carte » introuvable dans la navigation.')
    }

    // Laisser le temps au module, au style et aux premières tuiles — au-delà du
    // garde-fou de 12 s de MapView, pour voir aussi la bascule de secours.
    await attendre(16_000)

    const etat = await evaluer(
      cdp,
      `(() => {
        const canvas = document.querySelector('.map-canvas canvas')
        const shell = document.querySelector('.map-shell')
        return {
          shell: Boolean(shell),
          panne: Boolean(document.querySelector('.map-panne')),
          fondSecours: Boolean(document.querySelector('.map-avertissement')),
          chargement: document.querySelector('.map-loading')?.textContent?.trim() ?? null,
          suspense: document.querySelector('.app-main__loading')?.textContent?.trim() ?? null,
          canvas: canvas ? { w: canvas.width, h: canvas.height } : null,
          shellTaille: shell
            ? { w: Math.round(shell.getBoundingClientRect().width), h: Math.round(shell.getBoundingClientRect().height) }
            : null,
          reperes: document.querySelectorAll('.step-marker').length,
          legende: document.querySelectorAll('.legend__item').length,
          frise: document.querySelectorAll('.timeline__step').length,
        }
      })()`,
    )

    const interne = await evaluer(
      cdp,
      `(() => {
        const m = window.carteMapLibre
        if (!m) return 'window.carteMapLibre absent'
        const c = m.getCanvas()
        const conteneurVisible = document.querySelector('.map-canvas')
        return {
          styleLoaded: m.isStyleLoaded(),
          loaded: m.loaded(),
          zoom: Number(m.getZoom().toFixed(2)),
          centre: [Number(m.getCenter().lng.toFixed(3)), Number(m.getCenter().lat.toFixed(3))],
          canevas: [c.width, c.height],
          calques: m.getStyle()?.layers?.length ?? null,
          sources: Object.keys(m.getStyle()?.sources ?? {}),
          conteneurDansLeDocument: m.getContainer().isConnected,
          conteneurEstCeluiAffiche: m.getContainer() === conteneurVisible,
          enfantsDuConteneurAffiche: conteneurVisible?.children.length ?? -1,
          canevasDansLaPage: document.querySelectorAll('.maplibregl-canvas').length,
        }
      })()`,
    )
    console.log('\nÉtat interne MapLibre :', JSON.stringify(interne))

    const geometrie = await evaluer(
      cdp,
      `(() => {
        const decrire = (selecteur) => {
          const el = document.querySelector(selecteur)
          if (!el) return 'absent'
          const r = el.getBoundingClientRect()
          const s = getComputedStyle(el)
          return [
            Math.round(r.x) + ',' + Math.round(r.y),
            Math.round(r.width) + 'x' + Math.round(r.height),
            s.display, s.visibility, 'op=' + s.opacity, 'z=' + s.zIndex, s.position,
          ].join(' ')
        }
        return {
          '.map-canvas': decrire('.map-canvas'),
          '.maplibregl-canvas-container': decrire('.maplibregl-canvas-container'),
          '.maplibregl-canvas': decrire('.maplibregl-canvas'),
          '.maplibregl-ctrl-top-right': decrire('.maplibregl-ctrl-top-right'),
          '.step-marker': decrire('.step-marker'),
          'cssMapLibreChargee': getComputedStyle(document.querySelector('.maplibregl-canvas')).position,
        }
      })()`,
    )
    console.log('\nGéométrie :')
    for (const [cle, valeur] of Object.entries(geometrie)) {
      console.log(' ', cle.padEnd(32), valeur)
    }

    const erreursConsole = cdp.evenements
      .filter((e) => e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error')
      .map((e) => e.params.args.map((a) => a.value ?? a.description ?? a.type).join(' '))
    const exceptions = cdp.evenements
      .filter((e) => e.method === 'Runtime.exceptionThrown')
      .map((e) => e.params.exceptionDetails.exception?.description ?? e.params.exceptionDetails.text)
    const journal = cdp.evenements
      .filter((e) => e.method === 'Log.entryAdded' && e.params.entry.level === 'error')
      .map((e) => `${e.params.entry.source}: ${e.params.entry.text}`)
    const requetesRatees = cdp.evenements
      .filter((e) => e.method === 'Network.loadingFailed')
      .map((e) => e.params.errorText)

    // Tout ce que le navigateur a écrit dans la console, pas seulement les
    // erreurs : MapView y consigne le détail des pannes de fond de carte.
    const console_ = cdp.evenements
      .filter((e) => e.method === 'Runtime.consoleAPICalled')
      .map((e) => `${e.params.type}: ${e.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ')}`)

    // Requêtes vers le fournisseur de tuiles, avec leur code : c'est là qu'on
    // voit un sprite ou une police qui manque et qui bloque tout le style.
    const requetesEmises = new Map()
    for (const e of cdp.evenements) {
      if (e.method === 'Network.requestWillBeSent') {
        requetesEmises.set(e.params.requestId, { url: e.params.request.url, statut: 'en attente' })
      }
      if (e.method === 'Network.responseReceived') {
        const entree = requetesEmises.get(e.params.requestId)
        if (entree) entree.statut = String(e.params.response.status)
      }
      if (e.method === 'Network.loadingFailed') {
        const entree = requetesEmises.get(e.params.requestId)
        if (entree) entree.statut = `échec ${e.params.errorText}`
      }
    }
    const reseauCarte = [...requetesEmises.values()].filter((r) => r.url.includes('openfreemap'))

    const capture = await cdp.envoyer('Page.captureScreenshot', { format: 'png' })
    mkdirSync('.qa', { recursive: true })
    writeFileSync('.qa/carte.png', Buffer.from(capture.data, 'base64'))

    console.log('\n── Carte dans le navigateur ────────────────────────────────────')
    console.log('conteneur      :', etat.shellTaille ? `${etat.shellTaille.w}×${etat.shellTaille.h} px` : 'absent')
    console.log('canevas WebGL  :', etat.canvas ? `${etat.canvas.w}×${etat.canvas.h} px` : 'absent')
    console.log('repères posés  :', etat.reperes)
    console.log('légende        :', etat.legende, 'modes')
    console.log('frise          :', etat.frise, 'étapes')
    console.log('message visible:', etat.suspense ?? etat.chargement ?? 'aucun')
    console.log('fond de secours:', etat.fondSecours ? 'OUI' : 'non')
    console.log('panneau panne  :', etat.panne ? 'OUI' : 'non')
    console.log('capture        : .qa/carte.png')

    const problemes = []
    if (!etat.canvas) problemes.push('aucun canevas WebGL : la carte n’est pas dessinée.')
    if (etat.canvas && (etat.canvas.w === 0 || etat.canvas.h === 0)) {
      problemes.push('canevas de taille nulle : le conteneur n’a pas de hauteur.')
    }
    if (etat.reperes === 0) problemes.push('aucun repère d’étape : les calques ne sont pas installés.')
    if (etat.chargement) problemes.push(`message de chargement toujours affiché : « ${etat.chargement} ».`)
    if (etat.suspense) problemes.push(`module de la carte jamais chargé : « ${etat.suspense} ».`)
    if (etat.panne) problemes.push('panneau « carte indisponible » affiché.')

    for (const [titre, liste] of [
      ['Exceptions', exceptions],
      ['Erreurs de console', erreursConsole],
      ['Console', console_],
      ['Journal du navigateur', journal],
      ['Requêtes en échec', [...new Set(requetesRatees)]],
      [
        'Réseau — fournisseur de tuiles',
        reseauCarte.map((r) => `${r.statut.padEnd(16)} ${r.url}`),
      ],
    ]) {
      if (liste.length === 0) continue
      console.log(`\n${titre} :`)
      for (const ligne of liste.slice(0, 12)) console.log('  •', ligne)
    }

    if (problemes.length > 0) {
      console.log('\nProblèmes :')
      for (const probleme of problemes) console.log('  ✗', probleme)
      code = 1
    } else {
      console.log('\nLa carte se dessine, les repères et la légende sont en place.')
    }

    socket.close()
  } catch (erreur) {
    console.error('Contrôle de la carte impossible :', erreur.message)
    code = 1
  } finally {
    processus.kill()
  }

  process.exit(code)
}

await main()

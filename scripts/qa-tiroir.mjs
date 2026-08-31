/**
 * CONTRÔLE DU TIROIR DES ÉTAPES, SUR UN ÉCRAN DE TÉLÉPHONE.
 *
 * `qa-carte.mjs` ouvre la carte dans une fenêtre de bureau : il ne voit jamais le
 * tiroir. Celui-ci n'existe que sur écran empilé, ses trois hauteurs sont
 * calculées en JavaScript, et sa poignée se manœuvre au doigt — trois raisons
 * pour lesquelles ni le contrôle de rendu (hors navigateur) ni le contrôle de la
 * carte ne peuvent l'attester.
 *
 * On émule donc un téléphone (390×844, pointeur tactile), on ouvre la carte, et
 * on vérifie : la carte occupe toute la hauteur, le tiroir est bien posé
 * par-dessus, chaque appui sur la poignée fait grandir puis replier le tiroir, la
 * légende n'apparaît que sur demande, et une sélection entrouvre le tiroir.
 *
 * Le dernier contrôle tire la poignée avec de vrais événements tactiles, et pas
 * un `click()` : c'est le seul qui puisse attester que le geste s'arrête au palier
 * le plus proche sans déclencher *en plus* le cycle d'un simple appui.
 *
 * Usage : `npm run preview` dans un terminal, puis `node scripts/qa-tiroir.mjs`.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const URL_SITE = process.argv[2] ?? 'http://localhost:4173/japan-2026/'
const PORT_DEVTOOLS = 9334

/** iPhone 14 : le format le plus courant, et l'un des plus étroits. */
const ECRAN = { width: 390, height: 844 }

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]

const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

function clientCdp(socket) {
  let id = 0
  const attentes = new Map()
  socket.addEventListener('message', (message) => {
    const donnees = JSON.parse(message.data)
    if (donnees.id === undefined) return
    const attente = attentes.get(donnees.id)
    attentes.delete(donnees.id)
    if (donnees.error) attente?.reject(new Error(donnees.error.message))
    else attente?.resolve(donnees.result)
  })
  return {
    envoyer: (method, params = {}) =>
      new Promise((resolve, reject) => {
        id += 1
        attentes.set(id, { resolve, reject })
        socket.send(JSON.stringify({ id, method, params }))
      }),
  }
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

/** L'état visible du tiroir, mesuré sur les éléments réels. */
const RELEVE = `(() => {
  const cadre = document.querySelector('.view--carte')
  const tiroir = document.querySelector('.timeline-column')
  const carte = document.querySelector('.map-shell')
  const legende = document.querySelector('.legend')
  if (!cadre || !tiroir || !carte) return null
  const r = (el) => { const b = el.getBoundingClientRect(); return { h: Math.round(b.height), haut: Math.round(b.top) } }
  return {
    tiroirActif: cadre.classList.contains('view--carte-tiroir'),
    palier: tiroir.dataset.palier ?? null,
    cadre: r(cadre).h,
    carte: r(carte).h,
    tiroir: r(tiroir).h,
    tiroirHaut: r(tiroir).haut,
    legendeVisible: legende ? getComputedStyle(legende).display !== 'none' : false,
    etapesCliquables: [...document.querySelectorAll('.timeline__step-button')]
      .filter((b) => { const x = b.getBoundingClientRect(); return x.top >= r(tiroir).haut && x.bottom <= innerHeight }).length,
  }
})()`

const appuyer = (selecteur) => `(() => {
  const el = document.querySelector(${JSON.stringify(selecteur)})
  if (!el) return false
  el.click()
  return true
})()`

const echecs = []
function verifier(nom, condition, detail) {
  if (condition) console.log(`  ok    ${nom}`)
  else {
    console.log(`  ÉCHEC ${nom}${detail ? ` — ${detail}` : ''}`)
    echecs.push(nom)
  }
}

async function main() {
  const navigateur = CHROMES.find((chemin) => existsSync(chemin))
  if (!navigateur) throw new Error('Aucun Chrome ni Edge trouvé : contrôle impossible.')
  const profil = join(tmpdir(), `qa-tiroir-${process.pid}`)
  mkdirSync(profil, { recursive: true })

  const processus = spawn(
    navigateur,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT_DEVTOOLS}`,
      `--user-data-dir=${profil}`,
      '--no-first-run',
      '--no-default-browser-check',
      `--window-size=${ECRAN.width},${ECRAN.height}`,
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
    await cdp.envoyer('Page.enable')
    // Un vrai téléphone : écran étroit, pointeur grossier, pas de survol.
    await cdp.envoyer('Emulation.setDeviceMetricsOverride', {
      ...ECRAN,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await cdp.envoyer('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })

    await cdp.envoyer('Page.navigate', { url: URL_SITE })

    let clique = false
    for (let essai = 0; essai < 40 && !clique; essai += 1) {
      await attendre(400)
      clique = await evaluer(
        cdp,
        `(() => {
          const b = [...document.querySelectorAll('.app-nav__item')].find((b) => b.textContent.includes('Carte'))
          if (!b) return false
          b.click()
          return true
        })()`,
      )
    }
    if (!clique) throw new Error('Onglet « Carte » introuvable dans la navigation.')
    await attendre(6000)

    console.log(`\n── Écran ${ECRAN.width}×${ECRAN.height} ────────────────────────────────────\n`)

    const demi = await evaluer(cdp, RELEVE)
    if (!demi) throw new Error('Vue Carte absente.')
    console.log(`  relevé : ${JSON.stringify(demi)}`)
    verifier('le tiroir est actif sur écran étroit', demi.tiroirActif === true)
    verifier(
      'la carte occupe toute la hauteur de la vue',
      Math.abs(demi.carte - demi.cadre) <= 2,
      `carte ${demi.carte} px pour un cadre de ${demi.cadre} px`,
    )
    verifier('le tiroir s’ouvre à moitié par défaut', demi.palier === 'demi')
    verifier(
      'le tiroir couvre environ la moitié de l’écran',
      demi.tiroir > demi.cadre * 0.4 && demi.tiroir < demi.cadre * 0.62,
      `${demi.tiroir} px sur ${demi.cadre} px`,
    )
    // Une étape occupe ~90 px et son trajet ~60 px : à moitié ouvert, le tiroir
    // en montre deux entières. C'est le minimum utile — une seule ligne visible
    // ne dirait pas qu'il s'agit d'une liste.
    verifier(
      'au moins deux étapes entières sont visibles à moitié ouvert',
      demi.etapesCliquables >= 2,
      `${demi.etapesCliquables} étape(s) dans le champ`,
    )
    verifier('la légende ne mange pas la carte', demi.legendeVisible === false)

    await evaluer(cdp, appuyer('.timeline-column__prise'))
    await attendre(500)
    const plein = await evaluer(cdp, RELEVE)
    console.log(`  relevé : ${JSON.stringify(plein)}`)
    verifier('un appui sur la poignée ouvre en plein écran', plein.palier === 'plein')
    verifier(
      'le palier plein laisse un bandeau de carte',
      plein.tiroirHaut > 20 && plein.tiroir > demi.tiroir,
      `tiroir à ${plein.tiroirHaut} px du haut`,
    )
    verifier(
      'beaucoup plus d’étapes sont accessibles qu’à moitié',
      plein.etapesCliquables > demi.etapesCliquables,
      `${plein.etapesCliquables} contre ${demi.etapesCliquables}`,
    )

    await evaluer(cdp, appuyer('.timeline-column__prise'))
    await attendre(500)
    const replie = await evaluer(cdp, RELEVE)
    console.log(`  relevé : ${JSON.stringify(replie)}`)
    verifier('un nouvel appui replie le tiroir', replie.palier === 'replie')
    verifier(
      'replié, le tiroir ne garde que son en-tête',
      replie.tiroir < demi.cadre * 0.2,
      `${replie.tiroir} px`,
    )
    verifier(
      'replié, le titre du tiroir reste lisible',
      replie.tiroir > 40,
      `${replie.tiroir} px`,
    )

    await evaluer(cdp, appuyer('.timeline-column__filtres'))
    await attendre(300)
    const avecLegende = await evaluer(cdp, RELEVE)
    verifier('le bouton « Modes » ouvre la légende', avecLegende.legendeVisible === true)
    await evaluer(cdp, appuyer('.legend__fermer'))
    await attendre(300)
    verifier('la croix referme la légende', (await evaluer(cdp, RELEVE)).legendeVisible === false)

    // Une sélection depuis la carte doit entrouvrir un tiroir replié.
    await evaluer(cdp, appuyer('.step-marker'))
    await attendre(1200)
    const apresSelection = await evaluer(cdp, RELEVE)
    verifier(
      'taper un repère entrouvre le tiroir',
      apresSelection.palier === 'demi',
      `palier « ${apresSelection.palier} »`,
    )

    await evaluer(cdp, appuyer('.timeline-column__prise'))
    await attendre(400)
    await evaluer(cdp, appuyer('.timeline-column__prise'))
    await attendre(400)
    const avantGeste = await evaluer(cdp, RELEVE)
    verifier('le tiroir est bien replié avant le geste', avantGeste.palier === 'replie')

    /*
     * Le vrai geste, pas un `click()` : on pose un doigt sur la poignée et on le
     * tire vers le haut. C'est le seul moyen de vérifier que le glissement suit
     * le doigt puis s'arrête au palier le plus proche — et surtout qu'il ne
     * déclenche pas *en plus* le cycle d'un simple appui, ce qui ferait sauter le
     * tiroir d'un palier de trop.
     */
    const poignee = await evaluer(
      cdp,
      `(() => {
        const b = document.querySelector('.timeline-column__prise').getBoundingClientRect()
        return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }
      })()`,
    )
    const doigt = async (type, y) =>
      cdp.envoyer('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x: poignee.x, y }],
      })
    await doigt('touchStart', poignee.y)
    for (let y = poignee.y; y > poignee.y - 260; y -= 40) {
      await doigt('touchMove', y)
      await attendre(30)
    }
    await doigt('touchEnd', poignee.y - 260)
    await attendre(600)
    const apresGeste = await evaluer(cdp, RELEVE)
    console.log(`  relevé : ${JSON.stringify(apresGeste)}`)
    verifier(
      'tirer la poignée vers le haut ouvre le tiroir',
      apresGeste.tiroir > avantGeste.tiroir + 100,
      `${avantGeste.tiroir} px → ${apresGeste.tiroir} px`,
    )
    verifier(
      'le glissement s’arrête sur un palier, sans cycler en plus',
      apresGeste.palier === 'demi',
      `palier « ${apresGeste.palier} » (attendu « demi » : 260 px tirés depuis le repli)`,
    )


    if (!existsSync('.qa')) mkdirSync('.qa')
    const capturer = async (nom) => {
      const capture = await cdp.envoyer('Page.captureScreenshot', { format: 'png' })
      writeFileSync(`.qa/${nom}.png`, Buffer.from(capture.data, 'base64'))
      console.log(`  capture : .qa/${nom}.png`)
    }
    console.log('')
    await capturer('tiroir')
    // Et le panneau de légende ouvert : c'est lui qui occupait la place, avant.
    await evaluer(cdp, appuyer('.timeline-column__filtres'))
    await attendre(300)
    await capturer('tiroir-legende')

    if (echecs.length > 0) {
      console.error(`\n${echecs.length} contrôle(s) en échec.`)
      code = 1
    } else {
      console.log('\nLe tiroir des étapes se manœuvre correctement sur téléphone.')
    }
  } catch (erreur) {
    console.error(`\nContrôle impossible : ${erreur.message}`)
    code = 1
  } finally {
    processus.kill()
  }
  process.exit(code)
}

main()

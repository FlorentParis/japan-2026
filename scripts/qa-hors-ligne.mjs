/**
 * CONTRÔLE DU MODE HORS CONNEXION, DANS UN VRAI NAVIGATEUR.
 *
 * C'est le seul contrôle possible pour cette fonction : un service worker ne
 * s'exécute pas sous Node, et tout ce qui pourrait mal tourner — un fichier
 * oublié dans la liste de précache, un `Page.navigate` qui n'est pas intercepté,
 * une empreinte de version qui ne change pas — ne se voit qu'en coupant vraiment
 * le réseau. Un test qui se contenterait de relire `dist/sw.js` ne prouverait que
 * la présence de son propre texte.
 *
 * Le scénario est celui du voyage : on ouvre le site une fois avec du réseau
 * (l'installation, à la maison), on coupe (le train, le tunnel), on rouvre.
 *
 *   1. ouvre le site et attend que le service worker prenne les commandes,
 *   2. vérifie que le cache contient bien tout ce que le build a émis,
 *   3. coupe le réseau au niveau du navigateur,
 *   4. recharge la page et vérifie que le carnet s'affiche quand même — la
 *      navigation, le contenu réel d'une étape, et le bandeau qui prévient,
 *   5. enregistre une capture dans `.qa/hors-ligne.png`.
 *
 * Usage : `npm run preview` dans un terminal, puis `npm run qa:hors-ligne` dans un
 * autre. L'URL par défaut inclut la base configurée dans `vite.config.ts`.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const URL_SITE = process.argv[2] ?? 'http://localhost:4173/japan-2026/'
const PORT_DEVTOOLS = 9334

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

/** La liste que le service worker livré prétend mettre en cache. */
function coquilleAttendue() {
  const source = readFileSync(join(import.meta.dirname, '..', 'dist', 'sw.js'), 'utf8')
  const bloc = /const COQUILLE = (\[[^\]]*\])/.exec(source)
  if (!bloc) throw new Error('dist/sw.js : liste de précache introuvable. Le build a-t-il tourné ?')
  return JSON.parse(bloc[1])
}

const echecs = []
function verifier(condition, message, detail) {
  console.log(`  ${condition ? '✓' : '✗'} ${message}${detail === undefined ? '' : ` — ${detail}`}`)
  if (!condition) echecs.push(message)
}

async function main() {
  const attendue = coquilleAttendue()
  const navigateur = trouverNavigateur()
  const profil = join(tmpdir(), `qa-hors-ligne-${process.pid}`)
  mkdirSync(profil, { recursive: true })

  const processus = spawn(
    navigateur,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT_DEVTOOLS}`,
      // Profil neuf à chaque fois : un service worker déjà installé d'un build
      // précédent transformerait ce contrôle en illusion.
      `--user-data-dir=${profil}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=430,932',
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

    // ── 1. Première visite, avec réseau ───────────────────────────────────
    console.log(`\nPremière visite : ${URL_SITE}`)
    await cdp.envoyer('Page.navigate', { url: URL_SITE })

    let controle = null
    for (let essai = 0; essai < 60 && !controle; essai += 1) {
      await attendre(500)
      controle = await evaluer(
        cdp,
        `(async () => {
          if (!('serviceWorker' in navigator)) return null
          const reg = await navigator.serviceWorker.getRegistration()
          if (!reg?.active || !navigator.serviceWorker.controller) return null
          return { etat: reg.active.state, portee: reg.scope }
        })()`,
      )
    }
    verifier(controle !== null, 'le service worker prend les commandes', JSON.stringify(controle))
    if (!controle) throw new Error('Service worker jamais actif : la suite n’a plus de sens.')

    // ── 2. Le cache contient-il tout le site ? ────────────────────────────
    const cache = await evaluer(
      cdp,
      `(async () => {
        const noms = await caches.keys()
        const coquille = noms.find((n) => n.startsWith('carnet-coquille-'))
        if (!coquille) return { noms, entrees: null }
        const clefs = await (await caches.open(coquille)).keys()
        return {
          noms,
          coquille,
          entrees: clefs.map((r) => new URL(r.url).pathname),
        }
      })()`,
    )

    verifier(
      cache.entrees !== null,
      'un cache de coquille existe',
      cache.noms.join(', ') || 'aucun cache',
    )
    if (cache.entrees) {
      const base = new URL(URL_SITE).pathname
      const manquants = attendue
        .map((chemin) => base + chemin.replace('./', ''))
        .filter((chemin) => !cache.entrees.includes(chemin))
      verifier(
        manquants.length === 0,
        `les ${attendue.length} fichiers du build sont en cache`,
        manquants.length ? `manquent : ${manquants.join(', ')}` : `${cache.entrees.length} entrées`,
      )
    }

    // ── 3. Coupure du réseau ──────────────────────────────────────────────
    console.log('\nRéseau coupé.')
    await cdp.envoyer('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    })
    // Le temps que l'événement `offline` parvienne à React et que le bandeau
    // apparaisse — on le vérifie avant même de recharger.
    await attendre(1000)
    const bandeauAvant = await evaluer(
      cdp,
      `document.querySelector('.bandeau--hors-ligne')?.innerText.replace(/\\s+/g, ' ').trim() ?? null`,
    )
    verifier(
      typeof bandeauAvant === 'string' && bandeauAvant.includes('Hors connexion'),
      'le bandeau « hors connexion » apparaît sans recharger',
      bandeauAvant ? `« ${bandeauAvant.slice(0, 80)}… »` : 'absent',
    )

    // ── 4. Rechargement sans réseau : le vrai test ────────────────────────
    console.log('\nRechargement sans réseau…')
    await cdp.envoyer('Page.navigate', { url: URL_SITE })
    await attendre(4000)

    const etat = await evaluer(
      cdp,
      `(() => {
        const texte = document.body.innerText
        return {
          titre: document.title,
          racine: document.getElementById('root')?.innerHTML.length ?? -1,
          onglets: [...document.querySelectorAll('.app-nav__item')].map((b) => b.innerText.trim()),
          bandeau: Boolean(document.querySelector('.bandeau--hors-ligne')),
          // Deux repères pris dans les données, pas dans la coquille : ils
          // prouvent que c'est le carnet qui s'affiche, et pas une page d'erreur.
          mentionneTokyo: texte.includes('Tokyo'),
          mentionneNagasaki: texte.includes('Nagasaki'),
          erreurNavigateur: /ERR_|hors ligne|No internet/i.test(texte) && texte.length < 400,
        }
      })()`,
    )

    verifier(etat.racine > 5000, 'le site est rendu', `${etat.racine} caractères dans #root`)
    verifier(etat.onglets.length === 9, 'les 9 sections sont là', etat.onglets.join(' · '))
    verifier(etat.bandeau, 'le bandeau « hors connexion » est présent au chargement')
    verifier(
      etat.mentionneTokyo && etat.mentionneNagasaki,
      'les données du voyage sont lisibles (Tokyo, Nagasaki)',
    )
    verifier(!etat.erreurNavigateur, 'ce n’est pas la page d’erreur du navigateur')

    // Les autres sections doivent s'ouvrir aussi : elles sont dans des paquets
    // chargés à la demande, et c'est précisément ce qu'un précache incomplet
    // casserait — sans que la page d'accueil n'en laisse rien voir.
    const sections = await evaluer(
      cdp,
      `(async () => {
        const resultat = {}
        for (const nom of ['Itinéraire', 'Hôtels', 'Photos', 'Budget', 'Transports']) {
          const bouton = [...document.querySelectorAll('.app-nav__item')]
            .find((b) => b.innerText.trim().includes(nom))
          if (!bouton) { resultat[nom] = 'onglet absent'; continue }
          bouton.click()
          await new Promise((r) => setTimeout(r, 900))
          const vue = document.querySelector('.app-main')
          const attente = document.querySelector('.app-main__loading')
          resultat[nom] = attente
            ? 'bloqué sur « ' + attente.innerText.trim() + ' »'
            : (vue?.innerText.trim().length ?? 0)
        }
        return resultat
      })()`,
    )
    console.log('\nSections ouvertes hors connexion :')
    for (const [nom, valeur] of Object.entries(sections)) {
      const ok = typeof valeur === 'number' && valeur > 200
      verifier(ok, `section « ${nom} »`, typeof valeur === 'number' ? `${valeur} caractères` : valeur)
    }

    // ── 5. Capture ────────────────────────────────────────────────────────
    await evaluer(
      cdp,
      `[...document.querySelectorAll('.app-nav__item')]
        .find((b) => b.innerText.includes('Aujourd'))?.click()`,
    )
    await attendre(800)
    const capture = await cdp.envoyer('Page.captureScreenshot', { format: 'png' })
    mkdirSync(join(import.meta.dirname, '..', '.qa'), { recursive: true })
    const chemin = join(import.meta.dirname, '..', '.qa', 'hors-ligne.png')
    writeFileSync(chemin, Buffer.from(capture.data, 'base64'))
    console.log(`\nCapture : ${chemin}`)

    const exceptions = cdp.evenements
      .filter((e) => e.method === 'Runtime.exceptionThrown')
      .map((e) => e.params.exceptionDetails.exception?.description ?? e.params.exceptionDetails.text)
    if (exceptions.length > 0) {
      console.log('\nExceptions JavaScript :')
      for (const exception of exceptions) console.log('  ', String(exception).split('\n')[0])
    }
    verifier(exceptions.length === 0, 'aucune exception JavaScript')

    console.log(
      echecs.length === 0
        ? '\n✅ Le carnet est consultable hors connexion.'
        : `\n❌ ${echecs.length} contrôle(s) en échec :\n   - ${echecs.join('\n   - ')}`,
    )
    code = echecs.length === 0 ? 0 : 1
  } catch (erreur) {
    console.error('\n❌', erreur.message)
    code = 1
  } finally {
    processus.kill()
  }
  process.exit(code)
}

await main()

/**
 * CONTRÔLE DES PHOTOS DANS UN VRAI NAVIGATEUR.
 *
 * `qa-rendu` rend chaque vue en HTML hors navigateur : il voit qu'un `<img>` est
 * là, jamais que le fichier arrive. C'est exactement là que se cachait le bug
 * « certaines photos ne s'affichent pas » — le `srcSet` demandait des largeurs
 * (400, 800, 1600 px) que Wikimedia ne rend pas, et un navigateur qui trouve un
 * `srcSet` ignore l'attribut `src`. Le HTML avait l'air parfait.
 *
 * Ce script pilote Chrome en « headless » via le protocole DevTools, sans aucune
 * dépendance à installer, et vérifie quatre choses :
 *   1. les largeurs demandées existent bien chez Wikimedia (requêtes réelles) ;
 *   2. aucune image de la vue Photos n'échoue à charger ;
 *   3. la visionneuse s'ouvre, se parcourt à la souris et au clavier, se ferme ;
 *   4. l'itinéraire et la fiche d'étape de la carte portent bien un carrousel.
 *
 * Usage : `npm run preview` dans un terminal, puis `npm run qa:photos` dans un
 * autre. Une autre URL peut être passée en argument.
 *
 * Réseau : la vue Photos demande près de quatre cents fichiers à Wikimedia. À
 * travers un proxy d'entreprise, beaucoup restent en attente au moment du
 * relevé — ce n'est pas un échec, et le script distingue les deux.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const URL_SITE = process.argv[2] ?? 'http://localhost:4173/japan-2026/'
const PORT_DEVTOOLS = 9334

/** Le temps laissé aux images de la vue Photos avant le relevé. */
const DELAI_IMAGES_MS = 45_000

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
  for (let essai = 0; essai < 80; essai += 1) {
    try {
      const cibles = await (await fetch(`http://127.0.0.1:${PORT_DEVTOOLS}/json/list`)).json()
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

let anomalies = 0
function verifier(condition, message) {
  if (condition) {
    console.log(`ok     ${message}`)
  } else {
    anomalies += 1
    console.log(`ÉCHEC  ${message}`)
  }
}

async function main() {
  const navigateur = trouverNavigateur()
  const profil = join(tmpdir(), `qa-photos-${process.pid}`)
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
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  try {
    const page = await attendreDevtools()
    const socket = new WebSocket(page.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve)
      socket.addEventListener('error', () => reject(new Error('WebSocket DevTools refusée')))
    })

    const cdp = clientCdp(socket)
    await cdp.envoyer('Runtime.enable')
    await cdp.envoyer('Network.enable')
    await cdp.envoyer('Page.enable')
    await cdp.envoyer('Page.navigate', { url: URL_SITE })

    /** Clique un onglet par son libellé, comme le ferait un visiteur. */
    const ouvrirOnglet = async (libelle) => {
      for (let essai = 0; essai < 40; essai += 1) {
        await attendre(300)
        const clique = await evaluer(
          cdp,
          `(() => {
            const bouton = [...document.querySelectorAll('.app-nav__item')]
              .find((b) => b.textContent.includes(${JSON.stringify(libelle)}))
            if (!bouton) return false
            bouton.click()
            return true
          })()`,
        )
        if (clique) return
      }
      throw new Error(`Onglet « ${libelle} » introuvable dans la navigation.`)
    }

    // ── 1. Vue Photos : aucune image en échec ──────────────────────────────
    console.log('\n── Vue Photos ───────────────────────────────────────────────────')
    await ouvrirOnglet('Photos')
    // Les images sont en `loading="lazy"` : sans parcourir la page, on ne
    // mesurerait que le premier écran.
    await evaluer(
      cdp,
      `(async () => {
         for (let y = 0; y < document.body.scrollHeight; y += 600) {
           window.scrollTo(0, y)
           await new Promise((r) => setTimeout(r, 60))
         }
         window.scrollTo(0, 0)
       })()`,
    )
    await attendre(DELAI_IMAGES_MS)

    const photos = await evaluer(
      cdp,
      `(() => {
         const images = [...document.querySelectorAll('.gallery img')]
         const cassees = images.filter((i) => i.complete && i.naturalWidth === 0)
         return {
           total: images.length,
           chargees: images.filter((i) => i.naturalWidth > 0).length,
           enAttente: images.filter((i) => !i.complete).length,
           nbCassees: cassees.length,
           exemples: cassees.slice(0, 5).map((i) => i.currentSrc || i.src),
           // Largeurs que le navigateur a réellement retenues dans les srcSet.
           largeursRetenues: [...new Set(images
             .map((i) => (i.currentSrc.match(/\\/(\\d+)px-/) || [])[1])
             .filter(Boolean))].sort((a, b) => a - b),
         }
       })()`,
    )

    const idsEnEchec = new Set(
      cdp.evenements
        .filter((e) => e.method === 'Network.loadingFailed')
        .map((e) => e.params.requestId),
    )
    const urlsEnEchec = cdp.evenements
      .filter(
        (e) =>
          e.method === 'Network.requestWillBeSent' &&
          idsEnEchec.has(e.params.requestId) &&
          e.params.request.url.includes('wikimedia'),
      )
      .map((e) => e.params.request.url)
    const reponsesRefusees = cdp.evenements
      .filter(
        (e) =>
          e.method === 'Network.responseReceived' &&
          e.params.response.status >= 400 &&
          e.params.response.url.includes('wikimedia'),
      )
      .map((e) => `${e.params.response.status} ${e.params.response.url}`)

    console.log(
      `  ${photos.chargees}/${photos.total} chargées · ${photos.enAttente} encore en attente · ${photos.nbCassees} cassées`,
    )
    console.log(`  largeurs retenues par le navigateur : ${photos.largeursRetenues.join(', ')}`)
    for (const exemple of photos.exemples) console.log(`    cassée : ${exemple}`)
    for (const refus of reponsesRefusees.slice(0, 5)) console.log(`    refusée : ${refus}`)
    verifier(photos.total > 0, `la vue Photos contient des images (${photos.total})`)
    verifier(photos.nbCassees === 0, `aucune image cassée (${photos.nbCassees})`)
    verifier(
      reponsesRefusees.length === 0,
      `aucune réponse Wikimedia ≥ 400 (${reponsesRefusees.length})`,
    )
    if (urlsEnEchec.length > 0) {
      // Une requête abandonnée sans réponse est un symptôme réseau, pas une URL
      // fausse : on le signale sans faire échouer le contrôle.
      console.log(
        `  ${urlsEnEchec.length} requête(s) abandonnée(s) sans réponse — réseau ou proxy, pas l’URL.`,
      )
    }

    // ── 2. La visionneuse ──────────────────────────────────────────────────
    console.log('\n── Visionneuse ──────────────────────────────────────────────────')
    const visionneuse = await evaluer(
      cdp,
      `(async () => {
         const pause = () => new Promise((r) => setTimeout(r, 500))
         const bouton = document.querySelector('.gallery .photo__agrandir')
         if (!bouton) return { erreur: 'aucun bouton d’agrandissement dans la galerie' }
         bouton.click()
         await pause()
         const dialogue = document.querySelector('dialog.visionneuse')
         if (!dialogue?.open) return { erreur: 'le dialogue ne s’est pas ouvert' }
         const lire = () => ({
           compteur: dialogue.querySelector('.visionneuse__compteur')?.textContent.trim() ?? null,
           legende: dialogue.querySelector('.visionneuse__titre')?.textContent ?? null,
           credit: dialogue.querySelector('.visionneuse__credit')?.textContent.trim() ?? null,
           source: dialogue.querySelector('img')?.currentSrc ?? null,
         })
         const depart = lire()
         dialogue.querySelector('.visionneuse__fleche--apres').click()
         await pause()
         const suivante = lire()
         dialogue.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
         await pause()
         const clavier = lire()
         const image = dialogue.querySelector('img')
         const chargee = image?.naturalWidth > 0
         dialogue.querySelector('.visionneuse__fermer').click()
         await pause()
         return {
           depart, suivante, clavier, chargee,
           fermee: !document.querySelector('dialog.visionneuse'),
         }
       })()`,
    )
    if (visionneuse.erreur) {
      anomalies += 1
      console.log(`ÉCHEC  ${visionneuse.erreur}`)
    } else {
      console.log(`  ${visionneuse.depart.compteur}`)
      console.log(`  légende : ${visionneuse.depart.legende}`)
      console.log(`  crédit  : ${visionneuse.depart.credit}`)
      verifier(visionneuse.chargee, 'la photo agrandie est réellement chargée')
      verifier(
        visionneuse.suivante.compteur !== visionneuse.depart.compteur,
        `la flèche « suivante » avance (${visionneuse.depart.compteur} → ${visionneuse.suivante.compteur})`,
      )
      verifier(
        visionneuse.clavier.compteur === visionneuse.depart.compteur,
        'la flèche ← du clavier revient en arrière',
      )
      verifier(Boolean(visionneuse.depart.credit), 'l’auteur et la licence sont affichés')
      verifier(visionneuse.fermee, 'la fenêtre se referme')
    }

    // ── 3. Carrousels : itinéraire, puis fiche d'étape sur la carte ────────
    console.log('\n── Carrousels ───────────────────────────────────────────────────')
    await ouvrirOnglet('Itinéraire')
    // Le temps que `useGalerie` obtienne le morceau des galeries.
    await attendre(4000)
    // Deux sortes de carrousels partagent les mêmes classes : celui de la galerie
    // d'une étape (`dest-card__photo`) et celui des photos d'un hôtel réservé
    // (`hebergement__photos`). Les compter ensemble ferait échouer le contrôle
    // « un carrousel par étape » à chaque nouvelle réservation.
    const itineraire = await evaluer(
      cdp,
      `(() => {
         const compte = (selecteur) => {
           const carrousels = [...document.querySelectorAll(selecteur)]
           const vues = carrousels.map((c) => c.querySelectorAll('.carrousel__vue').length)
           return {
             nombre: carrousels.length,
             vuesMin: vues.length ? Math.min(...vues) : 0,
             vuesMax: vues.length ? Math.max(...vues) : 0,
             avecFleches: carrousels.filter((c) => c.querySelector('.carrousel__fleche')).length,
             cassees: [...document.querySelectorAll(selecteur + ' img')]
               .filter((i) => i.complete && i.naturalWidth === 0).length,
             // Une image hors cadre n'est pas chargée : c'est le chargement
             // paresseux qui fait son travail, pas une panne. Compté, pas jugé.
             chargees: [...document.querySelectorAll(selecteur + ' img')]
               .filter((i) => i.complete && i.naturalWidth > 0).length,
           }
         }
         return { etapes: compte('.carrousel.dest-card__photo'), hotels: compte('.carrousel.hebergement__photos') }
       })()`,
    )
    const etapes = itineraire.etapes
    console.log(
      `  itinéraire : ${etapes.nombre} carrousels de ${etapes.vuesMin} à ${etapes.vuesMax} photos`,
    )
    verifier(etapes.nombre === 18, `un carrousel par étape (${etapes.nombre}/18)`)
    verifier(etapes.vuesMin >= 2, `plusieurs photos par étape (minimum ${etapes.vuesMin})`)
    verifier(
      etapes.avecFleches === etapes.nombre,
      `chaque carrousel a ses flèches (${etapes.avecFleches}/${etapes.nombre})`,
    )
    verifier(etapes.cassees === 0, `aucune image cassée dans les carrousels (${etapes.cassees})`)

    // Les photos des hébergements réservés : elles ne viennent pas de Wikimedia
    // mais du serveur de l'établissement, et sont donc les plus susceptibles de
    // disparaître sans prévenir.
    const hotels = itineraire.hotels
    console.log(
      `  hébergements réservés : ${hotels.nombre} carrousel(s) de ${hotels.vuesMin} à ${hotels.vuesMax} photos` +
        ` · ${hotels.chargees} chargée(s) à l’écran`,
    )
    verifier(hotels.cassees === 0, `aucune photo d’hôtel cassée (${hotels.cassees})`)

    await ouvrirOnglet('Carte')
    await attendre(5000)
    const carte = await evaluer(
      cdp,
      `(async () => {
         const etape = document.querySelector('.timeline__step-button')
         if (!etape) return { erreur: 'aucune étape dans la frise' }
         etape.click()
         await new Promise((r) => setTimeout(r, 2500))
         const carrousel = document.querySelector('.timeline__step .carrousel.dest-card__photo')
         return {
           present: Boolean(carrousel),
           vues: carrousel?.querySelectorAll('.carrousel__vue').length ?? 0,
           fleches: Boolean(carrousel?.querySelector('.carrousel__fleche')),
         }
       })()`,
    )
    if (carte.erreur) {
      anomalies += 1
      console.log(`ÉCHEC  ${carte.erreur}`)
    } else {
      console.log(`  carte : fiche d’étape avec ${carte.vues} photos`)
      verifier(carte.present, 'la fiche ouverte sur la carte porte un carrousel')
      verifier(carte.vues >= 2, `plusieurs photos dans la fiche (${carte.vues})`)
      verifier(carte.fleches, 'ses flèches sont là')
    }

    // ── 4. Les largeurs demandées existent-elles chez Wikimedia ? ──────────
    // Le cœur du bug, vérifié pour de vrai sur un fichier du voyage. En dernier :
    // les trois largeurs fautives sont censées échouer, et ces échecs
    // fausseraient le relevé des requêtes ci-dessus.
    //
    // Par chargement d'image et non par `fetch` : une requête d'image n'est pas
    // soumise au CORS, et c'est de toute façon ainsi que le navigateur les
    // demandera. On mesure donc exactement ce qui compte.
    console.log('\n── Largeurs Wikimedia ───────────────────────────────────────────')
    const largeurs = await evaluer(
      cdp,
      `(async () => {
         const fichier = 'Matsumoto_Castle_Keep_Tower.jpg'
         const base = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/' + fichier
         const essayer = (taille) =>
           new Promise((resolve) => {
             const image = new Image()
             const minuterie = setTimeout(() => resolve('délai dépassé'), 20000)
             image.onload = () => { clearTimeout(minuterie); resolve('servie') }
             image.onerror = () => { clearTimeout(minuterie); resolve('refusée') }
             image.src = base + '/' + taille + 'px-' + fichier + '?qa=' + taille
           })
         const resultats = {}
         for (const taille of [120, 250, 330, 400, 500, 800, 960, 1280, 1600, 1920]) {
           resultats[taille] = await essayer(taille)
         }
         return resultats
       })()`,
    )
    console.log(
      `  ${Object.entries(largeurs)
        .map(([taille, etat]) => `${taille}px:${etat}`)
        .join(' · ')}`,
    )
    if (Object.values(largeurs).every((etat) => etat !== 'servie')) {
      console.log('  Wikimedia injoignable depuis ce poste : contrôle des largeurs ignoré.')
    } else {
      // Les tailles standard doivent être servies ; les autres doivent être
      // refusées — c'est ce second point qui justifie l'existence de la liste.
      for (const taille of [120, 250, 330, 500, 960, 1280, 1920]) {
        verifier(largeurs[taille] === 'servie', `taille standard ${taille}px servie`)
      }
      for (const taille of [400, 800, 1600]) {
        verifier(
          largeurs[taille] === 'refusée',
          `taille hors liste ${taille}px refusée, comme attendu (${largeurs[taille]})`,
        )
      }
    }

    mkdirSync(new URL('../.qa/', import.meta.url), { recursive: true })
    const capture = await cdp.envoyer('Page.captureScreenshot', { format: 'png' })
    writeFileSync(new URL('../.qa/photos.png', import.meta.url), Buffer.from(capture.data, 'base64'))
    console.log('\nCapture : .qa/photos.png')
    socket.close()
  } finally {
    processus.kill()
  }

  if (anomalies > 0) {
    console.log(`\n${anomalies} anomalie(s).`)
    process.exit(1)
  }
  console.log('\nLes photos s’affichent, la visionneuse et les carrousels fonctionnent.')
}

await main()

/**
 * CONTRÔLE DU ROUTAGE — l'adresse de la page dit-elle vraiment où l'on est ?
 *
 * Ce contrôle ne peut pas se faire ailleurs. `qa-rendu.mjs` rend les vues hors
 * navigateur, où il n'y a ni `location`, ni historique, ni bouton retour ; et
 * `tsc` ne voit rien d'un `pushState` mal placé. Or les trois choses que le
 * routage promet sont précisément des choses de navigateur :
 *
 * 1. l'adresse suit la navigation (on sait toujours quoi copier) ;
 * 2. une adresse partagée ouvre la bonne section, sélection comprise — et
 *    recharger la page n'y change rien ;
 * 3. le bouton retour défait la dernière navigation au lieu de quitter le site.
 *
 * Le troisième est celui qui justifie tout le reste, et le seul qu'on ne peut pas
 * vérifier « à l'œil » sans se tromper : c'est le geste que fait tout le monde sur
 * Android, et il fermait l'application.
 *
 * On vérifie aussi qu'une adresse inventée ne casse rien : un identifiant d'étape
 * inconnu doit ouvrir la section sans sélection, pas planter ni tout ramener à
 * l'accueil.
 *
 * Usage : `npm run preview` dans un terminal, puis `node scripts/qa-route.mjs`.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const URL_SITE = process.argv[2] ?? 'http://localhost:4173/japan-2026/'
const PORT_DEVTOOLS = 9335

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

/**
 * L'état visible, mesuré sur le DOM réel — jamais sur l'état interne de React.
 *
 * On lit la section sur l'onglet marqué courant et sur la classe de la coquille,
 * et la sélection là où elle se voit vraiment : l'étiquette du tiroir de la carte
 * (`.map-selection`) et le déplacement déplié de la liste des transports
 * (`.journey-list li.is-open`). Interroger React attesterait seulement que le
 * routage se parle à lui-même ; ici on relève ce que le lecteur a sous les yeux.
 *
 * À noter : la vue Itinéraire affiche les dix-huit fiches d'étape en permanence,
 * la sélection n'y change rien. Ce n'est donc pas là qu'on peut l'observer.
 */
const RELEVE = `(() => {
  const onglet = document.querySelector('.app-nav__item.is-current')
  const app = document.querySelector('.app')
  return {
    hash: location.hash,
    section: onglet ? onglet.textContent.trim() : null,
    vue: app ? [...app.classList].find((c) => c.startsWith('app--')) ?? null : null,
    tiroirCarte: document.querySelector('.map-selection span')?.textContent?.trim() ?? null,
    trajetOuvert:
      document.querySelector('.journey-list li.is-open .journey-list__label')?.textContent?.trim()
      ?? null,
    tronconsOuverts: document.querySelectorAll('.journey-list li.is-open').length,
  }
})()`

const cliquerOnglet = (label) => `(() => {
  const b = [...document.querySelectorAll('.app-nav__item')].find((b) => b.textContent.includes(${JSON.stringify(label)}))
  if (!b) return false
  b.click()
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
  const profil = join(tmpdir(), `qa-route-${process.pid}`)
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

    /**
     * Ouvre une adresse et attend que la navigation soit posée.
     *
     * Deux subtilités. D'abord, `Page.navigate` vers une adresse qui ne diffère
     * que par le fragment ne recharge pas le document : le navigateur émet un
     * `hashchange`, exactement comme un lien reçu par message. C'est ce que l'on
     * veut mesurer, mais cela signifie que la page est déjà rendue à l'instant où
     * l'on interroge — d'où l'attente sur le changement d'adresse, et non sur la
     * simple présence du rendu. Ensuite, l'adresse d'arrivée n'est pas toujours
     * celle demandée : le routage réécrit ce qu'il n'a pas su lire. On attend donc
     * « l'adresse a bougé, ou elle est déjà la bonne », pas une égalité stricte.
     */
    const aller = async (hash, { adresseInchangee = false } = {}) => {
      const avant = await evaluer(cdp, 'location.hash').catch(() => null)
      await cdp.envoyer('Page.navigate', { url: URL_SITE + hash })
      // Une adresse illisible est réparée en celle d'où l'on vient : elle ne
      // change donc pas, et il n'y a rien à attendre qu'un délai de repos.
      if (adresseInchangee) {
        await attendre(1500)
        return evaluer(cdp, RELEVE)
      }
      for (let essai = 0; essai < 40; essai += 1) {
        await attendre(300)
        const vu = await evaluer(cdp, RELEVE)
        if (!vu?.section) continue
        if (!hash || vu.hash !== avant || vu.hash === hash) return vu
      }
      throw new Error(`La page n’a pas fini de s’ouvrir sur « ${hash} ».`)
    }

    console.log('\n── L’adresse suit la navigation ────────────────────────────────\n')

    const accueil = await aller('')
    console.log(`  relevé : ${JSON.stringify(accueil)}`)
    // Le site est publié dans un sous-chemin de GitHub Pages : sans adresse, il
    // doit s'en écrire une, sinon il n'y a rien à copier ni à partager.
    verifier(
      'sans adresse, le site s’en écrit une',
      /^#\/[a-z]+$/.test(accueil.hash),
      `hash « ${accueil.hash} »`,
    )

    await evaluer(cdp, cliquerOnglet('Hôtels'))
    await attendre(500)
    const hotels = await evaluer(cdp, RELEVE)
    verifier(
      'changer de section change l’adresse',
      hotels.hash === '#/hotels' && hotels.vue === 'app--hotels',
      `hash « ${hotels.hash} », vue « ${hotels.vue} »`,
    )

    await evaluer(cdp, cliquerOnglet('Pratique'))
    await attendre(500)
    const pratique = await evaluer(cdp, RELEVE)
    verifier(
      'la fiche pratique a sa propre adresse',
      pratique.hash === '#/pratique',
      `hash « ${pratique.hash} »`,
    )
    verifier(
      'la fiche pratique affiche bien les deux numéros d’urgence',
      (await evaluer(
        cdp,
        `[...document.querySelectorAll('.vital__numero')].map((a) => a.textContent.trim()).join(',')`,
      )) === '110,119',
    )

    console.log('\n── Une adresse partagée ouvre la bonne page ────────────────────\n')

    const trajet = await aller('#/transports/trajet/j06')
    console.log(`  relevé : ${JSON.stringify(trajet)}`)
    verifier(
      'un lien vers un trajet ouvre la section Transports',
      trajet.vue === 'app--transports' && trajet.hash === '#/transports/trajet/j06',
      `vue « ${trajet.vue} », hash « ${trajet.hash} »`,
    )
    verifier(
      'et il déplie le déplacement désigné, un seul',
      trajet.tronconsOuverts === 1 && trajet.trajetOuvert !== null,
      `${trajet.tronconsOuverts} déplié(s) : « ${trajet.trajetOuvert} »`,
    )

    // Le rechargement passe par le même chemin de code que le partage, mais c'est
    // le geste que l'on fait dix fois par jour : il vaut son propre contrôle.
    await cdp.envoyer('Page.reload')
    await attendre(3000)
    const recharge = await evaluer(cdp, RELEVE)
    verifier(
      'recharger la page ne ramène pas à l’accueil',
      recharge.vue === 'app--transports' &&
        recharge.hash === '#/transports/trajet/j06' &&
        recharge.trajetOuvert === trajet.trajetOuvert,
      `vue « ${recharge.vue} », hash « ${recharge.hash} », déplié « ${recharge.trajetOuvert} »`,
    )

    // La carte est la seule vue chargée à la demande (`lazy`) : un lien qui la
    // désigne doit attendre son arrivée avant d'appliquer la sélection.
    const carte = await aller('#/carte/etape/kanazawa')
    for (let essai = 0; essai < 30 && !(await evaluer(cdp, RELEVE)).tiroirCarte; essai += 1) {
      await attendre(300)
    }
    const surCarte = await evaluer(cdp, RELEVE)
    console.log(`  relevé : ${JSON.stringify(surCarte)}`)
    verifier(
      'un lien vers une étape ouvre la carte sur cette étape',
      carte.vue === 'app--carte' && /Kanazawa/.test(surCarte.tiroirCarte ?? ''),
      `vue « ${carte.vue} », tiroir « ${surCarte.tiroirCarte} »`,
    )

    console.log('\n── Une adresse fausse ne casse rien ───────────────────────────\n')

    const inventee = await aller('#/transports/trajet/j99')
    console.log(`  relevé : ${JSON.stringify(inventee)}`)
    verifier(
      'un trajet inconnu ouvre quand même la bonne section',
      inventee.vue === 'app--transports',
      `vue « ${inventee.vue} »`,
    )
    verifier(
      'et la sélection fantôme est écartée, pas subie',
      inventee.tronconsOuverts === 0 && inventee.hash === '#/transports',
      `${inventee.tronconsOuverts} déplié(s), hash « ${inventee.hash} »`,
    )

    /*
     * Une section inconnue ne doit pas rester écrite dans la barre. C'est plus
     * qu'une coquetterie : l'adresse affichée est celle qu'on copie pour la
     * partager, et une adresse qui désigne une page où l'on n'est pas se
     * transmettrait telle quelle. On la répare donc sur place, en gardant la
     * section ouverte — une faute de frappe ne renvoie personne à l'accueil.
     */
    const inconnue = await aller('#/section-qui-nexiste-pas', { adresseInchangee: true })
    console.log(`  relevé : ${JSON.stringify(inconnue)}`)
    verifier(
      'une section inconnue ne reste pas écrite dans la barre',
      /^#\/[a-z]+$/.test(inconnue.hash) && inconnue.hash !== '#/section-qui-nexiste-pas',
      `hash « ${inconnue.hash} »`,
    )
    verifier(
      'et elle ne déplace pas le lecteur pour autant',
      inconnue.vue === `app--${inconnue.hash.slice(2)}`,
      `vue « ${inconnue.vue} » pour hash « ${inconnue.hash} »`,
    )

    console.log('\n── Le bouton retour ───────────────────────────────────────────\n')

    /*
     * Le contrôle qui justifie tout le fichier. On repart d'une page neuve pour
     * maîtriser l'historique, on navigue trois fois, puis on revient.
     *
     * `history.back()` et non un `click()` : c'est le bouton matériel d'Android
     * qu'on imite, et c'est lui qui quittait le site.
     */
    await aller('#/apercu')
    await evaluer(cdp, cliquerOnglet('Hôtels'))
    await attendre(400)
    await evaluer(cdp, cliquerOnglet('Budget'))
    await attendre(400)
    const avant = await evaluer(cdp, RELEVE)
    verifier('trois navigations conduisent bien au budget', avant.hash === '#/budget')

    await evaluer(cdp, 'history.back()')
    await attendre(700)
    const unRetour = await evaluer(cdp, RELEVE)
    console.log(`  relevé : ${JSON.stringify(unRetour)}`)
    verifier(
      'un retour revient à la section précédente, sans quitter le site',
      unRetour.hash === '#/hotels' && unRetour.vue === 'app--hotels',
      `hash « ${unRetour.hash} », vue « ${unRetour.vue} »`,
    )

    await evaluer(cdp, 'history.back()')
    await attendre(700)
    const deuxRetours = await evaluer(cdp, RELEVE)
    verifier(
      'un second retour remonte encore d’un cran',
      deuxRetours.hash === '#/apercu',
      `hash « ${deuxRetours.hash} »`,
    )

    await evaluer(cdp, 'history.forward()')
    await attendre(700)
    verifier(
      'le bouton suivant refait le chemin en sens inverse',
      (await evaluer(cdp, RELEVE)).hash === '#/hotels',
    )

    /*
     * Le geste attendu sur un téléphone : déplier un déplacement, puis le refermer
     * d'un retour — sans quitter la section où l'on était. C'est le cas qui
     * distingue un vrai historique d'un simple miroir de l'adresse.
     */
    await aller('#/transports')
    await evaluer(cdp, `document.querySelector('.journey-list__head')?.click()`)
    await attendre(600)
    const deplie = await evaluer(cdp, RELEVE)
    verifier(
      'déplier un déplacement écrit son adresse',
      /^#\/transports\/trajet\/.+/.test(deplie.hash) && deplie.tronconsOuverts === 1,
      `hash « ${deplie.hash} », ${deplie.tronconsOuverts} déplié(s)`,
    )

    await evaluer(cdp, 'history.back()')
    await attendre(700)
    const referme = await evaluer(cdp, RELEVE)
    verifier(
      'un retour le referme et laisse la section ouverte',
      referme.tronconsOuverts === 0 && referme.vue === 'app--transports',
      `${referme.tronconsOuverts} déplié(s), vue « ${referme.vue} »`,
    )

    console.log('')
    if (echecs.length > 0) {
      console.log(`${echecs.length} contrôle(s) en échec :`)
      for (const nom of echecs) console.log(`  — ${nom}`)
      code = 1
    } else {
      console.log('L’adresse, le rechargement et le bouton retour se comportent comme annoncé.')
    }
  } finally {
    processus.kill()
  }
  process.exit(code)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

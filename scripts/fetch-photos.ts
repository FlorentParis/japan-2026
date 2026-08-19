/**
 * Génère src/data/photos.generated.ts à partir de l'API Wikimedia Commons.
 *
 * Pourquoi un script : deviner des URLs Wikimedia à la main produit des images
 * cassées et des attributions fausses. Ici on interroge l'API, on récupère le
 * fichier réel + son auteur + sa licence, et on écrit le tout dans un module TS.
 *
 * Pourquoi il lit `src/data/destinations.ts` au lieu d'avoir sa propre liste :
 * une activité déclare sa recherche d'image (`photoQuery`) à côté de son nom, et
 * sa photo est enregistrée sous son propre identifiant. Il n'y a donc jamais deux
 * listes à garder synchronisées — l'erreur classique de ce genre de générateur,
 * où l'on renomme une activité et où sa photo reste orpheline.
 *
 * Usage : npm run photos
 *   Derrière un proxy d'entreprise qui déchiffre le TLS :
 *   NODE_EXTRA_CA_CERTS=.certs/proxy.pem npm run photos
 */
import { writeFile } from 'node:fs/promises'

import { DESTINATIONS } from '../src/data/destinations'
import { TRIP } from '../src/data/trip'

/**
 * Article Wikipedia (en) servant de photo de tête, par identifiant d'étape.
 *
 * Ces images-là sont choisies par les contributeurs de l'encyclopédie comme
 * représentatives du sujet : elles valent mieux qu'un premier résultat de
 * recherche. Le reste de la galerie passe, lui, par la recherche Commons.
 */
const ARTICLES_DE_TETE: Record<string, string> = {
  tokyo: 'Tokyo',
  matsumoto: 'Matsumoto_Castle',
  kamikochi: 'Kamikōchi',
  takayama: 'Takayama,_Gifu',
  shirakawago: 'Shirakawa,_Gifu_(village)',
  kanazawa: 'Kenroku-en',
  toyama: 'Toyama_Castle',
  tateyama: 'Tateyama_Kurobe_Alpine_Route',
  omachi: 'Ōmachi,_Nagano',
  nagano: 'Zenkō-ji',
  kurashiki: 'Kurashiki',
  hiroshima: 'Hiroshima_Peace_Memorial',
  naoshima: 'Naoshima,_Kagawa',
  takamatsu: 'Ritsurin_Garden',
  matsuyama: 'Matsuyama_Castle_(Iyo)',
  fukuoka: 'Fukuoka',
  nagasaki: 'Nagasaki',
}

/** Nombre de photos visé par étape. En dessous, le script le signale. */
const GALERIE_MINIMUM = 9

const UA = 'voyage-japon-planner/1.0 (personal trip site; contact: local)'

type Photo = {
  url: string
  width: number
  height: number
  file: string
  author: string
  license: string
  sourcePage: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** L'API Wikimedia rate-limite agressivement : on réessaie en espaçant. */
async function api(base: string, params: Record<string, string>, attempt = 0): Promise<any> {
  const url = `${base}?${new URLSearchParams({ format: 'json', ...params })}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (res.status === 429 && attempt < 5) {
    await sleep(2000 * 2 ** attempt)
    return api(base, params, attempt + 1)
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

/** Nettoie le HTML que Commons renvoie dans extmetadata (Artist, LicenseShortName…). */
const strip = (html: unknown) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Ce qu'on ne veut pas voir dans une galerie de voyage : cartes, schémas,
 * blasons, affiches, captures d'écran. La recherche Commons les remonte
 * volontiers parce que leur description contient le nom du lieu.
 */
const REJETS = [
  /\b(map|mapa|karte|kaart|carte)\b/i,
  /\b(plan|blueprint|diagram|chart|graph|scheme)\b/i,
  /\b(logo|emblem|seal|crest|coat[ _]of[ _]arms|flag|banner|icon)\b/i,
  /\b(poster|leaflet|brochure|ticket|timetable|stamp|postcard|advertisement)\b/i,
  /\b(screenshot|scan|document|manuscript|newspaper|portrait[ _]of)\b/i,
  /\b(monument[ _]to|grave|tombstone|memorial[ _]tablet)\b/i,
  // Une gravure ou une aquarelle du XIXᵉ siècle n'est pas une photo du plat ni du
  // lieu : la recherche « Muscat of Alexandria » remontait une planche botanique.
  /\b(engraving|illustration|drawing|painting|woodcut|lithograph|sketch|etching)\b/i,
  // Photo d'emballage sur fond blanc : la série « PNr° » de Commons en compte des
  // milliers, et elle sortait un pot de miso viennois au habanero en tête de la
  // recherche « miso ». Un produit sous plastique n'illustre pas un plat.
  /\bPNr\b/i,
]

/** Une image utilisable : assez grande, pas un panorama filiforme, pas un schéma. */
function acceptable(photo: Photo): boolean {
  if (photo.width < 800) return false
  const ratio = photo.width / photo.height
  if (ratio > 3.2 || ratio < 0.4) return false
  return !REJETS.some((rejet) => rejet.test(photo.file))
}

/**
 * Mots trop courants pour identifier un sujet : présents dans des milliers de
 * noms de fichiers, ils ne prouvent rien sur le contenu de l'image.
 */
const GENERIQUES = new Set([
  'japan', 'japanese', 'food', 'dish', 'plate', 'street', 'museum', 'city', 'park',
  'garden', 'station', 'view', 'shop', 'store', 'market', 'temple', 'shrine',
  'castle', 'onsen', 'town', 'village', 'island', 'mount', 'mountain', 'river',
  'with', 'from', 'this', 'that', 'sugar', 'noodles', 'sashimi', 'rice',
])

/**
 * Le mot le plus spécifique d'une recherche : le premier qui ne soit pas
 * générique.
 */
function motCle(query: string): string | undefined {
  const mots = sansAccents(query).match(/[a-z]{4,}/g) ?? []
  return mots.find((mot) => !GENERIQUES.has(mot))
}

function sansAccents(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

/**
 * Garde-fou de pertinence : le nom du fichier doit contenir le mot-clé de la
 * recherche.
 *
 * Sans lui, l'API répond « Sashimi of São Paulo » à une recherche
 * « Nigirizushi », « Billyfoodmabodofu » à « Tofu » et un pot de miso viennois au
 * habanero à « Miso » : des images qui ne montrent pas ce que leur légende
 * annoncerait. Le prix à payer, ce sont quelques photos correctes écartées parce
 * que leur nom est en japonais ou latin scientifique — et une entrée sans image
 * plutôt qu'une entrée avec la mauvaise. C'est le sens du projet.
 */
function pertinent(photo: Photo, cle: string | undefined): boolean {
  return cle === undefined || sansAccents(photo.file).includes(cle)
}

function versPhoto(info: any, title: string): Photo | undefined {
  if (!info) return undefined
  const meta = info.extmetadata ?? {}
  // thumburl à 1600 px : évite de servir des originaux de 20 Mo.
  // On retire les paramètres utm que l'API colle aux URLs.
  const url = String(info.thumburl ?? info.url).replace(/\?utm_.*$/, '')
  // Commons annonce `thumbwidth: 1600` mais renvoie parfois la taille standard
  // immédiatement supérieure — une URL en « 1920px- ». La largeur qui compte est
  // celle de l'image réellement servie, sinon on enregistrerait une dimension
  // que le fichier n'a pas.
  const largeurReelle = Number(/\/(\d+)px-/.exec(url)?.[1])
  const largeurAnnoncee = info.thumbwidth ?? info.width
  const facteur = largeurReelle ? largeurReelle / largeurAnnoncee : 1
  return {
    file: title.replace(/^File:/, ''),
    url,
    width: largeurReelle || largeurAnnoncee,
    height: Math.round((info.thumbheight ?? info.height) * facteur),
    // Certains crédits traînent la marque de l'appareil photo : on coupe.
    author: strip(meta.Artist?.value).split(' This photo')[0] || 'Auteur non précisé',
    license: strip(meta.LicenseShortName?.value) || 'voir la page source',
    sourcePage: info.descriptionurl,
  }
}

/** Une seule requête pour tous les articles -> image de tête de chacun. */
async function fichiersDeTete(articles: string[]) {
  const data = await api('https://en.wikipedia.org/w/api.php', {
    action: 'query',
    prop: 'pageimages',
    piprop: 'original|name',
    redirects: '1',
    titles: articles.join('|'),
  })
  const parArticle = new Map<string, string>()
  // `normalized` et `redirects` permettent de retrouver le titre demandé.
  const alias = new Map<string, string>()
  for (const n of data.query.normalized ?? []) alias.set(n.to, n.from)
  for (const r of data.query.redirects ?? []) alias.set(r.to, alias.get(r.from) ?? r.from)
  for (const page of Object.values<any>(data.query.pages)) {
    const demande = alias.get(page.title) ?? page.title
    if (page.pageimage) parArticle.set(demande.replace(/ /g, '_'), `File:${page.pageimage}`)
  }
  return parArticle
}

/** Une seule requête pour un lot de fichiers -> URL + auteur + licence. */
async function infosCommons(fileTitles: string[]) {
  const parFichier = new Map<string, Photo>()
  // L'API plafonne à 50 titres par requête.
  for (let i = 0; i < fileTitles.length; i += 50) {
    const data = await api('https://commons.wikimedia.org/w/api.php', {
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1600',
      titles: fileTitles.slice(i, i + 50).join('|'),
    })
    for (const page of Object.values<any>(data.query?.pages ?? {})) {
      const photo = versPhoto(page?.imageinfo?.[0], page.title)
      // Commons renvoie les titres avec des espaces là où on a envoyé des underscores.
      if (photo) parFichier.set(page.title.replace(/ /g, '_'), photo)
    }
  }
  return parFichier
}

/**
 * Recherche Commons : `filetype:bitmap` écarte d'emblée les SVG et les PDF, et
 * `generator=search` permet de récupérer URL, auteur et licence dans la même
 * requête. On ne devine aucun nom de fichier.
 *
 * `exigerPertinence` n'est vrai que pour les sujets nommés — une activité, une
 * spécialité. Là, l'image sera affichée sous une légende (« Sushi edomae ») : elle
 * doit donc porter le sujet dans son nom de fichier, sinon la légende mentirait.
 * Les recherches d'appoint d'une galerie, elles, n'annoncent rien de précis et
 * gardent le filtre large : un nom japonais ou translittéré autrement (« Zenko-ji »
 * pour « Zenkoji ») y resterait sinon sur le carreau pour rien.
 */
async function rechercher(query: string, limite: number, exigerPertinence = false): Promise<Photo[]> {
  const data = await api('https://commons.wikimedia.org/w/api.php', {
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6',
    gsrlimit: String(limite),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1600',
  })
  const pages = Object.values<any>(data.query?.pages ?? {})
  // L'ordre des clés d'un objet JSON ne suit pas le classement par pertinence :
  // `index` le restitue.
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  const cle = exigerPertinence ? motCle(query) : undefined
  return pages
    .map((page) => versPhoto(page?.imageinfo?.[0], page.title))
    .filter(
      (photo): photo is Photo =>
        photo !== undefined && acceptable(photo) && pertinent(photo, cle),
    )
}

// ── Collecte ────────────────────────────────────────────────────────────────

/** Photos nommées, adressées par identifiant d'étape, d'activité ou de spécialité. */
const photos = new Map<string, Photo>()
/** Galeries, par identifiant d'étape. */
const galeries = new Map<string, Photo[]>()
/** Un même fichier ne doit apparaître qu'une fois dans tout le site. */
const dejaPris = new Set<string>()
const rapport: string[] = []

const ajouter = (destId: string, photo: Photo) => {
  if (dejaPris.has(photo.file)) return false
  dejaPris.add(photo.file)
  const galerie = galeries.get(destId) ?? []
  galerie.push(photo)
  galeries.set(destId, galerie)
  return true
}

// 1. Photos de tête, depuis les articles Wikipedia.
const articles = [...new Set(Object.values(ARTICLES_DE_TETE))]
const tetes = await fichiersDeTete(articles)
const infosTetes = await infosCommons([...new Set(tetes.values())])
for (const [destId, article] of Object.entries(ARTICLES_DE_TETE)) {
  const fichier = tetes.get(article)
  const photo = fichier ? infosTetes.get(fichier) : undefined
  if (!photo) {
    rapport.push(`✗ tête ${destId} — rien trouvé pour l’article ${article}`)
    continue
  }
  photos.set(destId, photo)
}

// 2. Activités, spécialités et galeries, étape par étape.
for (const dest of DESTINATIONS) {
  // La photo de tête ouvre la galerie de l'étape. Deux étapes peuvent partager
  // la même (les deux séjours à Tokyo) : `dejaPris` la laisse à la première, et
  // la seconde s'appuie sur ses propres recherches.
  const tete = dest.photoId ? photos.get(dest.photoId) : undefined
  if (tete) ajouter(dest.id, tete)

  const sujets = [
    ...dest.activities.map((a) => ({ id: a.id, query: a.photoQuery, quoi: 'activité' })),
    ...(dest.specialities ?? []).map((s) => ({ id: s.id, query: s.photoQuery, quoi: 'spécialité' })),
  ]

  for (const sujet of sujets) {
    if (!sujet.query) continue
    // On demande plusieurs résultats pour survivre au filtrage et à la
    // déduplication : la première image acceptable devient celle du sujet, les
    // suivantes garnissent la galerie de l'étape.
    const trouvees = await rechercher(sujet.query, 12, true)
    let retenue: Photo | undefined
    for (const photo of trouvees) {
      if (dejaPris.has(photo.file)) continue
      if (!retenue) {
        retenue = photo
        photos.set(sujet.id, photo)
      }
      ajouter(dest.id, photo)
      // Deux images par sujet suffisent à remplir les galeries sans les noyer.
      if ((galeries.get(dest.id)?.length ?? 0) >= GALERIE_MINIMUM + 6) break
    }
    if (!retenue) {
      rapport.push(`✗ ${sujet.quoi} ${sujet.id} — aucune image exploitable pour « ${sujet.query} »`)
    }
  }

  // 3. Recherches d'appoint, pour atteindre le minimum de la galerie.
  for (const query of dest.galleryQueries ?? []) {
    if ((galeries.get(dest.id)?.length ?? 0) >= GALERIE_MINIMUM + 3) break
    for (const photo of await rechercher(query, 10)) ajouter(dest.id, photo)
  }

  const compte = galeries.get(dest.id)?.length ?? 0
  const marque = compte >= GALERIE_MINIMUM ? '✓' : '!'
  if (compte < GALERIE_MINIMUM) {
    rapport.push(
      `! galerie ${dest.id} — ${compte} photo(s) seulement, ajouter des « galleryQueries »`,
    )
  }
  console.log(`${marque} ${dest.id.padEnd(14)} ${String(compte).padStart(2)} photos de galerie`)
}

// ── Écriture ────────────────────────────────────────────────────────────────

const enTS = (photo: Photo) => `{
    url: ${JSON.stringify(photo.url)},
    width: ${photo.width},
    height: ${photo.height},
    file: ${JSON.stringify(photo.file)},
    author: ${JSON.stringify(photo.author)},
    license: ${JSON.stringify(photo.license)},
    sourcePage: ${JSON.stringify(photo.sourcePage)},
  }`

const ENTETE = `// GÉNÉRÉ par scripts/fetch-photos.ts — ne pas éditer à la main.
// Relancer : npm run photos
// Chaque entrée porte son auteur et sa licence : l'attribution est affichée dans
// l'UI sous chaque image, comme l'exigent les licences Commons.
import type { Photo } from '../types'
`

/**
 * Deux fichiers et non un seul, et c'est délibéré : `PHOTOS` sert dès la première
 * page (bandeau, vignettes d'activités), tandis que `GALLERIES` ne sert qu'à la
 * vue Photos, chargée à la demande. Les garder ensemble ferait télécharger les
 * quatre cents images de galerie à tout visiteur qui ouvre l'aperçu.
 * `GALLERY_COUNTS` est le pont : dix-huit nombres suffisent pour afficher
 * « 21 photos du lieu » sans embarquer les galeries.
 */
const corpsPhotos = `${ENTETE}
/** Photo d'un sujet nommé : étape (photoId), activité ou spécialité (leur id). */
export const PHOTOS: Record<string, Photo> = {
${[...photos].map(([id, photo]) => `  ${JSON.stringify(id)}: ${enTS(photo)},`).join('\n')}
}

/** Taille de la galerie de chaque étape, sans en charger le contenu. */
export const GALLERY_COUNTS: Record<string, number> = {
${[...galeries].map(([destId, liste]) => `  ${JSON.stringify(destId)}: ${liste.length},`).join('\n')}
}
`

const corpsGaleries = `${ENTETE}
/**
 * Galerie de chaque étape, dans l'ordre où elle doit s'afficher.
 *
 * N'importer que depuis du code chargé à la demande (la vue Photos) : ce fichier
 * pèse à lui seul plus que le reste des données du voyage.
 */
export const GALLERIES: Record<string, Photo[]> = {
${[...galeries]
  .map(([destId, liste]) => `  ${JSON.stringify(destId)}: [\n    ${liste.map(enTS).join(',\n    ')},\n  ],`)
  .join('\n')}
}
`

await writeFile(new URL('../src/data/photos.generated.ts', import.meta.url), corpsPhotos)
await writeFile(new URL('../src/data/galleries.generated.ts', import.meta.url), corpsGaleries)

console.log(`\n${photos.size} photos nommées, ${dejaPris.size} fichiers distincts au total.`)
// La photo du bandeau d'accueil est la seule dont l'absence casse une page
// entière : elle vaut un contrôle à part.
if (!photos.has(TRIP.heroPhotoId)) {
  rapport.push(`✗ bandeau d’accueil — « ${TRIP.heroPhotoId} » n’a pas de photo (voir TRIP.heroPhotoId)`)
}
if (rapport.length > 0) {
  console.log(`\n${rapport.length} point(s) à regarder :`)
  for (const ligne of rapport) console.log(`  ${ligne}`)
} else {
  console.log('Aucun trou : chaque sujet a une image, chaque galerie atteint le minimum.')
}
console.log('\n→ écrit dans src/data/photos.generated.ts et src/data/galleries.generated.ts')

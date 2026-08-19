/**
 * Génère src/data/photos.generated.ts à partir de l'API Wikimedia Commons.
 *
 * Pourquoi un script : deviner des URLs Wikimedia à la main produit des images
 * cassées et des attributions fausses. Ici on interroge l'API, on récupère le
 * fichier réel + son auteur + sa licence, et on écrit le tout dans un module TS.
 *
 * Usage : node scripts/fetch-photos.mjs
 */
import { writeFile } from 'node:fs/promises'

/** Article Wikipedia (en) -> image de tête, choisi pour être représentatif de l'étape. */
const SOURCES = [
  { id: 'tokyo', article: 'Tokyo' },
  { id: 'matsumoto', article: 'Matsumoto_Castle' },
  { id: 'kamikochi', article: 'Kamikōchi' },
  { id: 'takayama', article: 'Takayama,_Gifu' },
  { id: 'shirakawago', article: 'Shirakawa,_Gifu_(village)' },
  { id: 'kanazawa', article: 'Kenroku-en' },
  { id: 'toyama', article: 'Toyama_Castle' },
  { id: 'tateyama', article: 'Tateyama_Kurobe_Alpine_Route' },
  { id: 'nagano', article: 'Zenkō-ji' },
  { id: 'kurashiki', article: 'Kurashiki' },
  { id: 'hiroshima', article: 'Hiroshima_Peace_Memorial' },
  { id: 'naoshima', article: 'Naoshima,_Kagawa' },
  { id: 'takamatsu', article: 'Ritsurin_Garden' },
  { id: 'matsuyama', article: 'Matsuyama_Castle_(Iyo)' },
  { id: 'fukuoka', article: 'Fukuoka' },
  { id: 'nagasaki', article: 'Nagasaki' },
]

const UA = 'voyage-japon-planner/1.0 (personal trip site; contact: local)'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** L'API Wikimedia rate-limite agressivement : on regroupe les titres et on réessaie. */
async function api(base, params, attempt = 0) {
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
const strip = (html) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

/** Une seule requête pour tous les articles -> image de tête de chacun. */
async function leadFiles(articles) {
  const data = await api('https://en.wikipedia.org/w/api.php', {
    action: 'query',
    prop: 'pageimages',
    piprop: 'original|name',
    redirects: '1',
    titles: articles.join('|'),
  })
  const byTitle = new Map()
  // `normalized` et `redirects` permettent de retrouver le titre demandé.
  const alias = new Map()
  for (const n of data.query.normalized ?? []) alias.set(n.to, n.from)
  for (const r of data.query.redirects ?? []) alias.set(r.to, alias.get(r.from) ?? r.from)
  for (const page of Object.values(data.query.pages)) {
    const requested = alias.get(page.title) ?? page.title
    if (page.pageimage) byTitle.set(requested.replace(/ /g, '_'), `File:${page.pageimage}`)
  }
  return byTitle
}

/** Une seule requête pour tous les fichiers -> URL + auteur + licence. */
async function commonsInfos(fileTitles) {
  const data = await api('https://commons.wikimedia.org/w/api.php', {
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1600',
    titles: fileTitles.join('|'),
  })
  const byFile = new Map()
  for (const page of Object.values(data.query.pages)) {
    const info = page?.imageinfo?.[0]
    if (!info) continue
    const meta = info.extmetadata ?? {}
    // Commons renvoie les titres avec des espaces là où on a envoyé des underscores.
    byFile.set(page.title.replace(/ /g, '_'), {
      file: page.title.replace(/^File:/, ''),
      // thumburl à 1600 px : évite de servir des originaux de 20 Mo.
      // On retire les paramètres utm que l'API colle aux URLs.
      url: (info.thumburl ?? info.url).replace(/\?utm_.*$/, ''),
      width: info.thumbwidth ?? info.width,
      height: info.thumbheight ?? info.height,
      // Certains crédits traînent la marque de l'appareil photo : on coupe.
      author: strip(meta.Artist?.value).split(' This photo')[0] || 'Auteur non précisé',
      license: strip(meta.LicenseShortName?.value) || 'voir la page source',
      sourcePage: info.descriptionurl,
    })
  }
  return byFile
}

const leads = await leadFiles(SOURCES.map((s) => s.article))
const infos = await commonsInfos([...new Set(leads.values())])

const out = []
for (const { id, article } of SOURCES) {
  const file = leads.get(article)
  const info = file && infos.get(file)
  if (!info) {
    console.error(`✗ ${id.padEnd(12)} rien trouvé pour ${article}`)
    out.push({ id, article, error: 'introuvable' })
    continue
  }
  out.push({ id, article, ...info })
  console.log(`✓ ${id.padEnd(12)} ${info.file}`)
}

const ok = out.filter((p) => !p.error)
const body = `// GÉNÉRÉ par scripts/fetch-photos.mjs — ne pas éditer à la main.
// Relancer : node scripts/fetch-photos.mjs
// Chaque entrée porte son auteur et sa licence : l'attribution est affichée dans l'UI.
import type { Photo } from '../types'

export const PHOTOS: Record<string, Photo> = {
${ok
  .map(
    (p) => `  ${p.id}: {
    url: ${JSON.stringify(p.url)},
    width: ${p.width},
    height: ${p.height},
    file: ${JSON.stringify(p.file)},
    author: ${JSON.stringify(p.author)},
    license: ${JSON.stringify(p.license)},
    sourcePage: ${JSON.stringify(p.sourcePage)},
  },`,
  )
  .join('\n')}
}
`
await writeFile(new URL('../src/data/photos.generated.ts', import.meta.url), body)
console.log(`\n→ ${ok.length}/${out.length} photos écrites dans src/data/photos.generated.ts`)

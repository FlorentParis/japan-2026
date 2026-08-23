/**
 * PHOTOS DES HÉBERGEMENTS RÉSERVÉS.
 *
 * ⚠️ C'est la seule exception photographique du site, et elle est délibérée.
 * Partout ailleurs les images viennent de Wikimedia Commons sous licence libre,
 * choisies par `scripts/fetch-photos.ts`. Ici, non : ce sont les photos que
 * l'établissement publie lui-même de ses murs et de ses chambres. Aucun fonds
 * libre ne montre l'intérieur d'un hôtel de quartier, et une image « d'ambiance »
 * prise ailleurs serait exactement la donnée inventée que ce projet refuse.
 *
 * Conséquences assumées :
 * ▸ ces images ne sont **pas** libres de droits. Elles sont **liées** à leur
 *   serveur d'origine, jamais recopiées : aucun fichier sous droits n'entre dans
 *   le dépôt ni dans `dist/`. Le carnet est privé et n'est pas publié.
 * ▸ `author` porte le nom de l'établissement et `license` la nature du droit
 *   d'usage à défaut de licence. `Figure` affiche ce crédit sous chaque image, en
 *   lien vers la page source — même règle que pour Commons.
 * ▸ `npm run photos` ne touche pas à ce fichier : il est écrit à la main, ce qui
 *   est tenable pour un hébergement réservé de temps en temps.
 * ▸ `jeuDeSources()` ne rend rien pour ces URL (elles ne suivent pas le motif de
 *   vignette de Commons) : les images sont servies telles quelles, sans `srcSet`.
 *   D'où le carrousel plutôt qu'une grille — `loading="lazy"` ne charge que la
 *   vue affichée.
 *
 * DEUX RÈGLES QUI ONT DÉCIDÉ DE TOUT CE QUI SUIT
 *
 * 1. `width` et `height` sont **mesurés**, jamais estimés — l'attribut sert à
 *    réserver la place avant l'arrivée du fichier, et un rapport faux fait sauter
 *    la mise en page. Chaque établissement les donne autrement : Tabist et Toyoko
 *    Inn publient les dimensions à côté de l'image, les deux petits hébergements
 *    servent des fichiers dont la taille a été relevée sur le fichier lui-même.
 *    Aucune valeur ci-dessous n'a été devinée à l'œil.
 *
 * 2. La légende d'une photo est la **catégorie que la source lui donne**
 *    (`room`/`facility`, 外観/客室/朝食, 和室/半露天風呂…), et rien d'autre. Décrire
 *    ce qu'on croit voir sur l'image serait broder. Quand la source ne dit rien —
 *    le cas de Takayama, en fin de fichier —, la seule chose affirmable reste que
 *    l'établissement publie cette image de lui-même : le sujet est alors
 *    « établissement », le mot le plus large et le seul qu'on puisse tenir.
 *
 * 3. Aucune de ces images n'est redimensionnée par nous : ce sont les fichiers que
 *    l'établissement sert, à la taille où il les sert. Toyoko Inn a un
 *    redimensionneur, Rakuten n'en a pas — d'où des photos de 6 000 px pour
 *    Takayama, seul jeu vraiment lourd du carnet. `loading="lazy"` limite la
 *    facture aux vues effectivement regardées.
 */
import type { Photo } from '../types'

/**
 * Ce que la source dit du sujet d'une photo, et rien de plus.
 *
 * Les catégories viennent du JSON de l'établissement (`room`, `facility`) : c'est
 * la seule légende défendable, comme le nom de fichier l'est pour Commons.
 * Décrire ce qu'on croit voir sur l'image serait broder.
 */
export type SujetHebergement = 'chambre' | 'établissement'

export type PhotoHebergement = Photo & { sujet: SujetHebergement }

// ─── Tokyo · Tabist Urban Stays Asakusa ──────────────────────────────────────
//
// Comment relever à nouveau ces valeurs : ouvrir la page officielle de
// l'établissement (`sourcePage`), qui porte un bloc JSON listant ses photos avec
// leur catégorie et leurs dimensions réelles, sur le serveur
// `…/property_photos/<code de l'établissement>/`. Les largeurs et hauteurs
// ci-dessous en sont recopiées, pas mesurées à l'œil — y compris le 1921 px de
// `df4e6059.jpg`, tel que la source le donne.

const TABIST_ASAKUSA = 'https://tabist.co.jp/en/h/B13HUSA'
const TABIST_ASAKUSA_PHOTOS =
  'https://tabist-public-prod.s3.ap-northeast-1.amazonaws.com/property_photos/B13HUSA/'

/** Fabrique une entrée à partir du nom de fichier chez l'établissement. */
const tabistAsakusa = (
  file: string,
  sujet: SujetHebergement,
  width = 1920,
  height = 1440,
): PhotoHebergement => ({
  url: `${TABIST_ASAKUSA_PHOTOS}${file}`,
  width,
  height,
  file,
  author: 'Tabist Urban Stays Asakusa',
  license: 'photo de l’établissement',
  sourcePage: TABIST_ASAKUSA,
  sujet,
})

// ─── Matsumoto · Toyoko Inn Matsumoto Ekimae Hommachi ────────────────────────
//
// La chaîne sert ses images par un redimensionneur : `?width=N` rend le fichier
// à la largeur demandée, sans jamais l'agrandir au-delà de l'original. D'où les
// 1 280 px demandés partout — et les 900 px de la photo du petit-déjeuner, dont
// l'original ne fait pas plus large. Les hauteurs ci-dessous sont celles que le
// serveur rend effectivement à cette largeur.
//
// La page japonaise (`/search/detail/00102/`) est la seule à légender sa galerie
// (外観, 客室 エコノミーシングル, 朝食) : c'est elle qui a fourni les catégories,
// la page anglaise ne les traduit pas. Trois photos retenues sur six. Les trois
// écartées ne montrent pas l'hôtel — « ホテル周辺 » (les alentours), « その他 »
// (les sources du « Matsumoto yūsuigun ») et « 観光 » (un musée de Tateshina, à
// 60 km) : même règle que pour Asakusa, dont les photos de quartier sont déjà
// couvertes par la galerie Commons de l'étape.

const TOYOKO_MATSUMOTO = 'https://www.toyoko-inn.com/eng/search/detail/00102/'

const toyokoMatsumoto = (
  /** Identifiant du fichier chez le redimensionneur de la chaîne. */
  file: string,
  sujet: SujetHebergement,
  width: number,
  height: number,
): PhotoHebergement => ({
  url: `https://toyoko-inn.imagewave.pictures/${file}?width=1280`,
  width,
  height,
  file,
  author: 'Toyoko Inn Matsumoto Ekimae Hommachi',
  license: 'photo de l’établissement',
  sourcePage: TOYOKO_MATSUMOTO,
  sujet,
})

// ─── Kamikōchi (Sawando) · Tabibito no Yado Tomoshibi ───────────────────────
//
// Site officiel de l'établissement, écrit à la main : les images sont rangées par
// page et par section, et c'est le titre de la section qui donne la catégorie —
// « 個室タイプの和室 » et « 相部屋（ライダーハウス） » sur la page des
// installations, « 半露天風呂 » et « 内湯 » sur celle du bain. Le chemin du
// fichier (`facilities/…`, `spa/…`) sert d'identifiant : `sec1_pic1.png` seul
// existe dans les deux dossiers.

const TOMOSHIBI = 'https://onsenyamagoya-tomoshibi.com/'

const tomoshibi = (
  /** Chemin sous `/img/`, qui dit aussi de quelle page vient la photo. */
  file: string,
  sujet: SujetHebergement,
  width: number,
  height: number,
): PhotoHebergement => ({
  url: `${TOMOSHIBI}img/${file}`,
  width,
  height,
  file,
  author: '信州上高地 旅人の宿 ともしび',
  license: 'photo de l’établissement',
  sourcePage: TOMOSHIBI,
  sujet,
})

// ─── Takayama · Yutoria Resort Hida Takayama ────────────────────────────────
//
// Le seul jeu qui ne vienne pas d'un site d'établissement : l'hôtel était encore
// en pré-ouverture en août 2026 et n'avait pas de site à lui. Ses photos sont
// celles de sa fiche Rakuten Travel, c'est-à-dire les mêmes que renvoie une
// recherche d'images — mais liées ici à la fiche qui les publie, seule source
// citable, plutôt qu'à la copie redimensionnée d'un agrégateur, dont les URL sont
// signées et expirent.
//
// Deux limites, portées ici plutôt que masquées :
// ▸ la fiche ne légende aucune de ses photos. Le sujet est donc « établissement »
//   pour les cinq : c'est le seul fait — l'hôtel publie cette image de lui-même.
//   Deviner laquelle montre une chambre serait exactement la règle 2 enfreinte.
// ▸ Rakuten ne sert que les originaux. Ni `?_ex=`, ni chemin `/large/`, ni préfixe
//   de redimensionnement ne répondent (testés, 404) : ce sont donc 2 000 à
//   6 024 px de large qui arrivent au navigateur. Le carrousel de Takayama est le
//   plus lourd du carnet, et il n'y a pas d'autre version à demander.
//
// À remplacer dès que l'établissement ouvre un site : la clé et le `photosId` sont
// déjà en place, seules les URL et les catégories changeraient.

const YUTORIA = 'https://travel.rakuten.co.jp/HOTEL/197430/197430.html'
const YUTORIA_PHOTOS = 'https://trvimg.r10s.jp/share/image_up/197430/origin/'

const yutoria = (
  /** Nom du fichier chez Rakuten, empreinte comprise : c'est son seul identifiant. */
  file: string,
  width: number,
  height: number,
): PhotoHebergement => ({
  url: `${YUTORIA_PHOTOS}${file}`,
  width,
  height,
  file,
  author: 'Yutoria Resort Hida Takayama',
  license: 'photo de l’établissement',
  sourcePage: YUTORIA,
  // Pas de paramètre `sujet` sur cette fabrique, contrairement aux autres : la
  // source n'en propose aucun, et laisser le choix ouvert inviterait à le deviner.
  sujet: 'établissement',
})

// ─── Shirakawa-gō · GuestHouse Shirakawa-Go INN ─────────────────────────────
//
// Site officiel du « 白川郷アクティビティーセンター o8 », qui exploite la maison
// d'hôtes. Ses photos sont nommées en clair chez lui — « Single Bed Room 2025 »,
// « ラウンジ① 2025 », « フロントデスクNEW » — et chacune porte en plus une légende
// dans la page. Le nom est donc à la fois l'identifiant et la catégorie, comme
// sur Commons.
//
// Le nom est écrit ici en clair et encodé à la construction de l'URL : ces
// fichiers portent des espaces, des idéogrammes et un « ① », qu'un littéral
// pré-encodé rendrait illisible et impossible à recouper avec la page.

const SHIRAKAWA_O8 = 'https://www.shirakawa-o8.com/guesthouse/'
const SHIRAKAWA_O8_PHOTOS = 'https://sb2-cms.com/files/images/user/5336/'

const shirakawaGoInn = (
  file: string,
  sujet: SujetHebergement,
  width: number,
  height: number,
): PhotoHebergement => ({
  url: `${SHIRAKAWA_O8_PHOTOS}${encodeURIComponent(file)}`,
  width,
  height,
  file,
  author: 'GuestHouse Shirakawa-Go INN',
  license: 'photo de l’établissement',
  sourcePage: SHIRAKAWA_O8,
  sujet,
})

/**
 * Les photos d'un hébergement, par `Accommodation.photosId`.
 *
 * L'ordre est celui de la source : la première photo ouvre le carrousel, et c'est
 * celle que l'établissement met en avant chez lui.
 */
export const PHOTOS_HEBERGEMENT: Record<string, PhotoHebergement[]> = {
  // Sélection : les catégories `facility` et `room` de la source dont le JSON
  // donne les dimensions. Écartées volontairement — les images dont le sujet est
  // le quartier et non l'hôtel (Asakusa et le Skytree sont déjà couverts par la
  // galerie Commons de l'étape) et les panneaux d'horaires, illisibles à cette
  // taille. Les treize retenues ont été regardées une à une : chacune montre bien
  // le bâtiment, ses parties communes ou une chambre.
  //
  // La première est celle que l'établissement désigne comme photo principale
  // (`selection: "MAIN"`) : elle ouvre donc le carrousel.
  'tabist-urban-stays-asakusa': [
    tabistAsakusa('62d96be7.jpg', 'établissement'),
    tabistAsakusa('aa75da2f.jpg', 'chambre'),
    tabistAsakusa('0e408cd8.jpg', 'chambre'),
    tabistAsakusa('d7260fe4.jpg', 'chambre'),
    tabistAsakusa('1d54fc0d.jpg', 'chambre'),
    tabistAsakusa('a658663d.jpg', 'chambre'),
    tabistAsakusa('5a6ef73b.jpg', 'établissement'),
    tabistAsakusa('df4e6059.jpg', 'établissement', 1921),
    tabistAsakusa('0b5b3a2e.jpg', 'établissement'),
    tabistAsakusa('bd18b402.jpg', 'établissement'),
    tabistAsakusa('ab992c88.jpg', 'établissement'),
    tabistAsakusa('f50c3ba6.jpg', 'établissement'),
    tabistAsakusa('f2d040ef.jpg', 'établissement'),
  ],

  // Ordre de la galerie de la chaîne : 外観, puis 客室, puis 朝食.
  'toyoko-inn-matsumoto-ekimae-hommachi': [
    toyokoMatsumoto('3tCCCuvGgzqHzmDpT6cYtf', 'établissement', 1280, 1920),
    toyokoMatsumoto('VHctKPjKf4d8ojoWuGi72i', 'chambre', 1280, 719),
    // 朝食 : l'original ne fait que 900 px de large, le redimensionneur ne
    // l'agrandit pas.
    toyokoMatsumoto('CSB4xdFaaon9VdmiYBpeiL', 'établissement', 900, 994),
  ],

  // Les deux sortes de couchage d'abord (和室, puis ライダーハウス), le bain
  // ensuite : c'est l'ordre des pages du site.
  'tomoshibi-sawando': [
    tomoshibi('facilities/sec1_pic1.png', 'chambre', 940, 600),
    tomoshibi('facilities/sec1_pic2.png', 'chambre', 940, 600),
    tomoshibi('facilities/sec2_pic1.png', 'chambre', 940, 600),
    tomoshibi('spa/sec1_slider1.jpg', 'établissement', 500, 350),
    tomoshibi('spa/sec2_pic2.png', 'établissement', 940, 600),
  ],

  // Les cinq photos de la fiche, dans son ordre — la première est celle qu'elle
  // met en avant. Elle en annonce douze autres derrière un bouton que seul le
  // JavaScript de la page ouvre : elles ne sont pas atteignables, et cinq suffisent.
  // Dimensions relevées sur chaque fichier, une à une : elles vont du simple 2 000
  // px au 6 024 px, aucun format commun à déduire.
  'yutoria-resort-hida-takayama': [
    yutoria('4f2b7eaebe54d46969a0a2f849a37c4eb2eadb48.47.9.26.3.jpg', 5000, 3340),
    yutoria('c9bda7c95c1bd95e1cbe12727a930e5083e3e06c.47.9.26.3.jpg', 2000, 1125),
    yutoria('b65198c1ad08f3c588f4ce32cd9338be09095e00.47.9.26.3.jpg', 6024, 4024),
    yutoria('1a03fb265aef81e539fc52462ae10ef802c31e4e.47.9.26.3.jpg', 6024, 4024),
    yutoria('7df22b3557de43c654acf6903e937e0a5f55bd22.47.9.26.3.jpg', 6024, 4024),
  ],

  // Ordre de la page : les deux chambres, puis les parties communes.
  'shirakawa-go-inn': [
    shirakawaGoInn('Single Bed Room 2025.jpg', 'chambre', 2268, 1701),
    shirakawaGoInn('Twin Beds Room 2025①.jpg', 'chambre', 2268, 1701),
    shirakawaGoInn('counter.png', 'établissement', 950, 584),
    shirakawaGoInn('ラウンジ①　2025.jpg', 'établissement', 2268, 1701),
    shirakawaGoInn('フロントデスクNEW.jpg', 'établissement', 2268, 1701),
  ],
}

/** Les photos d'un hébergement, ou un tableau vide : jamais celles d'un autre. */
export function photosHebergement(photosId?: string): PhotoHebergement[] {
  return (photosId ? PHOTOS_HEBERGEMENT[photosId] : undefined) ?? []
}

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

// ─── Kanazawa · Arigato Stay Kanazawa Katamachi ─────────────────────────────
//
// Deuxième jeu qui ne vient pas d'un site d'établissement, après Takayama :
// l'hôtel n'a pas de site propre et sa fiche sur l'annuaire des hôteliers de
// Kanazawa est la seule page qui publie ses photos. Elle porte un bloc JSON-LD
// (`schema.org`, un `Hotel` et 79 `ImageObject`) : c'est de là que viennent les
// chemins ci-dessous, pas d'une lecture du balisage.
//
// Trois décisions à garder en tête si on y revient :
// ▸ La fiche ne légende aucune photo — ni catégorie, ni titre : seulement un
//   numéro d'ordre. Comme pour Takayama, le sujet est donc « établissement » pour
//   les neuf, et la fabrique n'a pas de paramètre `sujet` : la règle 2 interdit de
//   nommer ce qu'on croit voir.
// ▸ L'annuaire a un redimensionneur (`/data/Photos/1024x768w/…`, qui répond en
//   WebP sous une URL en `.JPEG`, 21 à 226 kB au lieu de 77 à 503 kB). Il n'est
//   pourtant pas utilisé : il **recadre** au format 4/3 au lieu de réduire. La
//   photo 1, portrait de 1241 × 1579, en revient en 1024 × 768 — l'enseigne
//   coupée. Ce sont donc les originaux qui sont liés, comme partout ailleurs dans
//   ce fichier.
// ▸ Neuf photos retenues sur 79. Les soixante-dix écartées ne montrent pas
//   l'hôtel : la fiche remplit sa galerie de vues de Kanazawa — Kenroku-en, le
//   marché Ōmichō, Higashi Chaya-gai, la gare — déjà couvertes par la galerie
//   Commons de l'étape, et bien mieux. Les neuf gardées ont été regardées une à
//   une : façade, chambres, salle de bain, hall, réception, laverie.
//
// Les dimensions sont mesurées sur chaque fichier (marqueur SOFn de l'en-tête
// JPEG), une à une : elles vont de 940 à 2 880 px, aucun format commun à déduire.

const ARIGATO_KATAMACHI =
  'https://www.kanazawahotels.net/fr/property/trend-kanazawakatamachi.html'
const ARIGATO_KATAMACHI_PHOTOS = 'https://www.kanazawahotels.net/data/Photos/OriginalPhoto/'

const arigatoKatamachi = (
  /**
   * Chemin sous `OriginalPhoto/`, dossiers compris : ils diffèrent d'une photo à
   * l'autre et ne se déduisent pas du numéro — ils viennent tels quels du JSON-LD.
   */
  file: string,
  width: number,
  height: number,
): PhotoHebergement => ({
  url: `${ARIGATO_KATAMACHI_PHOTOS}${file}`,
  width,
  height,
  file,
  author: 'Arigato Stay Kanazawa Katamachi',
  license: 'photo de l’établissement',
  sourcePage: ARIGATO_KATAMACHI,
  // Comme pour Yutoria : pas de paramètre `sujet`, la source n'en donne aucun.
  sujet: 'établissement',
})

// ─── Les deux fiches Agoda : Toyama et Shinano-Ōmachi ───────────────────────
//
// Troisième source qui n'est pas un site d'établissement, et la première commune
// à deux hébergements — d'où une fabrique partagée. Les deux chaînes ont bien un
// site, mais aucun des deux n'est lisible : `apahotel.com` répond 403 à tout ce
// qui n'est pas un navigateur ordinaire (Akamai, jusqu'à un vrai Chrome piloté),
// et Route Inn ne publie pas de galerie de l'établissement sur sa fiche. La page
// de réservation est donc la seule qui montre ces deux hôtels.
//
// Ce que ça implique, et qui vaut pour les deux sections qui suivent :
// ▸ Le redimensionneur d'Agoda **ne recadre pas** : `?s=1024x` ne fixe que la
//   largeur et garde le rapport de chaque photo — vérifié fichier par fichier,
//   0 recadrée sur 35 et sur 24. C'est donc l'inverse du redimensionneur de
//   l'annuaire de Kanazawa (`1024x768w`, plus haut), et le même comportement que
//   `?width=` chez Toyoko Inn. On demande 1 024 px là où les originaux font
//   1 280 à 2 048 px : 27 à 134 kB par vue au lieu de plusieurs centaines.
// ▸ Le chemin porte l'identifiant de la propriété (`285940`, `13868604`) et ses
//   paramètres d'origine (`va`, `ca`, `ce`), recopiés tels quels. Cet identifiant
//   est ce qui garantit qu'on ne prend pas les photos d'un autre hôtel : la page
//   sert aussi des carrousels de recommandations, sous d'autres identifiants.
// ▸ La fiche ne légende aucune photo — pas de catégorie, pas de titre, seulement
//   un ordre d'affichage. Comme pour Takayama et Kanazawa, le sujet est donc
//   « établissement » partout et la fabrique n'a pas de paramètre `sujet`.
// ▸ Les dimensions sont mesurées sur chaque fichier tel que le redimensionneur le
//   rend (marqueur SOFn de l'en-tête JPEG) : 1 024 × 560 à 1 024 × 768, la hauteur
//   change d'une photo à l'autre et ne se déduit pas.
// ▸ `sourcePage` est l'URL de la fiche sans ses paramètres de suivi (`cid`, `ds`) :
//   ils identifient l'affilié qui a amené le clic, pas la page.

/** Largeur demandée au redimensionneur d'Agoda, pour les deux fiches. */
const LARGEUR_AGODA = 1024

/**
 * Fabrique commune aux deux fiches : les mécaniques sont identiques, seuls le nom
 * de l'établissement et la page changent.
 */
const agoda =
  (author: string, sourcePage: string) =>
  (
    /**
     * Chemin complet chez le serveur d'images, identifiant de propriété et
     * paramètres compris, `s=` exclu : il est recopié de la page, jamais reconstruit.
     */
    chemin: string,
    width: number,
    height: number,
  ): PhotoHebergement => ({
    url: `https://pix8.agoda.net/${chemin}&s=${LARGEUR_AGODA}x`,
    width,
    height,
    // L'empreinte du fichier : la seule partie du chemin qui identifie la photo —
    // le dossier qui la précède change d'un envoi à l'autre pour un même fichier.
    file: chemin.replace(/^.*\//, '').replace(/\?.*$/, ''),
    author,
    license: 'photo de l’établissement',
    sourcePage,
    sujet: 'établissement',
  })

// ─── Toyama · APA Hotel Toyama-Ekimae-Minami ────────────────────────────────
//
// L'adresse de la fiche garde l'ancien nom de l'hôtel (`apa-villa-hotel-toyama-
// ekimae`) alors que son titre annonce « APA Hotel Toyama-Ekimae Minami » : c'est
// la même bascule de nom que celle relevée dans OpenStreetMap et documentée à
// l'étape de Toyama. Une confirmation de plus, arrivée par une autre source.
const apaToyama = agoda(
  'APA Hotel Toyama-Ekimae-Minami',
  'https://www.agoda.com/fr-fr/apa-villa-hotel-toyama-ekimae/hotel/toyama-jp.html',
)

// ─── Shinano-Ōmachi · Hotel Route-Inn Shinano-Ōmachi Ekimae ─────────────────
const routeInnOmachi = agoda(
  'Hotel Route-Inn Shinano-Ōmachi Ekimae',
  'https://www.agoda.com/fr-fr/hotel-route-inn-shinano-omachi-ekimae/hotel/omachi-jp.html',
)

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

  // Ordre des numéros de la source, qui est aussi celui de sa galerie : la façade
  // et son enseigne d'abord, les chambres ensuite, les parties communes après.
  'arigato-stay-kanazawa-katamachi': [
    arigatoKatamachi('17230/1723037/1723037265/photo-arigato-stay-kanazawa-katamachi-kanazawa-1.JPEG', 1241, 1579),
    arigatoKatamachi('17432/1743229/1743229590/photo-arigato-stay-kanazawa-katamachi-kanazawa-3.JPEG', 2000, 1335),
    arigatoKatamachi('17432/1743229/1743229601/photo-arigato-stay-kanazawa-katamachi-kanazawa-5.JPEG', 2000, 1335),
    arigatoKatamachi('17432/1743229/1743229540/photo-arigato-stay-kanazawa-katamachi-kanazawa-12.JPEG', 2000, 1125),
    arigatoKatamachi('17230/1723037/1723037270/photo-arigato-stay-kanazawa-katamachi-kanazawa-19.JPEG', 1653, 1240),
    arigatoKatamachi('17230/1723037/1723037273/photo-arigato-stay-kanazawa-katamachi-kanazawa-20.JPEG', 2000, 1500),
    arigatoKatamachi('17341/1734120/1734120648/photo-arigato-stay-kanazawa-katamachi-kanazawa-30.JPEG', 2880, 1920),
    arigatoKatamachi('18023/1802369/1802369305/photo-arigato-stay-kanazawa-katamachi-kanazawa-50.JPEG', 940, 705),
    arigatoKatamachi('8294/829415/829415666/photo-arigato-stay-kanazawa-katamachi-kanazawa-60.JPEG', 1280, 900),
  ],

  // Treize photos retenues sur trente-cinq. L'ordre est choisi ici, et c'est le
  // seul jeu du fichier dans ce cas : le relevé de la page est trié par empreinte
  // de fichier, pas par ordre d'affichage, et cet ordre-là n'a pas été retrouvé.
  // C'est donc celui des autres hébergements du carnet — façade, parties communes,
  // chambres, salle de bain, petit-déjeuner.
  //
  // Les vingt-deux écartées ont été regardées une à une. Dix-neuf ne montrent ni le
  // bâtiment, ni une partie commune, ni une chambre, mais des gros plans d'objets
  // sans lieu autour : serviettes pliées (deux fois), plateau d'amenities (trois
  // fois), sachets de café, bloc-notes, formulaires administratifs, boîte de
  // mouchoirs, oreillers, cintres, poubelles de tri, flacons de shampoing,
  // réfrigérateur ouvert, une main sur un interrupteur, une main qui insère une
  // carte, et deux écrans de télévision — l'un sur les logos Netflix et YouTube,
  // l'autre sur BBC News. Même règle que pour les panneaux d'horaires d'Asakusa :
  // illisibles ou muets à cette taille. Les trois dernières sont des doublons de
  // cadrage : deux chambres reprises sous un angle voisin, et la baignoire deux fois.
  'apa-hotel-toyama-ekimae-minami': [
    apaToyama('hotelImages/285940/0/eddf8817b133c562044c89e0d0f01986.jpg?va=1&ce=3', 1024, 768),
    apaToyama('hotelImages/285940/-1/bc9d566191a57e237ea4d99031402721.jpg?va=1&ce=0', 1024, 768),
    apaToyama('hotelImages/285940/3083153/a61789ac508718b8d8d654a9580b9e2b.jpg?va=1&ce=3', 1024, 768),
    apaToyama('hotelImages/285940/3083153/626aad796f0802ff5484d4476291bf6a.jpg?va=1&ce=3', 1024, 768),
    apaToyama('property/285940/1131120379/1142eea49c341dd450156b760d98c46c.jpeg?va=1&ce=2', 1024, 768),
    apaToyama('property/285940/1131120377/be6cbcac48f731cc4a123f8bf33ef3f8.jpeg?va=1&ce=2', 1024, 768),
    apaToyama('property/285940/1389603865/cff6a74900fbb9d4a816ad590bea04e8.jpeg?va=1&ce=3', 1024, 768),
    apaToyama('property/285940/1389603850/518a6bcd6d0ab0fe8e3cc4d44a2264b1.jpeg?va=1&ce=3', 1024, 766),
    apaToyama('property/285940/1389603847/35114eceb0370c48e4af474891c74f98.jpeg?va=1&ce=3', 1024, 560),
    apaToyama('hotelImages/285940/-1/a0451739f9e55c55762d770a1ccc1906.jpg?va=1&ca=13&ce=1', 1024, 768),
    apaToyama('property/285940/1389603865/06c7adc597a28603f52b301d0a582e46.jpeg?va=1&ce=3', 1024, 768),
    apaToyama('property/285940/1389603847/0d2acd715f2bc0617b3cc395f7a344ed.jpeg?va=1&ce=3', 1024, 766),
    apaToyama('property/285940/1389603847/d9a42fbafc0ae6307a95f22c6ac27871.jpeg?va=1&ce=3', 1024, 560),
  ],

  // Neuf photos retenues sur vingt-quatre, même ordre : la façade — la seule du
  // carnet où l'on voit à la fois l'hôtel et les Alpes derrière —, le grand bain,
  // les chambres, les deux salles de bain.
  //
  // Écartées, là aussi après les avoir regardées une à une : sept gros plans
  // d'objets (sachets d'amenities, bouilloire, plateau de thé, réfrigérateur
  // ouvert, yukata plié, écran de télévision sur le portail de la chaîne, et des
  // flacons dont l'image porte le filigrane d'un autre agrégateur), l'entrée de la
  // chambre vue de l'intérieur — une porte et une patère —, et sept chambres de
  // plus, assez proches des retenues pour qu'on ne distingue plus une simple d'une
  // simple. Aucune vue de la ville dans ce lot : rien à écarter de ce côté,
  // contrairement à Kanazawa.
  'hotel-route-inn-shinano-omachi-ekimae': [
    routeInnOmachi('hotelImages/13868604/-1/627cf4e1a105e26d311ffc1788c98005.jpg?va=1&ce=0', 1024, 724),
    routeInnOmachi('hotelImages/13868604/-1/f21642457ba604520a24cc311a0b47b5.jpg?va=1&ca=14&ce=1', 1024, 682),
    routeInnOmachi('hotelImages/13868604/162044349/21f149e5dff63c7085be60d714e75f62.jpg?va=1&ce=3', 1024, 768),
    routeInnOmachi('property/13868604/1248808072/0b6c0ce324e940d436204dace743b6af.jpeg?va=1&ce=3', 1024, 767),
    routeInnOmachi('property/13868604/658581951/385f43597e803e1fb033adda5fe33cc4.jpeg?va=1&ce=0', 1024, 767),
    routeInnOmachi('property/13868604/754645492/de159f66732ada7d00569084bff3d7af.jpeg?va=1&ce=3', 1024, 768),
    routeInnOmachi('hotelImages/13868604/163537017/150d8f7419a720987f94e5c160a9d55b.jpg?va=1&ce=3', 1024, 768),
    routeInnOmachi('property/13868604/658791208/d6c77004293d719a2777723b59d887c1.jpeg?va=1&ce=3', 1024, 767),
    routeInnOmachi('hotelImages/13868604/-1/388fc713e146991b932a9c3b2b69d424.jpg?va=1&ca=11&ce=1', 1024, 768),
  ],
}

/** Les photos d'un hébergement, ou un tableau vide : jamais celles d'un autre. */
export function photosHebergement(photosId?: string): PhotoHebergement[] {
  return (photosId ? PHOTOS_HEBERGEMENT[photosId] : undefined) ?? []
}

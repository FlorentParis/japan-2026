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

// ─── Nagano · Chūōkan Shimizuya Ryokan ──────────────────────────────────────
//
// Deuxième jeu tiré d'une fiche Rakuten Travel, après Yutoria, et pour la même
// raison : ce ryokan de la rue du Zenkō-ji n'a pas de site à lui. Les moteurs de
// recherche sont tous bloqués depuis cette adresse, et sa seule page citable qui
// publie des photos est sa fiche Rakuten (hôtel 136242). Comme pour Yutoria, les
// URL liées sont les originaux de cette fiche — les mêmes que renvoie une
// recherche d'images —, jamais la copie signée et périssable d'un agrégateur.
//
// Trois points à garder si on y revient :
// ▸ La fiche ne légende aucune photo : le sujet est donc « établissement » pour
//   les neuf, et la fabrique n'a pas de paramètre `sujet` — même règle que Yutoria
//   et Kanazawa, deviner ce qu'on croit voir enfreindrait la règle 2.
// ▸ Rakuten ne sert que les originaux (chemin `/origin/`), et ceux de ce ryokan
//   sont petits — 300 × 225 à 950 × 500 px, mesurés un à un. C'est l'inverse de
//   Yutoria, dont les originaux montaient à 6 024 px : ici il n'y a rien de plus
//   grand à demander, la fiche ne publie pas mieux.
// ▸ Neuf photos retenues sur quatorze. Les cinq écartées, regardées une à une : le
//   logo en idéogrammes de l'auberge (deux fois, 211 × 70 et 199 × 70 px, ce n'est
//   pas une photo), les lanternes de pierre d'un sanctuaire, le Zenkō-ji lui-même
//   — déjà le spot de l'étape — et une vue de la rue du quartier : mêmes écarts
//   qu'à Kanazawa et Asakusa, ces sujets-là sont couverts par la galerie Commons.
//
// À remplacer dès que l'auberge ouvre un site : la clé et le `photosId` sont en
// place, seules les URL et les catégories changeraient.

const SHIMIZUYA = 'https://travel.rakuten.co.jp/HOTEL/136242/136242.html'
const SHIMIZUYA_PHOTOS = 'https://trvimg.r10s.jp/share/image_up/136242/origin/'

const shimizuya = (
  /** Nom du fichier chez Rakuten, empreinte comprise : c'est son seul identifiant. */
  file: string,
  width: number,
  height: number,
): PhotoHebergement => ({
  url: `${SHIMIZUYA_PHOTOS}${file}`,
  width,
  height,
  file,
  author: 'Chūōkan Shimizuya Ryokan',
  license: 'photo de l’établissement',
  sourcePage: SHIMIZUYA,
  // Comme pour Yutoria et Kanazawa : pas de paramètre `sujet`, la source n'en
  // donne aucun.
  sujet: 'établissement',
})

// ─── Kurashiki · Toyoko Inn Kurashiki-eki Minami-guchi ──────────────────────
//
// Deuxième hôtel de la chaîne Toyoko Inn du carnet, après Matsumoto, et même
// mécanique : le site officiel range les photos par établissement (code 00035),
// et c'est la page japonaise qui les catégorise en clair — « 外観 » (façade),
// « シングル » (chambre simple), « フロント » (réception), « 朝食 » (petit-déjeuner) ;
// la page anglaise ne traduit pas ces libellés. Le redimensionneur de la chaîne
// ne recadre pas : `?width=1280` ne fixe que la largeur et garde le rapport.

const TOYOKO_KURASHIKI = 'https://www.toyoko-inn.com/eng/search/detail/00035/'

const toyokoKurashiki = (
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
  author: 'Toyoko Inn Kurashiki-eki Minami-guchi',
  license: 'photo de l’établissement',
  sourcePage: TOYOKO_KURASHIKI,
  sujet,
})

// ─── Takamatsu · OKAERI Tsukijichō ──────────────────────────────────────────
//
// Le cas le plus difficile du carnet. Cet OKAERI est un logement tenu par un
// hôte privé (une location d'appartement, pas un hôtel de chaîne) : il n'a pas
// de site à lui, et comme tous les moteurs de recherche sont bloqués depuis
// cette adresse, aucune source consultable ne le mentionnait — l'étape avait
// donc d'abord été remplie sans photos. Sa seule page citable est celle de la
// réservation, chez L-Tike (ローチケ旅行, l'agence de voyage de Lawson) : c'est
// elle qui a fourni le lien, et c'est elle qui montre le logement.
//
// L-Tike revend en fait des fiches Booking.com : ses photos sont servies par le
// CDN d'images de Booking (`bstatic.com`), et c'est de là qu'elles sont liées,
// jamais recopiées. Points à garder si on y revient :
// ▸ La fiche porte un seul identifiant Booking (44862711 côté L-Tike) et ne sert
//   les photos que de ce logement ; les autres hôtels qu'elle affiche sont dans
//   un carrousel de recommandations qui, lui, n'utilise pas ce CDN — aucune de
//   leurs images ne se mêle donc à ce jeu. C'est ce qui garantit qu'on ne prend
//   pas les photos d'un autre établissement.
// ▸ La variante `max1024x768` du CDN **ne recadre pas** : elle inscrit la photo
//   dans une boîte de 1 024 × 768 en gardant son rapport — d'où 1 024 × 768 pour
//   les paysages et 576 × 768 pour les portraits, Booking normalisant ses envois
//   au format 4:3. C'est l'inverse de la variante `840x460` que sert la page par
//   défaut, qui, elle, recadre à ce rapport (même piège que le `1024x768w` de
//   l'annuaire de Kanazawa).
// ▸ Le jeton `?k=` est une empreinte du contenu, stable, pas une signature qui
//   expire : l'URL reste valable dans le temps.
// ▸ La fiche ne légende aucune photo, ne donne qu'un ordre d'affichage : le sujet
//   est donc « établissement » partout et la fabrique n'a pas de paramètre
//   `sujet` — même règle que pour les fiches Agoda et Rakuten ci-dessus.

const OKAERI = 'https://tour.l-tike.com/hotels/domestic/hotel/44862711/'

const okaeri = (
  /** Identifiant Booking de la photo (le nombre du chemin `.../{id}.jpg`). */
  id: string,
  /** Jeton de contenu `?k=`, recopié de la page — jamais reconstruit. */
  k: string,
  width: number,
  height: number,
): PhotoHebergement => ({
  url: `https://q-xx.bstatic.com/xdata/images/hotel/max1024x768/${id}.jpg?k=${k}&o=`,
  width,
  height,
  file: `${id}.jpg`,
  author: 'OKAERI Tsukijichō',
  license: 'photo de l’établissement',
  sourcePage: OKAERI,
  sujet: 'établissement',
})

// ─── Les fiches Trip.com : Nagasaki et Tokyo ───────────────────────────────
//
// Quatrième et dernière source qui n'est pas un site d'établissement. Les deux
// hôtels ont bien un site, mais aucun des deux n'est accessible : `apahotel.com`
// bloque (Akamai), et `hotel-sui.com` ne référence que l'établissement de Kyoto.
// La fiche Trip.com est la seule qui montre ces deux hôtels.
//
// Ce que ça implique, et qui vaut pour les deux sections qui suivent :
// ▸ Le redimensionneur de Trip.com (suffixes `_Z_`, `_D_`, `_R_`) ne recadre pas
//   au-delà de l'original : la variante sans suffixe rend le fichier tel quel.
//   Ce sont donc les originaux qui sont liés.
// ▸ La fiche ne légende aucune photo — pas de catégorie, pas de titre, seulement
//   un ordre d'affichage. Le sujet est donc « établissement » partout et la
//   fabrique n'a pas de paramètre `sujet`.
// ▸ Les dimensions sont mesurées sur chaque fichier tel que le serveur le rend
//   (marqueur SOFn de l'en-tête JPEG).

/** Noms des hôtels Trip.com par identifiant de propriété. */
const TRIPCOM_HOTELS: Record<number, { name: string; sourcePage: string }> = {
  43889858: {
    name: 'APA Hotel Nagasaki Dejima',
    sourcePage: 'https://www.trip.com/hotels/nagasaki-hotel-detail-43889858/apa-hotel-nagasaki-dejima-station/',
  },
  19814769: {
    name: 'Hotel SUI akasaka by ABEST',
    sourcePage: 'https://www.trip.com/hotels/detail/?hotelId=19814769',
  },
}

const tripcom = (
  hotelId: number,
  file: string,
  width: number,
  height: number,
): PhotoHebergement => ({
  url: `https://ak-d.tripcdn.com/images/${file}.jpg`,
  width,
  height,
  file: `${file}.jpg`,
  author: TRIPCOM_HOTELS[hotelId].name,
  license: 'photo de l’établissement',
  sourcePage: TRIPCOM_HOTELS[hotelId].sourcePage,
  sujet: 'établissement',
})

// ─── Hiroshima · Noborichou 204 Freat Location ─────────────────────────────
//
// Location d'appartement listée sur Booking.com. Le logement n'a pas de site à
// lui ; la fiche Booking est la seule page qui le montre, et Booking bloque le
// fetch (WAF/JavaScript) : une seule photo a pu être extraite, celle que le
// voyageur a fournie directement. Le jeton `?k=` est une empreinte du contenu,
// stable, pas une signature qui expire.

const NOBORICHOU =
  'https://www.booking.com/hotel/jp/noborichou-204-great-location.html'

const noborichou = (
  id: string,
  k: string,
  width: number,
  height: number,
): PhotoHebergement => ({
  url: `https://cf.bstatic.com/xdata/images/hotel/max1024x768/${id}.jpg?k=${k}&o=`,
  width,
  height,
  file: `${id}.jpg`,
  author: 'Noborichou 204 Freat Location',
  license: 'photo de l’établissement',
  sourcePage: NOBORICHOU,
  sujet: 'établissement',
})

// ─── Matsuyama · Hotel Sambancho ───────────────────────────────────────────
//
// Deux sources, fournies par le voyageur : une photo de la fiche Agoda
// (propriété 36984958) et trois de la fiche Booking.com. L'hôtel n'a pas de
// site à lui, et les deux fiches bloquent le fetch (JavaScript) — les URL ont
// été copiées à la main depuis le navigateur.
//
// La fiche Agoda ne légende pas la photo ; les fiches Booking non plus. Le
// sujet est donc « établissement » partout. Dimensions mesurées sur chaque
// fichier.

const SAMBANCHO_AGODA =
  'https://www.agoda.com/hotel-sanbancho/hotel/matsuyama-jp.html'
const SAMBANCHO_BOOKING =
  'https://www.booking.com/hotel/jp/sanbancho.html'

// ─── Fukuoka · Fukuoka Guesthouse Camp ─────────────────────────────────────
//
// Site officiel du guesthouse (`fgh-camp.com`), écrit à la main : les images sont
// rangées par page et par section. Le chemin du fichier (`top/…`, `stay/…`) sert
// d'identifiant. Les dimensions sont mesurées sur chaque fichier (marqueur SOFn).
//
// La page d'accueil organise les photos en trois blocs — le carrousel d'entrée
// (les trois `main_XX`), le concept, les chambres, le café et l'accès. Les
// catégories viennent des titres de section de la page (« STAY », « CAFE »).

const FGH_CAMP = 'https://fgh-camp.com/en/'

const fghCamp = (
  file: string,
  sujet: SujetHebergement,
  width: number,
  height: number,
): PhotoHebergement => ({
  url: `https://fgh-camp.com/img/${file}`,
  width,
  height,
  file,
  author: 'Fukuoka Guesthouse Camp',
  license: 'photo de l’établissement',
  sourcePage: FGH_CAMP,
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

  // Neuf photos retenues sur quatorze. L'ordre est choisi ici, comme pour Toyama :
  // le relevé de la fiche est trié par empreinte, pas par ordre d'affichage. C'est
  // donc l'ordre des autres hébergements du carnet — façade, parties communes,
  // chambres, petit-déjeuner. Dimensions mesurées une à une (marqueur SOFn) : elles
  // vont de 300 × 225 à 950 × 500 px, la fiche ne publie rien de plus grand.
  'chuokan-shimizuya-ryokan': [
    shimizuya('9915b15c3423a20bb499b20ae1f87c1a7143517f.47.9.26.3.jpg', 950, 500),
    shimizuya('63a25e1b09105d7afdd6588540bf384529c75dcd.47.9.26.3.jpg', 950, 500),
    shimizuya('55874cb9e4168b95676910d2d77f8281bd0dd92d.47.9.26.3.jpg', 950, 500),
    shimizuya('80de7c330ac26de45f1ecca68c2c10c85cc7573a.47.9.26.3.jpg', 950, 500),
    shimizuya('521eee285e1a4e7d9ef1254a085f68e848375cfc.47.9.26.3.jpg', 520, 360),
    shimizuya('1de0bddc9c43b40b856ff89307411a58b2853033.47.9.26.3.jpg', 300, 225),
    shimizuya('43351f23a436f1c5c69cac726a59b369c34ebaf9.47.9.26.3.jpg', 460, 360),
    shimizuya('acd349796d514bacce6343528f7d3d7689568037.47.9.26.3.jpg', 460, 360),
    shimizuya('febffd0503a759f5c1bcf88143e33a2ecb5d1e1d.47.9.26.3.jpg', 300, 225),
  ],

  // Ordre de la galerie de la chaîne : 外観, シングル, フロント, 朝食.
  'toyoko-inn-kurashiki-eki-minami-guchi': [
    toyokoKurashiki('EbobbydQo7ZQxAJKgTGCC5', 'établissement', 1280, 1919),
    toyokoKurashiki('vMGch3k2HHNj2BhW4bfYkb', 'chambre', 1280, 720),
    toyokoKurashiki('f7ecZe2GrvZEH5rh3nGVR9', 'établissement', 1280, 853),
    // 朝食 : l'original ne fait que 640 px de large, le redimensionneur ne
    // l'agrandit pas.
    toyokoKurashiki('ZBHKE4oKSrLxY4QfdcRGph', 'établissement', 640, 480),
  ],

  // Douze photos retenues sur quatre-vingt-huit. L'ordre est choisi ici — la
  // fiche ne donne qu'un défilé sans catégories —, c'est donc celui des autres
  // hébergements du carnet : la façade, les parties communes, les chambres, puis
  // la cuisine et la salle de bain. Toutes mesurées 1 024 × 768 (la boîte de la
  // variante `max1024x768`, la photo au format 4:3 qui la remplit).
  //
  // Les soixante-seize écartées ont été regardées une à une sur une planche. Ce
  // logement compte plusieurs unités quasi identiques : l'essentiel du lot est
  // fait de reprises très proches d'une même chambre, d'une même kitchenette ou
  // d'un même coin repas, sous un angle voisin — on garde un représentant de
  // chaque, pas la série. Le reste est des gros plans d'objets sans lieu autour,
  // même écart qu'à Toyama et Shinano-Ōmachi : plaque à induction, bouilloire,
  // cuiseur à riz, flacons d'amenities, couverts, lave-linge, égouttoir, placards
  // ouverts, chaussons, prises murales — muets à cette taille.
  'okaeri-tsukijicho': [
    okaeri('570778047', '97ee153f5e604aab9611a856d2e43befd873a092080c304ce137678b83e3ee03', 1024, 768),
    okaeri('545134014', '133e5c6bea9a14bf724df32b183d78420e41f12bdc8d846b441adda78f4f55b2', 1024, 768),
    okaeri('545141037', '59171bb8dfd71d0e7a47b6bc5adbe91448b282f0e16b16f7adf3a77bc5638ffc', 1024, 768),
    okaeri('545136969', '8cb48a2c6c42b4ed5817457f7b4ab4430f7d8cca9f27830511199e5017ff9a15', 1024, 768),
    okaeri('545141051', '248567f568631038a2524fd0e00c8d90ab334644fb40331d209e384ce0129ca0', 1024, 768),
    okaeri('545141034', '1869d86d52f1c20affa5c9101594d9d265706573eb1321c76609599877dda60e', 1024, 768),
    okaeri('545139149', 'c48b51c00dad8b78abfb5801b5c41db2be6540e1f5e839acffeda8cf0ee9fbd7', 1024, 768),
    okaeri('545134037', '45472fd73278711ad42fded405da6d3295dbf2898e4c3e1d239078c3f1db43bd', 1024, 768),
    okaeri('545136952', 'ad071dda816b352111d69e1e16b2f89620a4f5617b61957e1bf6da1d027aec13', 1024, 768),
    okaeri('545141035', '5dd2632d8597ec115f5258a7ae8314ddfed26b53da547ce2948d8cfcf5dfa7f3', 1024, 768),
    okaeri('545136964', 'e5ed54a28d02de9779b8c666f410ea1056e5692d4eba3aec6015e1fc4b214fe4', 1024, 768),
    okaeri('545134026', '6d82c0389e45943714fd0a3bca39d82ab5cc15c3333936a0201fef8a430d8701', 1024, 768),
  ],

  // Une seule photo récupérable : Booking bloque le fetch et chaque image demande
  // son propre jeton `k=`, impossible à deviner pour les photos voisines.
  'noborichou-204': [
    noborichou('571142107', 'ccfbdb8ceb663d8591b08923894b195d57f14e61cd1d5cc340aca92fe46b56d3', 911, 683),
  ],

  'hotel-sambancho': [
    {
      url: 'https://pix8.agoda.net/property/36984958/0/7808ceb5fad91f27b8b211d269f2476a.jpeg?ce=2&s=1024x',
      width: 1024,
      height: 767,
      file: '7808ceb5fad91f27b8b211d269f2476a.jpeg',
      author: 'Hotel Sambancho',
      license: 'photo de l’établissement',
      sourcePage: SAMBANCHO_AGODA,
      sujet: 'établissement',
    },
    {
      url: 'https://q-xx.bstatic.com/xdata/images/hotel/max1024x768/180817256.jpg?k=7b1b5f74976120804f177eaa9272e66c89f84195c9ec7e83255c876d09446e4b&o=&s=1024x',
      width: 458,
      height: 768,
      file: '180817256.jpg',
      author: 'Hotel Sambancho',
      license: 'photo de l’établissement',
      sourcePage: SAMBANCHO_BOOKING,
      sujet: 'établissement',
    },
    {
      url: 'https://q-xx.bstatic.com/xdata/images/hotel/max1024x768/180818025.jpg?k=bbf07a0de074b2ef07b92748d8c8637eda7bec05763c7ccefa831b73ad9972b6&o=&s=1024x',
      width: 536,
      height: 768,
      file: '180818025.jpg',
      author: 'Hotel Sambancho',
      license: 'photo de l’établissement',
      sourcePage: SAMBANCHO_BOOKING,
      sujet: 'établissement',
    },
    {
      url: 'https://q-xx.bstatic.com/xdata/images/hotel/max1024x768/193211820.jpg?k=ed12fdc5dfa57f70e8640f8a1b459790419f76a7b9cf2820fc0e89318d28c419&o=&s=1024x',
      width: 1024,
      height: 720,
      file: '193211820.jpg',
      author: 'Hotel Sambancho',
      license: 'photo de l’établissement',
      sourcePage: SAMBANCHO_BOOKING,
      sujet: 'établissement',
    },
  ],

  // Ordre de la page : le carrousel d'entrée, le concept, les chambres, le café.
  'fukuoka-guesthouse-camp': [
    fghCamp('top/main_01.jpg', 'établissement', 2880, 2048),
    fghCamp('top/main_02.jpg', 'établissement', 2880, 2048),
    fghCamp('top/main_03.jpg', 'établissement', 2880, 2048),
    fghCamp('top/img_concept.jpg', 'établissement', 1366, 836),
    fghCamp('stay/img_mix01.jpg', 'chambre', 960, 640),
    fghCamp('stay/img_mix02.jpg', 'chambre', 960, 640),
    fghCamp('stay/img_mix03.jpg', 'chambre', 960, 640),
    fghCamp('stay/img_mix04.jpg', 'chambre', 960, 640),
    fghCamp('top/img_cafe.jpg', 'établissement', 2323, 1060),
    fghCamp('top/img_access.jpg', 'établissement', 951, 634),
  ],

  // ─── Nagasaki · APA Hotel Nagasaki Dejima ────────────────────────────────────
  //
  // Fiche Trip.com (hôtel 43889858), seule source citable qui publie les photos
  // de cet établissement de manière accessible : le site officiel de la chaîne APA
  // (`apahotel.com`) bloque toute requête qui n'est pas un navigateur ordinaire
  // (Akamai), exactement comme pour l'APA de Toyama plus haut. Les URL liées sont
  // les originaux de la fiche Trip.com, sans redimensionnement.
  //
  // La fiche ne légende aucune photo : le sujet est donc « établissement » pour
  // toutes, et la fabrique n'a pas de paramètre `sujet` — même règle que Yutoria,
  // Kanazawa et les fiches Agoda ci-dessus.
  //
  // Dimensions mesurées sur chaque fichier (marqueur SOFn de l'en-tête JPEG) :
  // elles vont de 562 × 360 à 2 005 × 1 337 px, aucun format commun à déduire.
  // Dix photos retenues sur trente-et-une. Les vingt-et-une écartées ont été
  // regardées une à une : doublons de cadrage, gros plans d'objets sans lieu
  // autour, et photos trop petites pour le carrousel.
  'apa-hotel-nagasaki-dejima': [
    tripcom(43889858, '1mc3512000k76nh1k2D97', 2005, 1337),
    tripcom(43889858, '1mc1412000b4szn6q2772', 1684, 1123),
    tripcom(43889858, '1mc5g12000b4sxl4lBDD2', 1684, 1123),
    tripcom(43889858, '1mc5t12000b4sxpby06B0', 1684, 1123),
    tripcom(43889858, '1mc6d12000b4sxnsjF0D1', 1684, 1123),
    tripcom(43889858, '1mc6q12000b4sxphmC4A5', 1684, 1123),
    tripcom(43889858, '0226d120009yxx8xmC58A', 1179, 786),
    tripcom(43889858, '2007170000011ye19F6C1', 1200, 675),
    tripcom(43889858, '200o170000011gjpo2CE8', 1200, 675),
    tripcom(43889858, '0224f12000ac8wpixD43A', 1000, 667),
  ],

  // ─── Tokyo · Hotel SUI akasaka by ABEST ──────────────────────────────────────
  //
  // Fiche Trip.com (hôtel 19814769). L'hôtel a un site officiel (`hotel-sui.com`)
  // mais il ne référence que l'établissement de Kyoto, pas celui d'Akasaka. Même
  // mécanique que pour l'APA de Nagasaki ci-dessus : les photos viennent de la
  // fiche Trip.com, seule source accessible.
  //
  // La fiche ne légende aucune photo : sujet « établissement » partout, même
  // règle. Dimensions mesurées une à une. Neuf photos retenues sur dix-sept.
  'hotel-sui-akasaka': [
    tripcom(19814769, '0581h12000dsq149h4534', 1280, 640),
    tripcom(19814769, '0202u1200087rzi079A9B', 764, 505),
    tripcom(19814769, '0226g12000a37mzdm9BF8', 614, 409),
    tripcom(19814769, '0581p12000db735kk81C6', 614, 460),
    tripcom(19814769, '0227212000bozrodh9377', 614, 460),
    tripcom(19814769, '0227412000bp0gwe78114', 614, 460),
    tripcom(19814769, '0224n12000lwdebe29DB9', 640, 360),
    tripcom(19814769, '220111000000qogb56BB5', 600, 399),
    tripcom(19814769, '220b11000000qdwyl13E7', 600, 399),
  ],
}

/** Les photos d'un hébergement, ou un tableau vide : jamais celles d'un autre. */
export function photosHebergement(photosId?: string): PhotoHebergement[] {
  return (photosId ? PHOTOS_HEBERGEMENT[photosId] : undefined) ?? []
}

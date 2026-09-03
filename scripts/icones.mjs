/**
 * GÉNÉRATEUR DES ICÔNES D'APPLICATION (`npm run icones`).
 *
 * « Ajouter à l'écran d'accueil » réclame des PNG : Android les veut dans le
 * manifeste, iOS dans un `apple-touch-icon`, et aucun des deux n'accepte
 * sérieusement le SVG du favicon. D'où ce script — plutôt qu'un export à la main
 * depuis un éditeur d'images, qui aurait fait divorcer les icônes du favicon dès
 * la première retouche.
 *
 * Il redessine `public/favicon.svg` en pixels, sans aucune dépendance : le motif
 * est un fond, deux courbes de Bézier au trait rond et deux disques, ce qui
 * s'échantillonne en trente lignes. Encoder le PNG demande juste `zlib`, qui est
 * dans Node. Ajouter `sharp` ou `resvg` pour ça aurait pesé plus lourd que le
 * problème.
 *
 * ⚠️ Le motif est recopié ici depuis le SVG, il n'est pas lu depuis lui : écrire
 * un analyseur de `<path>` pour un seul fichier n'en vaut pas la peine. Les deux
 * doivent donc être modifiés ensemble — c'est dit dans `public/favicon.svg`.
 *
 * Les fichiers produits sont versionnés : le site se construit et se déploie sans
 * avoir à relancer ce script.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

/** Les deux couleurs du favicon : le papier et le vermillon. */
const PAPIER = [0xf6, 0xf3, 0xed]
const VERMILLON = [0xc0, 0x44, 0x2b]

/** Le motif est dessiné dans le repère du SVG, un carré de 32 unités. */
const BOITE = 32

/*
 * Les deux cubiques du trait, telles qu'elles sont écrites dans le `<path>` :
 * « M4 23 C10 23 11 9 17 9 C23 9 24 20 28 20 ». C'est la ligne de voyage —
 * une descente, une remontée — d'où le point plein au départ et le point creux
 * à l'arrivée.
 */
const COURBES = [
  [
    [4, 23],
    [10, 23],
    [11, 9],
    [17, 9],
  ],
  [
    [17, 9],
    [23, 9],
    [24, 20],
    [28, 20],
  ],
]

/** Demi-épaisseur du trait : `stroke-width: 2.6` dans le SVG. */
const DEMI_TRAIT = 1.3

/** Le disque plein du départ, et l'anneau creux de l'arrivée. */
const DEPART = { centre: [4.5, 23], rayon: 3.2 }
const ARRIVEE = { centre: [27.5, 20], rayon: 3.2, demiTrait: 1.2 }

/** Rayon des coins arrondis du fond, `rx: 7`. */
const COIN = 7

/**
 * La courbe réduite en segments, une fois pour toutes.
 *
 * Le trait a des bouts et des jointures arrondis : la distance à cette polyligne
 * décrit donc exactement la forme peinte, capuchons compris, sans avoir à traiter
 * les extrémités à part. 48 segments par cubique suffisent — à 512 pixels de
 * côté, l'écart entre la corde et l'arc reste très en dessous du pixel.
 */
const POLYLIGNE = COURBES.flatMap(([p0, c1, c2, p3]) =>
  Array.from({ length: 49 }, (_, i) => {
    const t = i / 48
    const u = 1 - t
    return [0, 1].map(
      (k) =>
        u * u * u * p0[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * p3[k],
    )
  }),
)

/** Distance d'un point au segment [a, b]. */
function distanceSegment(x, y, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const longueur2 = dx * dx + dy * dy
  // Un segment dégénéré se réduit à son origine : on évite la division par zéro.
  const t = longueur2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / longueur2))
  return Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy))
}

function distanceTrait(x, y) {
  let min = Infinity
  for (let i = 0; i < POLYLIGNE.length - 1; i += 1) {
    min = Math.min(min, distanceSegment(x, y, POLYLIGNE[i], POLYLIGNE[i + 1]))
  }
  return min
}

/** Dans le rectangle aux coins arrondis ? */
function dansLeFond(x, y, arrondi) {
  if (x < 0 || y < 0 || x > BOITE || y > BOITE) return false
  if (!arrondi) return true
  // Distance au rectangle rétréci du rayon des coins : c'est la définition même
  // d'un rectangle arrondi, et elle traite les quatre coins d'un coup.
  const dx = Math.max(0, Math.abs(x - BOITE / 2) - (BOITE / 2 - arrondi))
  const dy = Math.max(0, Math.abs(y - BOITE / 2) - (BOITE / 2 - arrondi))
  return Math.hypot(dx, dy) <= arrondi
}

/**
 * La couleur visible en un point, ou `null` hors du fond.
 *
 * L'ordre des tests est l'ordre de peinture du SVG, à l'envers : ce qui est
 * dessiné en dernier gagne. Le disque de départ passe donc devant le trait, et
 * l'anneau d'arrivée devant tout le reste.
 */
function couleur(x, y, arrondi) {
  const dArrivee = Math.hypot(x - ARRIVEE.centre[0], y - ARRIVEE.centre[1])
  // L'anneau : le remplissage clair est recouvert par son propre contour, qui est
  // centré sur le cercle — le vermillon va donc de r−1,2 à r+1,2.
  if (dArrivee <= ARRIVEE.rayon + ARRIVEE.demiTrait) {
    return dArrivee >= ARRIVEE.rayon - ARRIVEE.demiTrait ? VERMILLON : PAPIER
  }
  if (Math.hypot(x - DEPART.centre[0], y - DEPART.centre[1]) <= DEPART.rayon) return VERMILLON
  if (distanceTrait(x, y) <= DEMI_TRAIT) return VERMILLON
  return dansLeFond(x, y, arrondi) ? PAPIER : null
}

/**
 * Rendu du motif en RGBA.
 *
 * `marge` réserve une couronne de fond autour du dessin : les icônes « maskable »
 * d'Android sont rognées en cercle, et sans marge le disque de départ y perdrait
 * la moitié de sa surface. `arrondi` distingue le fond du favicon (coins arrondis,
 * hors-coin transparent) de celui d'iOS, qui veut un carré plein et l'arrondit
 * lui-même.
 */
function dessiner(taille, { marge = 0, arrondi = true, fondPlein = false } = {}) {
  /** Sur-échantillonnage 4×4 : le motif n'a que des bords courbes, ils crènent. */
  const SS = 4
  const pixels = Buffer.alloc(taille * taille * 4)
  const utile = taille * (1 - 2 * marge)

  for (let py = 0; py < taille; py += 1) {
    for (let px = 0; px < taille; px += 1) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          // Du pixel vers le repère du SVG, en tenant compte de la marge.
          const x = ((px + (sx + 0.5) / SS - taille * marge) / utile) * BOITE
          const y = ((py + (sy + 0.5) / SS - taille * marge) / utile) * BOITE
          const c = couleur(x, y, arrondi ? COIN : 0) ?? (fondPlein ? PAPIER : null)
          if (c) {
            r += c[0]
            g += c[1]
            b += c[2]
            a += 255
          }
        }
      }
      const n = SS * SS
      const i = (py * taille + px) * 4
      // Couleur moyennée sur les seuls échantillons opaques : sinon les bords
      // extérieurs tireraient vers le noir en même temps qu'ils s'effacent.
      const opaques = a / 255
      pixels[i] = opaques ? Math.round(r / opaques) : 0
      pixels[i + 1] = opaques ? Math.round(g / opaques) : 0
      pixels[i + 2] = opaques ? Math.round(b / opaques) : 0
      pixels[i + 3] = Math.round(a / n)
    }
  }
  return pixels
}

/* ------------------------------------------------------------------------- *
 * Encodage PNG. Trois morceaux (en-tête, pixels, fin), chacun terminé par un
 * CRC-32 : c'est tout ce que demande un PNG sans fioriture.
 * ------------------------------------------------------------------------- */

const TABLE_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer) {
  let c = 0xffffffff
  for (const octet of buffer) c = TABLE_CRC[(c ^ octet) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function bloc(type, donnees) {
  const longueur = Buffer.alloc(4)
  longueur.writeUInt32BE(donnees.length)
  const corps = Buffer.concat([Buffer.from(type, 'ascii'), donnees])
  const somme = Buffer.alloc(4)
  somme.writeUInt32BE(crc32(corps))
  return Buffer.concat([longueur, corps, somme])
}

function png(taille, pixels) {
  const entete = Buffer.alloc(13)
  entete.writeUInt32BE(taille, 0)
  entete.writeUInt32BE(taille, 4)
  entete[8] = 8 // 8 bits par canal
  entete[9] = 6 // RGBA
  // Compression 0, filtrage 0, entrelacement 0 : les seules valeurs normalisées.

  // Chaque ligne est précédée de son octet de filtre — 0, « aucun filtre » : le
  // motif est en larges aplats, un filtre différentiel ne gagnerait rien de
  // visible sur des fichiers de cette taille.
  const lignes = Buffer.alloc(taille * (taille * 4 + 1))
  for (let y = 0; y < taille; y += 1) {
    pixels.copy(lignes, y * (taille * 4 + 1) + 1, y * taille * 4, (y + 1) * taille * 4)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloc('IHDR', entete),
    bloc('IDAT', deflateSync(lignes, { level: 9 })),
    bloc('IEND', Buffer.alloc(0)),
  ])
}

/**
 * Les quatre icônes, et pourquoi chacune existe :
 *
 * ▸ 192 et 512 px, coins arrondis : les tailles que le manifeste doit fournir
 *   pour qu'Android propose l'installation ;
 * ▸ 512 px « maskable », marge de 12,5 % et fond plein : Android rogne l'icône
 *   à la forme du lanceur — cercle, goutte, écusson — et n'utilise cette variante
 *   que si elle survit au rognage ;
 * ▸ 180 px pour iOS, carré plein sans transparence : Safari ne compose rien, il
 *   pose le fichier tel quel et arrondit les coins lui-même. Un PNG transparent
 *   y devient une icône sur fond noir.
 */
const ICONES = [
  ['icone-192.png', 192, {}],
  ['icone-512.png', 512, {}],
  ['icone-maskable-512.png', 512, { marge: 0.125, arrondi: false, fondPlein: true }],
  ['apple-touch-icon.png', 180, { arrondi: false, fondPlein: true }],
]

for (const [nom, taille, options] of ICONES) {
  const fichier = png(taille, dessiner(taille, options))
  writeFileSync(join(PUBLIC, nom), fichier)
  console.log(`public/${nom} — ${taille}×${taille}, ${(fichier.length / 1024).toFixed(1)} ko`)
}

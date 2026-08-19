/**
 * Chiffres des galeries photo.
 *
 * Séparé de `derive.ts` pour la même raison que `PhotoGallery` l'est de `ui.tsx` :
 * ce module importe `galleries.generated.ts`, et `derive.ts` est utilisé par
 * toutes les vues. Les mêmes calculs rangés là feraient télécharger les galeries
 * à qui n'ouvre que l'aperçu.
 *
 * Pour un simple compteur (« 21 photos du lieu »), utiliser `galleryCount()` de
 * `derive.ts`, qui lit `GALLERY_COUNTS` — dix-huit nombres au lieu de 160 ko.
 */
import { DESTINATIONS } from '../data/destinations'
import { GALLERIES } from '../data/galleries.generated'

/**
 * Ce que contiennent les galeries.
 *
 * `enDessousDuSeuil` sert à ne pas prétendre « au moins neuf photos par lieu »
 * quand ce n'est pas vrai : le compte réel est affiché, étape par étape.
 */
export function photoTotals(seuil = 9) {
  const parEtape = DESTINATIONS.map((d) => ({
    id: d.id,
    name: d.name,
    count: GALLERIES[d.id]?.length ?? 0,
  }))
  return {
    /** Fichiers distincts : les galeries ne se recoupent pas, mais on ne le suppose pas. */
    fichiers: new Set(
      Object.values(GALLERIES)
        .flat()
        .map((p) => p.file),
    ).size,
    total: parEtape.reduce((s, e) => s + e.count, 0),
    parEtape,
    minimum: Math.min(...parEtape.map((e) => e.count)),
    enDessousDuSeuil: parEtape.filter((e) => e.count < seuil),
  }
}

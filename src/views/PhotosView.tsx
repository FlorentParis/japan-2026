/**
 * VUE PHOTOS — une galerie par étape.
 *
 * Toutes les images viennent de Wikimedia Commons, sous licence libre, et
 * chacune porte son auteur et sa licence : c'est la condition pour les afficher,
 * et la raison pour laquelle on ne prend pas de photos ailleurs.
 *
 * Rien n'est listé à la main ici. Les galeries sont construites par
 * `scripts/fetch-photos.ts` à partir des recherches déclarées dans
 * `src/data/destinations.ts` — et le compte réel de chaque étape est affiché,
 * plutôt qu'une promesse de « au moins neuf photos » qui pourrait être fausse.
 */
import { PhotoGallery } from '../components/PhotoGallery'
import { SectionTitle } from '../components/ui'
import { DESTINATIONS } from '../data/destinations'
import { photoTotals } from '../lib/galleries'
import { useTrip } from '../state/trip-state'

/** Le seuil que les galeries visent, et que le générateur signale s'il le rate. */
const SEUIL = 9

export function PhotosView() {
  const { goTo } = useTrip()
  const totals = photoTotals(SEUIL)

  return (
    <div className="view view--photos">
      <SectionTitle eyebrow="Les lieux" title="Photos, étape par étape">
        <p>
          {totals.fichiers} photographies pour {totals.parEtape.length} étapes, soit{' '}
          {totals.minimum} au minimum par lieu. Toutes viennent de{' '}
          <a href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer noopener">
            Wikimedia Commons
          </a>{' '}
          sous licence libre : l’auteur et la licence sont indiqués sous chaque image, et le lien
          mène à la page d’origine. Aucune image sous droits réservés n’est utilisée.
        </p>
        {totals.enDessousDuSeuil.length > 0 && (
          <p className="section-head__note">
            {totals.enDessousDuSeuil.length} étape(s) en dessous de {SEUIL} photos :{' '}
            {totals.enDessousDuSeuil.map((e) => `${e.name} (${e.count})`).join(', ')}. Ajouter des
            termes de recherche dans <code>galleryQueries</code> puis relancer{' '}
            <code>npm run photos</code>.
          </p>
        )}
      </SectionTitle>

      {DESTINATIONS.map((dest, index) => {
        const compte = totals.parEtape.find((e) => e.id === dest.id)?.count ?? 0
        return (
          <section key={dest.id} className="photo-section">
            <header className="photo-section__head">
              <h3>
                <span className="activity-card__order">{dest.order}</span> {dest.name}
                {dest.nameJa && <span className="photo-section__ja"> {dest.nameJa}</span>}
              </h3>
              <p className="photo-section__meta">
                {dest.region} · {compte} photo{compte > 1 ? 's' : ''}
              </p>
            </header>
            <PhotoGallery destId={dest.id} name={dest.name} eagerFirst={index === 0} />
            <button
              type="button"
              className="link-button"
              onClick={() => goTo('activites', { kind: 'destination', id: dest.id })}
            >
              Ce qu’il y a à y faire
            </button>
          </section>
        )
      })}
    </div>
  )
}

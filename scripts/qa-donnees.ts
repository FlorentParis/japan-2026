/**
 * CONTRÔLE DES DONNÉES — à relancer après chaque modification de `src/data/`.
 *
 * Il exécute `checkIntegrity()` (chaînage des étapes, continuité des tronçons,
 * identifiants de lieux inconnus, pass référençant un tronçon inexistant) puis
 * imprime les chiffres dérivés, pour qu'une valeur aberrante saute aux yeux.
 *
 * Sort en code 1 si une erreur d'intégrité est détectée.
 */
import { DESTINATIONS } from '../src/data/destinations'
import { photosHebergement } from '../src/data/hebergements'
import { JOURNEYS } from '../src/data/journeys'
import { NUITS_ANNONCEES, TRIP } from '../src/data/trip'
import {
  accommodationTotals,
  activityTotals,
  allWarnings,
  budget,
  flightTotals,
  gaps,
  overview,
  passAnalysis,
  specialityTotals,
  totalsByMode,
  transferTotals,
  tripDays,
} from '../src/lib/derive'
import { photoTotals } from '../src/lib/galleries'
import { LEGS_GEOJSON, TRIP_BOUNDS, spotsGeoJSON } from '../src/lib/geojson'
import { checkIntegrity } from '../src/lib/validate'

const title = (text: string) => console.log(`\n── ${text} ${'─'.repeat(Math.max(0, 60 - text.length))}`)

title('Intégrité des données')
const issues = checkIntegrity()
if (issues.length === 0) {
  console.log('Aucun problème : étapes chaînées, tronçons continus, lieux tous connus.')
}
for (const issue of issues) {
  console.log(`[${issue.level}] ${issue.where} — ${issue.message}`)
}

title('Vue d’ensemble')
const stats = overview()
console.log(
  `${stats.destinations} étapes (${stats.uniquePlaces} villes) · ${stats.journeys} déplacements · ` +
    `${stats.legs} tronçons · ${Math.round(stats.km)} km · ${Math.round(stats.travelMinutes / 60)} h de trajet`,
)
console.log(
  `trains ${stats.trainLegs} (dont ${stats.shinkansenLegs} Shinkansen) · bus ${stats.busLegs} · ` +
    `ferries ${stats.ferryLegs} · vols ${stats.flightLegs} · câbles ${stats.ropewayLegs}`,
)
console.log(
  `période : ${TRIP.period.start} → ${TRIP.period.end} · ` +
    `${tripDays() ?? 'durée inconnue (aucune date saisie)'} jours · ${stats.nights} nuits`,
)
// Le total annoncé par le voyageur est le seul repère extérieur : s'il ne
// correspond plus, c'est une nuit perdue ou dupliquée quelque part.
console.log(
  `nuits annoncées dans la table fournie : ${NUITS_ANNONCEES} → ` +
    (stats.nights === NUITS_ANNONCEES ? 'concordance' : 'ÉCART À CORRIGER'),
)
console.log(`emprise de la carte : ${JSON.stringify(TRIP_BOUNDS)} · ${LEGS_GEOJSON.features.length} tracés`)

title('Transports par mode')
for (const total of totalsByMode()) {
  console.log(
    `${total.mode.padEnd(11)} ${String(total.legs).padStart(2)} tronçon${total.legs > 1 ? 's' : ' '} · ` +
      `${String(Math.round(total.km)).padStart(5)} km · ${String(total.jpy).padStart(6)} ¥` +
      (total.includedLegs > 0 ? ` (+${total.includedLegs} inclus dans un billet groupé)` : '') +
      (total.unpricedLegs > 0 ? ` (+${total.unpricedLegs} sans tarif relevé)` : ''),
  )
}

title('Vols et transferts d’aéroport')
const vols = flightTotals()
console.log(
  `${vols.count} vols listés, ${vols.priced} avec un prix porté · ${vols.eur} € (${vols.jpy} ¥ au taux indicatif)` +
    (vols.allConfirmed ? ' · tous confirmés' : ' · au moins un prix non confirmé'),
)
for (const vol of TRIP.flights) {
  console.log(
    `  ${vol.label.padEnd(26)} ${vol.from} → ${vol.to} · ${vol.date ?? 'date ?'}` +
      (vol.departureTime ? ` · décollage ${vol.departureTime}` : '') +
      (vol.arrivalTime ? ` · atterrissage ${vol.arrivalTime}` : '') +
      ` · ${vol.certainty}`,
  )
}
const transferts = transferTotals()
console.log(
  `${transferts.count} transferts, ${transferts.legs} tronçons · ${transferts.jpy} ¥` +
    (transferts.unpriced > 0 ? ` (+${transferts.unpriced} sans tarif relevé)` : ''),
)
for (const transfert of TRIP.transfers ?? []) {
  for (const leg of transfert.legs) {
    console.log(
      `  ${transfert.id.padEnd(12)} ${leg.fromPlace} → ${leg.toPlace} · ` +
        `${leg.duration?.minutes ?? '?'} min · ${leg.cost?.jpy ?? '?'} ¥ · pass : ${leg.passCoverage}`,
    )
  }
}

title('Hébergements réservés')
// Une réservation apporte des données que rien d'autre ne recoupe : on imprime
// donc ce que le site en fera — le lien Maps, le repère sur la carte, les photos —
// pour qu'un champ oublié se voie ici plutôt qu'à l'écran.
const nuitees = accommodationTotals()
console.log(
  `${nuitees.nights} nuit(s) réservée(s) · ${nuitees.jpy} ¥ · ` +
    `moyenne ${nuitees.perNight ? `${Math.round(nuitees.perNight)} ¥` : '—'} · ` +
    `${nuitees.missing} étape(s) encore sans prix`,
)
for (const dest of DESTINATIONS) {
  const hotel = dest.accommodation
  if (hotel.status === 'todo') continue
  const photos = photosHebergement(hotel.photosId)
  const reperes = spotsGeoJSON(dest).features.filter((f) => f.properties.kind === 'hebergement')
  console.log(
    `  ${dest.name.padEnd(12)} ${hotel.name ?? 'SANS NOM'} · ${hotel.nights ?? '?'} nuit(s) · ` +
      `${hotel.price?.jpy ?? '?'} ¥ · ${hotel.checkIn ?? '?'} → ${hotel.checkOut ?? '?'} · ` +
      `${photos.length} photo(s) · ${reperes.length} repère(s) sur la carte`,
  )
  if (hotel.address && !hotel.coord) {
    console.log('    ANOMALIE : adresse sans coordonnées — ni lien Maps, ni repère sur la carte.')
  }
  if (hotel.photosId && photos.length === 0) {
    console.log(
      `    ANOMALIE : photosId « ${hotel.photosId} » sans photo dans src/data/hebergements.ts.`,
    )
  }
}

title('Budget, hypothèses par défaut')
const result = budget({
  travellers: TRIP.travellers?.count ?? 1,
  days: tripDays() ?? 0,
  foodPerDayPerPerson: TRIP.budgetDefaults.foodPerDayPerPerson,
  activitiesPerDayPerPerson: TRIP.budgetDefaults.activitiesPerDayPerPerson,
  localTransportPerDayPerPerson: TRIP.budgetDefaults.localTransportPerDayPerPerson,
  passJpy: 0,
})
for (const line of result.lines) {
  console.log(
    `${line.id.padEnd(14)} ${String(line.jpy).padStart(7)} ¥  ${line.certainty}` +
      (line.incomplete ? '  → affiché « à compléter »' : '') +
      // Une ligne minorée affiche bien son montant, précédé d'un « ≥ » : c'est une
      // autre façon d'être incomplet que le « à compléter », et il faut la voir ici.
      (line.partial > 0 ? `  → affiché « ≥ », ${line.partial} montant(s) manquant(s)` : ''),
  )
}
console.log(
  `total ${result.total} ¥ · lignes vides : ${result.incomplete ? 'oui' : 'non'}` +
    ` · montants manquants comptés zéro : ${result.partial}`,
)
if (!Number.isFinite(result.total)) console.log('ANOMALIE : le total n’est pas un nombre fini.')

title('Pass ferroviaires')
const passes = passAnalysis()
console.log(
  `couvert par un pass JR : ${passes.coveredJpy} ¥ (${passes.coveredLegs.length} tronçons) · ` +
    `hors pass : ${passes.notCoveredJpy} ¥ (${passes.notCoveredLegs.length})`,
)
console.log(
  `trajets JR datés : ${passes.jrJourneys} · étalés sur ${passes.jrSpanDays ?? '?'} jours · ` +
    `${passes.unpricedCovered} tronçon(s) couvert(s) sans tarif relevé (comptés zéro)`,
)
for (const verdict of passes.verdicts) {
  const fenetre = verdict.window
    ? `meilleure fenêtre ${verdict.window.start} → ${verdict.window.end} : ` +
      `${verdict.window.journeys.length} trajets, ${verdict.windowJpy} ¥ couverts, ` +
      `${verdict.outsideJpy} ¥ hors fenêtre`
    : 'aucune fenêtre calculable'
  console.log(`${verdict.name} : pass ${verdict.passJpy} ¥ · écart ${verdict.savingJpy} ¥`)
  console.log(`  ${fenetre}`)
}
console.log(`verdict tranchable : ${passes.conclusive ? 'oui' : 'non (dates manquantes)'}`)

title('Activités, spécialités et photos')
// Rappel utile ici plus qu'ailleurs : ces entrées ne viennent pas du voyageur.
// Elles sont proposées, donc marquées « estimate » — et sans prix, faute de
// grilles tarifaires relevées.
const activites = activityTotals()
const specialites = specialityTotals()
console.log(
  `${activites.count} activités sur ${DESTINATIONS.length - activites.destinationsSansActivite} étapes ` +
    `(${activites.proposees} proposées, ${activites.destinationsSansActivite} étape(s) sans aucune) · ` +
    `${activites.count - activites.withoutPrice} avec un prix relevé · ${activites.sansPhoto} sans photo`,
)
console.log(
  `${specialites.count} spécialités locales sur ${specialites.destinations} étapes · ` +
    `${specialites.sansPhoto} sans photo trouvée`,
)
const galeries = photoTotals()
console.log(
  `${galeries.fichiers} fichiers distincts · ${galeries.total} vignettes réparties · ` +
    `minimum ${galeries.minimum} par étape · ${galeries.enDessousDuSeuil.length} étape(s) sous le seuil de 9`,
)
for (const etape of galeries.enDessousDuSeuil) {
  console.log(`  ${etape.id.padEnd(14)} ${etape.count} photo(s) → enrichir \`galleryQueries\``)
}

title('Données manquantes et points de vigilance')
const missing = gaps()
console.log(
  `${missing.length} champs à compléter (dont ${missing.filter((g) => g.severity === 'blocking').length} bloquants) · ` +
    `${allWarnings().length} points de vigilance signalés`,
)

title('Cohérence avec l’itinéraire fourni')
console.log(DESTINATIONS.map((d) => `${d.order}. ${d.name}`).join('  →  '))
console.log(`${JOURNEYS.length} déplacements pour ${DESTINATIONS.length} étapes (attendu : ${DESTINATIONS.length - 1})`)

const errors = issues.filter((issue) => issue.level === 'error')
if (errors.length > 0) {
  console.log(`\n${errors.length} erreur(s) d’intégrité : à corriger avant de partager le site.`)
  process.exit(1)
}
console.log('\nContrôle des données terminé sans erreur.')

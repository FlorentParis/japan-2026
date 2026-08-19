# Traversée du Japon — carnet d’itinéraire

Site personnel de préparation d’un voyage au Japon : la carte de tout le parcours,
la frise chronologique, les hébergements, les activités, le budget et le détail
des transports, tronçon par tronçon.

## Règle de fond : aucune donnée inventée

Deux choses seulement ont été fournies : la liste des villes, puis la table des
dates et du nombre de nuits. Tout le reste est explicitement marqué :

| Marque | Signification |
| --- | --- |
| `confirmé` | donnée fournie ou réservée — les dates et les nuits, à ce jour |
| `estimé` | valeur relevée sur une grille tarifaire ou un horaire public, à revérifier |
| `à compléter` | rien n’a été fourni — **aucune valeur n’est inventée pour combler le trou** |

Conséquences visibles dans le site : aucun prix d’hôtel, aucune activité, et deux
tarifs de train (Shikoku) volontairement absents. Le budget affiche « à
compléter » là où il manque une donnée plutôt qu’un zéro.

Un montant auquel il manque une composante n’est jamais présenté comme complet :

- il vaut **`—`** quand tout ce qui le compose est inconnu (un zéro serait lu
  comme « gratuit ») ;
- il est préfixé de **`≥`** quand une partie seulement manque, avec le nombre de
  données manquantes en clair à côté.

Le verdict sur le pass ferroviaire suit la même règle. Un pass n’est valable que
sur des jours **consécutifs** : maintenant que les dates existent, le site
cherche la période d’activation la plus rentable, déduit les trajets qui tombent
en dehors, et rappelle que les tarifs restent des estimations — deux des trajets
couverts n’ayant même pas de tarif relevé, l’écart affiché sous-estime l’intérêt
du pass. Aucune économie n’est donc présentée comme acquise.

Enfin, les interprétations faites de la table de dates (un `Nuits sur place`
déduit, une étape ajoutée, une nuit regroupée) sont signalées dans la section
« Points de vigilance » de l’aperçu, jamais corrigées en silence.

Les tracés de la carte sont **schématiques** : ils suivent le corridor réel
(vallées, gares, détroits) par points de passage, mais ce ne sont pas des relevés
GPS. C’est écrit sous la carte.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173
```

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | vérification des types puis site statique dans `dist/` |
| `npm run preview` | sert `dist/` comme en production |
| `npm run lint` | oxlint |
| `npm run qa` | contrôle des données + rendu de chaque vue hors navigateur |
| `npm run qa:carte` | ouvre la carte dans un Chrome sans interface et vérifie qu’elle se dessine |
| `node scripts/fetch-photos.mjs` | régénère `src/data/photos.generated.ts` depuis Wikimedia Commons |

`npm run qa` est le contrôle à relancer après **chaque** modification des
données. Il vérifie que :

- les étapes se chaînent, et que le calendrier ne laisse ni trou ni
  chevauchement — on quitte une étape le jour où l’on arrive à la suivante ;
- le nombre de nuits de chaque étape correspond à ses dates, et que la somme
  tombe bien sur le total annoncé dans la table fournie (`NUITS_ANNONCEES`) ;
- les tronçons sont continus (l’arrivée d’un tronçon est le départ du suivant) ;
- aucun identifiant de lieu n’est inconnu ;
- les six vues rendues hors navigateur, plus la frise et la légende, ne
  contiennent ni erreur ni valeur parasite (`undefined`, `NaN`) — la vue Carte,
  qui exige un canevas WebGL, est couverte par `npm run qa:carte`.

`node .qa/rendu.mjs --dump` écrit en plus le HTML de chaque vue dans
`.qa/rendu/`, pratique pour relire un libellé exact sans ouvrir le navigateur.

`node scripts/fetch-photos.mjs` interroge l’API de Wikimedia Commons. Derrière un
proxy d’entreprise qui déchiffre le TLS, il échoue sur
`SELF_SIGNED_CERT_IN_CHAIN` : exporter la chaîne présentée
(`openssl s_client -showcerts -connect en.wikipedia.org:443`) dans un fichier
`.pem` et la passer par `NODE_EXTRA_CA_CERTS`. Ne jamais désactiver la
vérification des certificats.

`npm run qa:carte` a besoin du site servi : lancer `npm run preview` dans un
autre terminal, puis `npm run qa:carte`. Il écrit une capture dans
`.qa/carte.png` et échoue si la carte reste vide. Le site est servi sous
`/japan-2026/` (voir `base` dans `vite.config.ts`), l’URL de test est donc
`http://localhost:4173/japan-2026/`.

## Où modifier quoi

Aucune donnée de voyage n’est écrite dans un composant. Un renseignement = un
seul endroit à corriger.

| Fichier | Contient |
| --- | --- |
| `src/data/trip.ts` | titre, période, voyageurs, vols, pass candidats, hypothèses de budget, total de nuits annoncé |
| `src/data/destinations.ts` | les 17 étapes : dates, nuits, hébergement, activités, repères, avertissements |
| `src/data/places.ts` | les points géographiques (gares, ports, cols, aéroports) et leurs coordonnées |
| `src/data/journeys.ts` | les 16 déplacements et leurs 35 tronçons : mode, service, durée, prix, correspondances |
| `src/data/photos.generated.ts` | photos Wikimedia Commons avec auteur, licence et page source |

Exemples courants :

- **renseigner un hôtel** → `src/data/destinations.ts`, champ `accommodation` de l’étape ;
- **décaler une date** → `sejour('11-25', '11-27')` sur l’étape concernée, et celle
  d’avant ou d’après pour que la chaîne reste sans trou : `npm run qa` le dira ;
- **changer l’année du voyage** → la constante `ANNEE`, en haut de
  `src/data/destinations.ts`, et le total `NUITS_ANNONCEES` dans `src/data/trip.ts` ;
- **ajouter une activité** → tableau `activities` de l’étape ;
- **corriger un prix de train** → le tronçon concerné dans `src/data/journeys.ts` ;
- **renseigner un tarif manquant** → remplacer `tarifACompleter(…)` par
  `yen(…)` sur le tronçon, dans `src/data/journeys.ts` : le total des transports,
  le budget et l’analyse du pass cessent alors d’être affichés avec un `≥`.

Tout le reste (totaux, distances, durées, budget, statistiques de l’aperçu,
rentabilité du pass) est recalculé à partir de ces fichiers par `src/lib/derive.ts`.

## Organisation du code

```
src/
  data/        les données du voyage, et rien d'autre
  lib/         calculs : géométrie, GeoJSON, formats, sélecteurs, contrôles d'intégrité
  state/       sélection courante partagée entre la carte et la frise, vue courante, devise
  components/  carte, légende, frise, fiches d'étape et de trajet
  views/       les sept sections du site
  styles/      jetons de design puis feuilles par domaine
```

## Partager le site

`npm run build` produit un dossier `dist/` entièrement statique, sans serveur ni
base de données : il suffit de le déposer sur n’importe quel hébergement de
fichiers (Netlify, Cloudflare Pages, GitHub Pages, un simple dossier servi par
`npm run preview`).

Le site est déjà configuré pour GitHub Pages dans un sous-dossier : `base` vaut
`/japan-2026/` dans `vite.config.ts`, et `npm run deploy` publie `dist/` sur la
branche `gh-pages` via [`gh-pages`](https://github.com/tschaub/gh-pages). Pour un
dépôt portant un autre nom, changer `base` **et** `homepage` dans
`package.json` — sinon les fichiers JS et CSS seront cherchés à la racine du
domaine et la page restera blanche.

Réglages conservés dans le navigateur de chaque visiteur (et nulle part
ailleurs) : la devise d’affichage et les hypothèses de budget. Les données du
voyage, elles, ne viennent que des fichiers ci-dessus.

## Ressources externes

- Fond de carte : [OpenFreeMap](https://openfreemap.org/), style Positron, sans clé API
- Données cartographiques : [OpenStreetMap](https://www.openstreetmap.org/copyright)
- Photos : [Wikimedia Commons](https://commons.wikimedia.org/) — auteur et licence
  affichés sous chaque image, aucune image sous droits réservés

## Accessibilité et affichage

- les repères d’étape sont de vrais boutons HTML : atteignables au clavier et
  annoncés par un lecteur d’écran, ce qu’un marqueur dessiné dans le canevas ne
  permet pas ;
- chaque mode de transport se distingue par sa couleur **et** par la forme de son
  trait, pour rester lisible en noir et blanc ou avec un daltonisme ;
- thème clair et sombre selon le réglage du système ;
- `prefers-reduced-motion` est respecté, y compris pour les recadrages de la
  carte et le défilement de la frise ;
- sur la vue Carte, la page elle-même ne défile pas : la carte garde une hauteur
  fixe et la frise a sa propre zone de défilement, pour ne pas « piéger » le
  doigt dans la carte.

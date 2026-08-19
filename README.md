# Traversée du Japon — carnet d’itinéraire

Site personnel de préparation d’un voyage au Japon : la carte de tout le parcours,
la frise chronologique, les hébergements, les activités et spécialités locales,
une galerie par étape, le budget et le détail des transports, tronçon par tronçon.

## Règle de fond : aucune donnée inventée

Trois choses seulement ont été fournies : la liste des villes, la table des dates
et du nombre de nuits, puis les billets d’avion (1 103 €, arrivée à Narita le
6 novembre à 12 h, départ de Haneda le 5 décembre à 8 h 40). Tout le reste est
explicitement marqué :

| Marque | Signification |
| --- | --- |
| `confirmé` | donnée fournie ou réservée — les dates, les nuits et les billets d’avion, à ce jour |
| `estimé` | valeur relevée sur une grille tarifaire ou un horaire public, à revérifier |
| `à compléter` | rien n’a été fourni — **aucune valeur n’est inventée pour combler le trou** |

Conséquences visibles dans le site : aucun prix d’hôtel, et deux tarifs de train
(Shikoku) volontairement absents. Le budget affiche « à compléter » là où il
manque une donnée plutôt qu’un zéro.

### Le cas des activités, des spécialités et des photos

Le voyageur n’a fourni **aucune** activité ni spécialité : il a demandé qu’on lui
en propose. Ce qui s’affiche dans la vue « Activités et spécialités » est donc une
**proposition**, marquée `estimé` par `activitiesStatus` et `specialitiesStatus`,
et le dit explicitement à l’écran. Ce sont des faits documentés sur des lieux et
des plats publics — pas un programme arrêté, pas une réservation.

Ces entrées ne portent **volontairement aucun prix et aucune URL** : réciter une
grille tarifaire ou un nom de domaine de mémoire produirait une donnée inventée,
ce que ce projet refuse. Le budget compte les activités par une enveloppe
journalière, clairement estimée. Les tarifs réels seront relevés pour les lieux
effectivement retenus.

Les photos ne sont jamais choisies par nom de fichier devinée : chaque activité,
chaque spécialité et chaque étape déclare des **termes de recherche**
(`photoQuery`, `galleryQueries`) que `npm run photos` soumet à l’API de Wikimedia
Commons. Sans résultat exploitable, l’entrée s’affiche **sans image** — jamais
avec la photo d’un autre lieu. La vue Photos affiche le compte réel de chaque
étape et nomme celles qui restent sous le seuil de neuf, plutôt que d’affirmer
que l’objectif est atteint.

Une ville se laisse mal résumer par une photo : chaque fiche d’étape — dans
l’itinéraire comme dans la frise de la vue Carte — porte donc un **carrousel** de
toute sa galerie, et un clic sur n’importe quelle image du site l’ouvre **en
grand** dans une visionneuse que les flèches ← → parcourent. Les 160 ko de
galeries ne sont pas pour autant chargés d’emblée : `src/lib/useGalerie.ts` les
demande par un `import()` au premier rendu d’une fiche, et jusqu’à leur arrivée
le carrousel montre la photo de tête, déjà présente. Jamais de trou.

Les largeurs d’images demandées à Wikimedia ne sont pas libres : la production ne
rend qu’une liste de **tailles standard** (20, 40, 60, 120, 250, 330, 500, 960,
1280, 1920, 3840 px) et répond `400 Bad Request` à toute autre valeur. Un
`srcSet` qui proposait 400, 800 et 1600 px rendait ainsi des photos purement
invisibles — un navigateur qui trouve un `srcSet` ignore l’attribut `src`, et le
HTML avait pourtant l’air correct. La seule liste dans laquelle puiser vit
désormais dans `src/lib/vignettes.ts`.

Deux nuances, écrites aussi dans le site : la vignette d’une spécialité illustre
le **plat**, elle n’a pas été prise dans le restaurant cité ; et une œuvre d’art
contemporaine (les citrouilles de Kusama à Naoshima) n’a aucune photo sous licence
libre, elle est donc décrite sans être montrée.

Le classement par pertinence de Commons ne suffit pas : interrogé sur
« Nigirizushi », il répondait *Sashimi of São Paulo*, et sur « Miso » un pot de
miso viennois au habanero. Une image affichée sous une légende doit donc **porter
le sujet dans son nom de fichier** — c’est le garde-fou de `fetch-photos.ts`, qui
compare le mot le plus spécifique de la recherche au nom du fichier. Il écarte
aussi les gravures, les planches botaniques et les photos d’emballage. Le prix à
payer est assumé : quelques photos correctes sont perdues parce qu’elles sont
nommées en japonais ou en latin scientifique, et deux ou trois entrées restent
sans image. C’est le sens de la règle — une donnée manquante plutôt qu’une donnée
fausse. Quand un plat n’est nommé qu’en japonais sur Commons, la recherche est
écrite en kana ou en kanji (`ますのすし`), et le garde-fou se met alors en veille :
une requête sans mot latin n’a pas de mot-clé à comparer.

Le prix du billet d’avion est stocké **en euros**, parce que c’est la devise dans
laquelle il a été payé : c’est la donnée exacte. Le montant en yens qui apparaît
dans les totaux n’en est qu’une conversion, au taux indicatif de `JPY_PER_EUR`.
Jamais l’inverse — voir `Money.eur` dans `src/types.ts`.

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

Symétriquement, le budget ne surestime pas : choisir un pass déduit de la ligne
« transports » les trajets que ce pass couvre sur sa fenêtre d’activation, au
lieu de les facturer une fois au billet et une fois dans le pass.

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
| `npm run qa:photos` | dans le même Chrome : vérifie que les images arrivent, que la visionneuse et les carrousels marchent |
| `npm run photos` | régénère `src/data/photos.generated.ts` depuis Wikimedia Commons |

`npm run qa` est le contrôle à relancer après **chaque** modification des
données. Il vérifie que :

- les étapes se chaînent, et que le calendrier ne laisse ni trou ni
  chevauchement — on quitte une étape le jour où l’on arrive à la suivante ;
- le nombre de nuits de chaque étape correspond à ses dates, et que la somme
  tombe bien sur le total annoncé dans la table fournie (`NUITS_ANNONCEES`) ;
- les tronçons sont continus (l’arrivée d’un tronçon est le départ du suivant) ;
- aucun identifiant de lieu n’est inconnu ;
- aucun identifiant d’activité ou de spécialité n’est utilisé deux fois — cet
  identifiant est aussi la clé de sa photo, un doublon afficherait l’image d’un
  lieu sous le nom d’un autre ;
- les sept vues rendues hors navigateur, plus la frise et la légende, ne
  contiennent ni erreur ni valeur parasite (`undefined`, `NaN`) — la vue Carte,
  qui exige un canevas WebGL, est couverte par `npm run qa:carte`.

Il imprime aussi le compte des activités, des spécialités et des photos, avec le
nombre d’entrées sans image trouvée et les étapes sous le seuil de neuf photos.

`node .qa/rendu.mjs --dump` écrit en plus le HTML de chaque vue dans
`.qa/rendu/`, pratique pour relire un libellé exact sans ouvrir le navigateur.

`npm run photos` compile `scripts/fetch-photos.ts` avec le reste de la chaîne QA,
puis l’exécute. Le script **importe `src/data/destinations.ts`** au lieu de tenir
sa propre liste de sujets : il n’y a donc jamais deux listes à garder
synchronisées, et renommer une activité ne peut pas laisser sa photo orpheline.

Il écrit **deux** fichiers, et la séparation a une raison précise :
`photos.generated.ts` porte `PHOTOS` (la photo de chaque sujet, par son
identifiant) et `GALLERY_COUNTS` (dix-huit nombres), tous deux nécessaires dès la
première page ; `galleries.generated.ts` porte `GALLERIES`, 160 ko que seule la
vue Photos utilise. Réunis, ils feraient télécharger les quatre cents images de
galerie à qui n’ouvre que l’aperçu — c’est pourquoi `GALLERIES` ne doit être
importé que depuis du code chargé à la demande (`components/PhotoGallery.tsx` et
`lib/galleries.ts`, tous deux atteignables seulement par la vue Photos) ou par un
`import()`, comme le fait `lib/useGalerie.ts` pour les carrousels de l’itinéraire
et de la carte. Les deux fichiers sont versionnés : le site se construit sans
accès réseau.

Le script interroge l’API de Wikimedia Commons. Derrière un proxy d’entreprise qui
déchiffre le TLS, il échoue sur `SELF_SIGNED_CERT_IN_CHAIN` : exporter la chaîne
présentée (`openssl s_client -showcerts -connect en.wikipedia.org:443`) dans
`.certs/proxy.pem` — dossier ignoré par Git, propre à un poste — puis lancer

```bash
NODE_EXTRA_CA_CERTS=.certs/proxy.pem npm run photos
```

**Ne jamais désactiver la vérification des certificats** (`NODE_TLS_REJECT_UNAUTHORIZED=0`
et compagnie) : ajouter l’autorité manquante règle le problème sans ouvrir la
porte à un intermédiaire quelconque.

`npm run qa:carte` a besoin du site servi : lancer `npm run preview` dans un
autre terminal, puis `npm run qa:carte`. Il écrit une capture dans
`.qa/carte.png` et échoue si la carte reste vide. Le site est servi sous
`/japan-2026/` (voir `base` dans `vite.config.ts`), l’URL de test est donc
`http://localhost:4173/japan-2026/`. Si le port est déjà pris, `npm run preview`
en choisit un autre : passer alors l’URL en argument
(`npm run qa:photos -- http://localhost:4175/japan-2026/`).

`npm run qa:photos` a besoin du même serveur, et couvre ce que `npm run qa` ne
peut pas voir : un `<img>` rendu correctement dont le fichier n’arrive jamais.
Il parcourt la vue Photos pour déclencher le chargement paresseux et compte les
images cassées, ouvre la visionneuse pour la parcourir à la souris et au
clavier, vérifie qu’un carrousel garni existe pour chacune des dix-huit étapes
et dans la fiche ouverte sur la carte, puis demande à Wikimedia dix largeurs
pour constater lesquelles sont servies. Ce dernier contrôle est le garde-fou du
bug d’origine : il échoue si 400, 800 ou 1600 px se mettaient à fonctionner
comme si de rien n’était. À travers un proxy d’entreprise, les quatre cents
requêtes de la vue Photos ne rentrent pas toutes dans le délai imparti ; le
script distingue « en attente » de « cassée » et ne compte que la seconde.

## Où modifier quoi

Aucune donnée de voyage n’est écrite dans un composant. Un renseignement = un
seul endroit à corriger.

| Fichier | Contient |
| --- | --- |
| `src/data/trip.ts` | titre, période, voyageurs, vols, transferts d’aéroport, pass candidats, hypothèses de budget, total de nuits annoncé |
| `src/data/destinations.ts` | les 18 étapes : dates, nuits, hébergement, activités, spécialités locales, recherches de photos, repères, avertissements |
| `src/data/places.ts` | les points géographiques (gares, ports, cols, aéroports) et leurs coordonnées |
| `src/data/journeys.ts` | les 17 déplacements et leurs 35 tronçons : mode, service, durée, prix, correspondances |
| `src/data/unites.ts` | les fabriques `yen()`, `mins()`, `tarifACompleter()` — partagées par les deux fichiers ci-dessus |
| `src/data/photos.generated.ts` | **généré** par `npm run photos` : la photo de chaque sujet nommé, avec auteur, licence et page source. Ne pas modifier à la main |
| `src/data/galleries.generated.ts` | **généré** aussi : les galeries par étape, chargées seulement avec la vue Photos |

Exemples courants :

- **renseigner un hôtel** → `src/data/destinations.ts`, champ `accommodation` de l’étape ;
- **décaler une date** → `sejour('11-25', '11-27')` sur l’étape concernée, et celle
  d’avant ou d’après pour que la chaîne reste sans trou : `npm run qa` le dira ;
- **changer l’année du voyage** → la constante `ANNEE`, en haut de
  `src/data/destinations.ts`, et le total `NUITS_ANNONCEES` dans `src/data/trip.ts` ;
- **insérer ou déplacer une étape** → l’objet, dans le tableau `ETAPES` de
  `src/data/destinations.ts` : le numéro d’ordre est déduit de la position, il
  n’y a rien à renuméroter. Penser au trajet qui la relie à la précédente et à
  la suivante dans `journeys.ts` ;
- **ajouter une activité** → tableau `activities` de l’étape. Son `id` doit être
  unique dans tout le site (préfixé par l’étape : `takayama-sanmachi`) car c’est
  **aussi** la clé de sa photo : un seul identifiant, donc pas d’image orpheline
  après un renommage ;
- **ajouter une spécialité locale** → tableau `specialities` de l’étape, mêmes
  règles d’identifiant ;
- **obtenir la photo d’une activité ou d’une spécialité** → son champ
  `photoQuery` (des termes de recherche Commons, jamais un nom de fichier), puis
  `npm run photos` ;
- **étoffer la galerie d’une étape** → son tableau `galleryQueries`, puis
  `npm run photos`. La vue Photos nomme les étapes restées sous neuf images ;
- **corriger un prix de train** → le tronçon concerné dans `src/data/journeys.ts` ;
- **renseigner un tarif manquant** → remplacer `tarifACompleter(…)` par
  `yen(…)` sur le tronçon, dans `src/data/journeys.ts` : le total des transports,
  le budget et l’analyse du pass cessent alors d’être affichés avec un `≥` ;
- **corriger un trajet aéroport ⇄ ville** → le tableau `TRANSFERS` de
  `src/data/trip.ts`. Ce ne sont pas des `Journey` : ils ne relient pas deux
  étapes, donc ils ne sont ni tracés sur la carte ni comptés dans le bilan par
  mode. Ils ont leur ligne de budget et entrent dans l’analyse des pass, où
  ignorer le Narita Express sous-estimerait le JR Pass.

Tout le reste (totaux, distances, durées, budget, statistiques de l’aperçu,
rentabilité du pass) est recalculé à partir de ces fichiers par `src/lib/derive.ts`.

## Organisation du code

```
src/
  data/        les données du voyage, et rien d'autre
  lib/         calculs : géométrie, GeoJSON, formats, sélecteurs, contrôles d'intégrité
  state/       sélection courante partagée entre la carte et la frise, vue courante, devise,
               visionneuse ouverte
  components/  carte, légende, frise, fiches d'étape et de trajet, galeries et visionneuse
  views/       les huit sections du site
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
  doigt dans la carte ;
- la visionneuse est un `<dialog>` natif : la touche Échap, le piégeage du focus
  et l’inertie du reste de la page sont le travail du navigateur, pas un
  empilement de gestionnaires d’événements. Chaque photo s’y ouvre par un vrai
  bouton, donc au clavier aussi, et les carrousels se défilent au doigt comme à
  la molette (`scroll-snap`) sans dépendre de JavaScript.

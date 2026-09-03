# Traversée du Japon — carnet d’itinéraire

Site personnel de préparation d’un voyage au Japon : la carte de tout le parcours,
la frise chronologique, les hébergements, les activités et spécialités locales,
une galerie par étape, le budget et le détail des transports, tronçon par tronçon.
Et, pour une fois sur place, un mode **« Aujourd’hui »** qui ne montre que la
journée en cours.

## Règle de fond : aucune donnée inventée

Cinq choses seulement ont été fournies : la liste des villes, la table des dates
et du nombre de nuits, le fait que le voyageur part **seul**, l’itinéraire aérien
complet (1 103 € l’aller-retour, quatre vols China Eastern via Shanghai Pudong,
arrivée à Narita le 6 novembre à 12 h, départ de Haneda le 5 décembre à 8 h 40 ;
et le vol intérieur du retour, Japan Airlines JL608 Nagasaki → Haneda le
2 décembre, 9 h 50 → 11 h 20, 81,27 €) et cinq réservations d’hôtel. Tout le reste
est explicitement marqué :

| Marque | Signification |
| --- | --- |
| `confirmé` | donnée fournie ou réservée — les dates, les nuits, les trois vols et cinq hôtels, à ce jour |
| `estimé` | valeur relevée sur une grille tarifaire ou un horaire public, à revérifier |
| `à compléter` | rien n’a été fourni — **aucune valeur n’est inventée pour combler le trou** |

Conséquence visible dans le site : cinq étapes sur dix-huit ont un prix d’hôtel.
Le budget affiche « à compléter » là où il manque une donnée plutôt qu’un zéro —
et, quand une part seulement est connue comme pour l’hébergement, le montant réel
précédé d’un `≥`.

**Une exception, tracée comme telle** : les deux trains de Shikoku qui encadrent
l’étape de Matsuyama portent 6 000 ¥ chacun sur décision du voyageur. JR Shikoku ne
publie pas sa grille en ligne et japan-guide.com ne donne qu’une fourchette
(« environ 5 500 à 6 000 ¥ » pour Okayama → Matsuyama) ; ces deux montants étaient
restés vides des semaines. Ce sont les **seuls** chiffres du site qui ne viennent
pas d’une grille publique, et leurs notes le disent en majuscules à l’écran plutôt
que de les faire passer pour des relevés.

### Ce que le budget ne chiffre pas

Le budget répond à « **ce que le voyage coûte avant d’y vivre** » : billets, nuits,
pass, trajets. Les repas et les visites en ont été **retirés**, à la demande du
voyageur et pour la raison même qui fonde ce projet. Ils étaient chiffrés par deux
enveloppes journalières — 4 000 ¥ et 2 000 ¥ par jour et par personne — qu’aucune
donnée ne soutenait : à elles deux, sur trente jours, elles pesaient plus lourd que
tous les transports du voyage réunis. Un total dominé par un chiffre inventé
n’informe pas, il rassure à tort.

Reste une seule enveloppe journalière, `localTransportPerDayPerPerson` (800 ¥) :
métro, bus urbains, consignes. Elle est conservée parce que ces trajets existent
bel et bien, qu’ils ne sont dans aucune donnée d’étape, et que leur ordre de
grandeur est petit devant le reste. La vue Budget dit en clair, sous le total, que
les repas et les visites n’y sont pas — sans quoi son total se lirait comme « le
coût du voyage ». Les activités restent toutes affichées ailleurs dans le site :
c’est leur prix qui ne compte plus, pas leur existence.

### Le cas des activités, des spécialités et des photos

Le voyageur n’a fourni **aucune** activité ni spécialité : il a demandé qu’on lui
en propose. Ce qui s’affiche dans la vue « Activités et spécialités » est donc une
**proposition**, marquée `estimé` par `activitiesStatus` et `specialitiesStatus`,
et le dit explicitement à l’écran. Ce sont des faits documentés sur des lieux et
des plats publics — pas un programme arrêté, pas une réservation.

Et ce statut est **l’état final**, pas une étape vers un choix. Le voyageur a dit
qu’il n’arrêterait jamais de programme : il veut des suggestions pour les jours où
il ne saura pas où aller. `gaps()` ne signale donc **rien** du côté des activités —
un « à compléter » y réclamerait un arbitrage qui ne viendra pas, et la vue
Aujourd’hui le remonterait chaque matin dans « à boucler avant de partir » alors
qu’il n’y a rien à boucler.

Ces entrées ne portent **volontairement aucun prix et aucune URL** : réciter une
grille tarifaire ou un nom de domaine de mémoire produirait une donnée inventée,
ce que ce projet refuse. Et depuis que les enveloppes journalières « repas » et
« visites » ont été retirées, le budget ne leur attribue **plus aucun montant** :
elles ne coûtent rien à l’écran parce que rien n’est su de leur coût. L’absence de
tarif n’est donc plus un trou dans un calcul — c’est simplement une information
qu’on relèvera sur place, ou pas.

Les photos ne sont jamais choisies par nom de fichier devinée : chaque activité,
chaque spécialité et chaque étape déclare des **termes de recherche**
(`photoQuery`, `galleryQueries`) que `npm run photos` soumet à l’API de Wikimedia
Commons. Sans résultat exploitable, l’entrée s’affiche **sans image** — jamais
avec la photo d’un autre lieu. La vue Photos affiche le compte réel de chaque
étape et nomme celles qui restent sous le seuil de neuf, plutôt que d’affirmer
que l’objectif est atteint.

**Une seule exception, délibérée** : les photos d’un hébergement réservé
(`src/data/hebergements.ts`). Aucun fonds libre ne montre l’intérieur d’un hôtel
de quartier, et une image « d’ambiance » prise ailleurs serait exactement la donnée
inventée que ce projet refuse. Ce sont donc les photos que l’établissement publie
lui-même : elles ne sont **pas** libres de droits, elles sont **liées** à leur
serveur d’origine et jamais recopiées — aucun fichier sous droits n’entre dans le
dépôt ni dans `dist/` — et elles portent le même crédit cliquable que les autres,
le nom de l’établissement à la place de l’auteur et la nature du droit d’usage à
la place de la licence. Le carnet est personnel et n’est pas publié en ligne. Ce
fichier est écrit à la main : `npm run photos` n’y touche pas.

Une ville se laisse mal résumer par une photo : chaque fiche d’étape — dans
l’itinéraire comme dans la frise chronologique de la vue Carte — porte donc toute
sa galerie en **frise de photos** : plusieurs vignettes côte à côte, que
l’on pousse au doigt, à la molette ou par les deux flèches, la tranche affichée
écrite dessous (« Photos 1–4 sur 20 »). Ce n’est volontairement pas un diaporama
d’une vue à la fois — voir quatre vignettes dit tout de suite ce que l’étape
contient. La largeur d’une vignette est le seul réglage, et il vit en CSS
(`--frise-vue`, réglé par contexte : la colonne étroite de la carte, la pleine
largeur de l’itinéraire) ; `Carrousel.tsx` mesure le pas de défilement sur le DOM
plutôt que de recopier cette valeur, de sorte qu’un contexte peut changer la
taille des vignettes sans toucher au composant. Un clic sur n’importe quelle image
du site l’ouvre **en grand** dans une visionneuse que les flèches ← → parcourent.
Les 160 ko de galeries ne sont pas pour autant chargés d’emblée :
`src/lib/useGalerie.ts` les demande par un `import()` au premier rendu d’une
fiche, et jusqu’à leur arrivée la frise montre la photo de tête, déjà
présente. Jamais de trou.

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
nommées en japonais ou en latin scientifique. Reformuler la recherche vers le
terme sous lequel Commons classe réellement le sujet (le lieu plutôt que le plat,
la translittération courante plutôt que la savante) en récupère la plupart ; il
reste alors une poignée d’entrées sans image, celles que Commons ne couvre pas du
tout — un bain de quartier d’Asakusa, une installation d’art sous copyright.
C’est le sens de la règle — une donnée manquante plutôt qu’une donnée
fausse. Quand un plat n’est nommé qu’en japonais sur Commons, la recherche est
écrite en kana ou en kanji (`ますのすし`), et le garde-fou se met alors en veille :
une requête sans mot latin n’a pas de mot-clé à comparer.

Le prix du billet d’avion est stocké **en euros**, parce que c’est la devise dans
laquelle il a été payé : c’est la donnée exacte. Le montant en yens qui apparaît
dans les totaux n’en est qu’une conversion, au taux indicatif de `JPY_PER_EUR`.
Jamais l’inverse — voir `Money.eur` dans `src/types.ts`.

Ce taux est lui-même une donnée sourcée et **datée** : `1 € = 185,45 ¥`, taux de
référence quotidien de la Banque centrale européenne relevé le 20 août 2026, et
la vue Budget l’affiche avec sa date dès qu’on demande les euros. Il a
remplacé un `165` arrondi, écrit de mémoire au premier commit, qui gonflait tous
les euros du site de plus de 10 % — c’était la seule valeur du projet à échapper
à la règle de fond. Un taux de référence n’est pas le taux facturé : une carte
bancaire applique le cours du jour de la transaction et sa propre marge. Pour le
mettre à jour, relever la même source et corriger `JPY_PER_EUR` **et**
`JPY_PER_EUR_DATE` dans `src/lib/format.ts`.

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

## Les vols : une liste de tronçons, des bornes déduites

Les deux vols internationaux passent par Shanghai Pudong. Chacun est donc **deux
avions**, mais reste **un seul `Flight`** dans `src/data/trip.ts` : ce sont ses
`segments` qui portent la compagnie, le numéro, les aéroports et les horaires. Les
découper en quatre entrées aurait cassé toutes les phrases du site qui parlent du
voyage — « arrivée à Shanghai », « décollage de Shanghai » — alors que le voyageur
va à Tokyo. Le troisième vol, l’intérieur Nagasaki → Haneda, est direct : il n’a
pas de `segments`, et ses propres champs décrivent tout le trajet.

Son prix, en revanche, n’est **pas** dans `trip.ts` : ce vol est aussi le tronçon
`j16.2` de l’itinéraire, et c’est là qu’il porte son tarif — même convention que
les billets groupés, un montant écrit une seule fois. Il y est libellé en euros,
seul tronçon de `journeys.ts` dans ce cas et seul à porter un prix `confirmé` ;
c’est pourquoi les totaux de tronçons passent tous par `moneyJpy()` et jamais par
`leg.cost.jpy`, qui le compterait pour zéro.

`src/lib/vols.ts` déduit de cette liste ce dont les vues ont besoin, et rien de
plus : `itineraire(vol)` rend le premier départ, le dernier arrivée, les escales
avec leur durée, les numéros de vol, et **toutes les dates que le vol touche**.
Deux conséquences :

- **aucune durée de vol n’est calculée.** Les horaires sont locaux ;
  soustraire 12 h 25 de Paris à 7 h 00 de Shanghai ne veut rien dire sans le
  décalage de sept heures, et le changement d’heure tombe entre l’aller et le
  retour. Les durées d’**escale**, elles, sont calculées : les deux horaires sont
  au même aéroport, dans le même fuseau. `battement()` rend `undefined` — donc un
  `à compléter` — si l’escale enjambe minuit, un chiffre négatif étant pire que
  pas de chiffre. La seule durée de vol du site, les 1 h 30 du tronçon
  Nagasaki → Haneda, est **écrite** : c’est celle du billet, pas une soustraction ;

- **un vol de nuit appartient à deux journées.** L’aller décolle le 5 novembre et
  atterrit le 6 : `volDuJour()` le fait apparaître les deux jours. `TRIP.period`
  commence pourtant le **6**, parce que c’est le séjour au Japon que tout le site
  compte (nuits, fenêtres de pass, « jour N sur 30 »). Le 5 novembre est porté par
  le vol et par `departDeLaMaison()`, sur lequel le compte à rebours est calé —
  sinon il annoncerait « J−1 » à quelqu’un déjà à l’aéroport.

## Le mode « Aujourd’hui »

Les autres vues répondent à « comment est fait ce voyage ». La première,
`views/AujourdhuiView.tsx`, répond à « qu’est-ce que je fais maintenant » — la
seule question qui se pose une fois sur place : quel train part aujourd’hui, où
je dors ce soir, ce qui est fermé. Elle est ouverte par défaut **pendant** le
séjour uniquement (`vueInitiale()` dans `state/TripProvider.tsx`) ; avant et
après, la journée en cours n’a rien à montrer et l’aperçu reprend sa place.

Elle ne contient aucune donnée propre. `lib/aujourdhui.ts` répond, pour une date,
à quatre questions posées aux mêmes fichiers que le reste du site :

- **quelles étapes cette date touche-t-elle ?** Souvent deux : `dates.start` est
  le jour d’arrivée, `dates.end` le jour de départ, et le jour de départ d’une
  étape est le jour d’arrivée de la suivante. Le 17 novembre en touche trois, une
  visite sans nuit s’intercalant entre deux étapes ;
- **où dort-on ce soir ?** La seule étape dont on n’est pas encore reparti — donc
  personne le dernier jour, où le vol international repart ;
- **que se déplace-t-il ?** Les `Journey` dont c’est le jour de départ, les
  transferts d’aéroport et les vols datés du jour ;
- **quoi surveiller ?** Les avertissements des étapes, trajets et transferts du
  jour seulement — en voyage, ceux de la semaine prochaine sont du bruit.

Deux points d’attention :

- **la date change à minuit sans recharger** (`lib/useDateDuJour.ts`) : le site
  reste ouvert des heures dans un onglet de téléphone, et un « aujourd’hui » figé
  au chargement afficherait le programme de la veille au réveil ;
- **le jour est réglable à la main** (« Veille », « Lendemain »). Sans cela la vue
  serait invérifiable jusqu’au 6 novembre. Dès que la date affichée n’est pas
  celle du jour, le bandeau porte une pastille `jour simulé` et le dit en clair :
  une projection sur le calendrier, pas un état réel. Ce réglage n’est pas
  conservé — recharger la page revient au vrai jour.

## Les hébergements en japonais

Chaque hébergement réservé porte, en plus de son nom et de son adresse en alphabet
latin, ce que l’établissement publie de lui-même en japonais : `nameJa`,
`addressJa`, `phone` (voir `Accommodation` dans `src/types.ts`).

Ce n’est pas de la décoration. Une adresse en alphabet latin ne se lit pas par le
chauffeur de taxi à qui on la montre à 22 h, et le lien « Voir sur Maps » ne
s’ouvre pas sans données mobiles. L’adresse japonaise, elle, se montre telle
quelle, se recopie d’un bouton — deux lignes de kanji ne se sélectionnent pas au
doigt dans un train — et fonctionne hors connexion. Le téléphone est cliquable,
pour prévenir d’un retard ou demander où est passée la valise.

Deux règles pour ces champs :

- **l’ordre japonais est conservé** (préfecture, ville, quartier, numéro, avec le
  〒). Réordonner « à la française » rendrait l’adresse inutilisable pour son seul
  usage ;
- **rien n’est translittéré ni deviné.** Ce sont les chaînes que l’établissement
  écrit, recopiées ; là où il ne publie pas la version japonaise, le champ reste
  absent. Les rares écarts entre sources — un numéro de rue qui diffère d’une
  fiche à l’autre — sont tranchés et **commentés sur place** dans
  `src/data/destinations.ts`, jamais moyennés.

## Hors connexion, et sur l’écran d’accueil

Le carnet est fait pour être lu sur place : dans un train entre Toyama et Nagano,
avec une carte SIM étrangère et des tunnels. Or il n’a **aucune API derrière lui** —
l’itinéraire, les horaires, les adresses d’hôtel, les envois de valise sont tous
dans le paquet JavaScript. Sans service worker, une coupure réseau rendait pourtant
l’ensemble inaccessible, pour la seule raison qu’`index.html` n’avait pas pu être
rechargé. C’est ce gâchis-là que `scripts/sw-modele.js` supprime.

Concrètement : ouvrir le site une fois avec du réseau suffit à le rendre
consultable en entier sans réseau, **les neuf sections comprises** — chacune est
dans un paquet chargé à la demande, tous préchargés à l’installation.
« Ajouter à l’écran d’accueil » donne alors une vraie application, qui démarre sans
barre d’adresse et sans connexion.

**Ce qui manque hors connexion, et c’est dit dans l’interface** — un bandeau
apparaît sous l’en-tête (`components/BandeauReseau.tsx`) :

- **le fond de carte**, qui vient d’OpenFreeMap. Le tracé de l’itinéraire et les
  étapes restent affichés : `MapView` bascule sur un aplat couleur papier et le
  dit, exactement comme lorsqu’un proxy d’entreprise bloque le fournisseur ;
- **les photos jamais affichées**, qui viennent de Wikimedia Commons et des sites
  des établissements. Celles qu’on a déjà regardées, elles, restent là : le
  service worker garde les images et les tuiles **au fur et à mesure**, plafonnées
  à 500 entrées. C’est aussi ce qui économise le forfait en itinérance — une tuile
  déjà vue n’est jamais retéléchargée.

Embarquer tuiles et photos aurait pesé des centaines de mégaoctets, et aurait fait
du carnet un redistributeur d’images qu’il n’est pas (voir
`src/data/hebergements.ts`).

Trois points de mise en œuvre qui méritent d’être connus avant d’y toucher :

- **la liste de précache est produite au build**, par `scripts/sw-plugin.ts`, parce
  qu’elle contient les noms empreintés (`index-mMTic-cm.js`) et le contenu de
  `public/`, que Rollup ne voit pas. Un précache qui référence un fichier disparu
  échoue *en entier* : le mode hors ligne s’évanouirait sans un message ;
- **la mise à jour ne s’impose jamais.** Une nouvelle version s’installe en
  arrière-plan puis attend ; le bandeau propose de recharger. Sans cela, une
  correction poussée pendant qu’on lit une page échangerait le code sous les pieds
  de l’onglet — et une application installée ne se rafraîchit pas d’un F5 : sans ce
  bandeau, un horaire corrigé la veille du départ resterait invisible tout le
  voyage ;
- **« hors connexion » n’est pas lu dans `navigator.onLine`**, qui se trompe dans
  les deux sens : il annonce « en ligne » derrière un portail captif d’hôtel, et
  aussi au démarrage d’une application installée sans réseau. `lib/reseau.ts` ne le
  croit donc que lorsqu’il dit « non » — ce sens-là est fiable — et vérifie un
  « oui » par une vraie requête, que le service worker laisse délibérément passer.

`npm run qa:hors-ligne` rejoue tout le scénario dans Chrome : première visite avec
réseau, vérification que le cache contient bien les fichiers émis, coupure,
rechargement, puis ouverture des cinq sections chargées à la demande. C’est le seul
contrôle possible ici — un service worker ne s’exécute pas sous Node, et un test
qui relirait `dist/sw.js` ne prouverait que la présence de son propre texte.

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
| `npm run qa:tiroir` | émule un téléphone et manœuvre le tiroir des étapes de la vue Carte |
| `npm run qa:hors-ligne` | installe le site dans Chrome, coupe le réseau, et vérifie que le carnet s’affiche quand même |
| `npm run photos` | régénère `src/data/photos.generated.ts` depuis Wikimedia Commons |
| `npm run icones` | régénère les icônes PNG d’application depuis `public/favicon.svg` |

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
  qui exige un canevas WebGL, est couverte par `npm run qa:carte` ;
- la vue Aujourd’hui se rend sur **huit dates choisies** et non une seule : elle
  dépend du jour, et un contrôle passé le 26 août ne verrait jamais autre chose
  que le compte à rebours. La liste `JOURNEES` de `scripts/qa-rendu.tsx` couvre
  l’avant-départ, le 5 novembre (jour du décollage de Paris, le seul où le compte
  à rebours tombe à zéro), le premier jour au Japon, une journée de trajet, une
  journée sur place, le 17 novembre (trois étapes le même jour), le dernier jour
  et l’après-voyage.

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

`npm run qa:tiroir` a besoin du même serveur. Il émule un iPhone (390 × 844,
pointeur tactile) parce que le tiroir de la vue Carte n'existe qu'à cette taille :
ses trois hauteurs sont calculées en JavaScript à partir de l'écran et de
l'en-tête réels, donc ni le contrôle de rendu (hors navigateur) ni
`npm run qa:carte` (fenêtre de bureau) ne peuvent en dire quoi que ce soit. Il
vérifie que la carte occupe toute la hauteur, que chaque appui sur la poignée
fait passer le tiroir de « à moitié » à « plein » puis à « replié », que replié il
ne garde que son en-tête sans disparaître, que la légende ne s'affiche que sur
demande, et que taper un repère sur la carte entrouvre le tiroir. Captures dans
`.qa/tiroir.png` et `.qa/tiroir-legende.png`.

`npm run qa:photos` a besoin du même serveur, et couvre ce que `npm run qa` ne
peut pas voir : un `<img>` rendu correctement dont le fichier n’arrive jamais.
Il parcourt la vue Photos pour déclencher le chargement paresseux et compte les
images cassées, ouvre la visionneuse pour la parcourir à la souris et au
clavier, vérifie qu’une frise garnie existe pour chacune des dix-huit étapes
et dans la fiche ouverte sur la carte — et qu’elle se comporte en frise :
plusieurs vignettes en vue, une flèche qui pousse d’exactement une vignette, un
compteur qui donne la tranche, une flèche de droite qui se désactive au bout.
C’est mesuré dans le navigateur, la largeur d’une vignette étant un `clamp()`
que rien ne connaît hors du CSS. Il demande enfin à Wikimedia dix largeurs
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
| `src/data/bagages.ts` | les 4 envois de valise d’hôtel à hôtel (takkyūbin), les hébergements où ne rien faire livrer, et les règles de guichet |
| `src/data/unites.ts` | les fabriques `yen()`, `euros()`, `mins()`, `minsFermes()`, `tarifACompleter()` — partagées par les deux fichiers ci-dessus |
| `src/data/hebergements.ts` | écrit à la main : les photos des hébergements réservés, rattachées par `accommodation.photosId`. Les seules images non libres du site (voir plus haut) |
| `src/data/photos.generated.ts` | **généré** par `npm run photos` : la photo de chaque sujet nommé, avec auteur, licence et page source. Ne pas modifier à la main |
| `src/data/galleries.generated.ts` | **généré** aussi : les galeries par étape, chargées seulement avec la vue Photos |

Exemples courants :

- **renseigner un hôtel** → `src/data/destinations.ts`, champ `accommodation` de
  l’étape : `name`, `area`, `price`, `nights`, `bookingUrl`, et pour une
  réservation faite `address`, `coord` (le lien Maps et le repère sur la carte sont
  construits sur les coordonnées, pas sur l’adresse), `checkIn`, `checkOut` ;
- **ajouter les photos d’un hôtel réservé** → une entrée dans
  `src/data/hebergements.ts` — les URL, les dimensions et la catégorie de chaque
  image se relèvent sur la page officielle de l’établissement, comme l’explique
  l’en-tête du fichier — puis son `photosId` sur l’étape ;
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
- **ajouter, décaler ou supprimer un envoi de valise** → le tableau `EXPEDITIONS`
  de `src/data/bagages.ts`, et rien d’autre. On y écrit d’où, vers où, quel jour
  on remet le colis et pour quelle date on fait désigner la livraison ; les étapes
  traversées — celles qui se font **sans valise** — sont déduites des numéros
  d’ordre par `src/lib/bagages.ts`. Kamikōchi n’est donc jamais marqué « sans
  valise » quelque part : il l’est parce qu’il tombe entre Matsumoto et Takayama.
  `npm run qa` refuse une remise ou une livraison qui tomberait en dehors des dates
  de l’étape concernée, et deux envois qui se chevauchent — il n’y a qu’une valise ;
- **corriger le tarif d’un envoi** → ce n’est pas une donnée du voyage mais une
  hypothèse : `budgetDefaults.luggageForwardingPerShipment` dans
  `src/data/trip.ts`, réglable dans la vue Budget. La grille Yamato dépend de la
  taille du colis et du couple de préfectures, et elle n’a pas été relevée ;
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
  views/       les neuf sections du site
  styles/      jetons de design puis feuilles par domaine
scripts/       outils hors application : contrôles, générateurs, service worker
```

`scripts/` n’est jamais embarqué dans le site, à une exception près :
`sw-modele.js` est un modèle que `sw-plugin.ts` complète au build pour écrire
`dist/sw.js`. Le reste — contrôles CDP, générateur de photos, générateur d’icônes —
ne tourne qu’en ligne de commande.

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
domaine et la page restera blanche. `base` détermine aussi la portée du service
worker et le `start_url` de l’application installée ; comme tous les chemins du
manifeste et du service worker sont relatifs, il n’y a rien d’autre à modifier.

`dist/` contient donc, en plus du site : `manifest.webmanifest` et les icônes
(recopiés de `public/`), et `sw.js` (écrit par le plugin). L’hébergeur doit servir
le tout en **HTTPS** — sans quoi le navigateur refuse le service worker, et le
site fonctionne comme avant, sans mode hors ligne. GitHub Pages le fait d’office.

Réglages conservés dans le navigateur de chaque visiteur (et nulle part
ailleurs) : la devise d’affichage et les hypothèses de budget. Les données du
voyage, elles, ne viennent que des fichiers ci-dessus.

## Ressources externes

- Fond de carte : [OpenFreeMap](https://openfreemap.org/), style Positron, sans clé API
- Données cartographiques : [OpenStreetMap](https://www.openstreetmap.org/copyright)
- Photos : [Wikimedia Commons](https://commons.wikimedia.org/) — auteur et licence
  affichés sous chaque image
- Seule exception, et seules images non libres du site : les photos que les
  hébergements réservés publient d’eux-mêmes (aujourd’hui
  [Tabist Urban Stays Asakusa](https://tabist.co.jp/en/h/B13HUSA)) — liées à leur
  serveur d’origine, jamais recopiées dans le dépôt, et créditées sous chaque image

## Accessibilité et affichage

- les repères d’étape sont de vrais boutons HTML : atteignables au clavier et
  annoncés par un lecteur d’écran, ce qu’un marqueur dessiné dans le canevas ne
  permet pas ;
- chaque mode de transport se distingue par sa couleur **et** par la forme de son
  trait, pour rester lisible en noir et blanc ou avec un daltonisme ;
- thème clair et sombre selon le réglage du système ;
- `prefers-reduced-motion` est respecté, y compris pour les recadrages de la
  carte et le défilement de la frise ;
- sur la vue Carte, la page elle-même ne défile pas : la frise a sa propre zone
  de défilement, pour ne pas « piéger » le doigt dans la carte ;
- sur cette même vue, **sur téléphone**, la frise devient un tiroir posé sur la
  carte (`lib/useTiroir.ts`) : la carte occupe alors tout l’écran, et la liste
  des étapes s’ouvre à trois hauteurs — replié, à moitié, plein — au doigt comme
  au clavier (la poignée est un vrai bouton : Entrée fait défiler les paliers,
  ↑ et ↓ les parcourent). Replié, le tiroir devient `inert` : une tabulation ne
  peut pas se perdre sur des boutons cachés sous la carte. La légende des modes,
  qui prenait un bon quart de la hauteur pour un texte qu’on lit une fois, passe
  derrière le bouton « Modes » de son en-tête ;
- la visionneuse est un `<dialog>` natif : la touche Échap, le piégeage du focus
  et l’inertie du reste de la page sont le travail du navigateur, pas un
  empilement de gestionnaires d’événements. Chaque photo s’y ouvre par un vrai
  bouton, donc au clavier aussi, et les frises de photos se défilent au doigt
  comme à la molette (`scroll-snap`) sans dépendre de JavaScript — leurs flèches
  ne font que pousser ce défilement, elles ne le remplacent pas ; la piste est
  elle-même atteignable au clavier (`tabIndex`), les flèches ← → du clavier la
  parcourent alors.

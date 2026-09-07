/**
 * FICHE PRATIQUE — ce qu'il faut avoir sous les yeux le jour où ça va mal.
 *
 * C'est la seule page du carnet qu'on espère n'ouvrir jamais, et la seule qui
 * doive marcher sans réseau, sans batterie de recherche, sans réfléchir. Elle
 * existe parce que le voyageur part **seul** : il n'y a personne d'autre à qui
 * demander le numéro des secours.
 *
 * La règle du projet s'applique ici plus durement qu'ailleurs. Un numéro de
 * téléphone récité de mémoire est la pire donnée inventée possible : elle a l'air
 * juste, on ne la vérifie pas, et on s'en aperçoit au moment où l'on en a besoin.
 * Chaque entrée porte donc sa `source` — le nom de l'organisme, l'adresse de la
 * page, et la date à laquelle elle y a été relevée. Ce qui n'a pas été trouvé
 * reste `todo` et le dit à l'écran, comme les prix d'hôtel manquants.
 *
 * Ce fichier est écrit à la main, comme `hebergements.ts`. Aucun script ne le
 * remplit. Avant le départ, tout revérifier une fois : un numéro d'urgence change
 * rarement, un horaire de consulat souvent.
 */
import type { Certainty } from '../types'

/** D'où vient une information, et quand elle y a été lue. */
export type Source = {
  /** L'organisme qui la publie — c'est lui qui fait autorité, pas le site. */
  nom: string
  url: string
  /** Date du relevé, en clair. Un numéro sans date de vérification ne vaut rien. */
  releve: string
}

/**
 * Un contact joignable par téléphone.
 *
 * `numero` est la forme à composer **depuis le Japon**, telle que la source
 * l'écrit. `numeroInternational` est la même ligne au format international : elle
 * sert si le téléphone est resté configuré sur un opérateur français, cas
 * fréquent en itinérance, où le `0` initial d'un numéro japonais ne passe pas.
 *
 * `usage` est obligatoire, et dit aussi à quoi le numéro **ne** sert pas. Un
 * numéro d'urgence consulaire appelé pour une question de passeport perdu occupe
 * la ligne de quelqu'un qui saigne.
 */
export type Contact = {
  id: string
  label: string
  numero?: string
  numeroInternational?: string
  /** Heures d'ouverture, ou « 24 h/24 ». Absent = inconnu, pas « toujours ». */
  quand?: string
  /** Langues dans lesquelles on est réellement compris. */
  langues?: string
  usage: string
  certainty: Certainty
  source?: Source
  note?: string
}

const AMBASSADE_SOURCE: Source = {
  nom: 'Ambassade de France au Japon',
  url: 'https://jp.diplomatie.gouv.fr/fr/ambassade-de-france-tokyo',
  releve: '7 septembre 2026',
}

const CONSULAT_SOURCE: Source = {
  nom: 'Section consulaire de l’ambassade de France à Tokyo',
  url: 'https://jp.diplomatie.gouv.fr/fr/section-consulaire-de-lambassade-de-france-tokyo',
  releve: '7 septembre 2026',
}

const URGENCE_SOURCE: Source = {
  nom: 'Ambassade de France au Japon — « En cas d’urgence »',
  url: 'https://jp.diplomatie.gouv.fr/fr/en-cas-durgence',
  releve: '7 septembre 2026',
}

const JNTO_SOURCE: Source = {
  nom: 'Japan National Tourism Organization',
  url: 'https://www.jnto.go.jp/emergency/eng/mi_guide.html',
  releve: '7 septembre 2026',
}

/**
 * LES DEUX NUMÉROS À CONNAÎTRE PAR CŒUR.
 *
 * Ils sont à part du reste, et affichés en grand : ce sont les seuls qu'on
 * compose sans avoir le temps de lire une page. Tous deux sont gratuits, joignables
 * depuis n'importe quel téléphone y compris sans carte SIM, et confirmés par deux
 * sources indépendantes — la fiche d'urgence de l'ambassade de France et celle du
 * JNTO.
 *
 * Le point qui surprend un Français et qu'il faut avoir lu **avant** : au Japon,
 * l'ambulance n'a pas de numéro propre. C'est le 119, celui des pompiers, pour les
 * deux. Chercher un équivalent du 15 fait perdre le seul temps qui compte.
 */
export const SECOURS: Contact[] = [
  {
    id: 'police',
    label: 'Police',
    numero: '110',
    quand: '24 h/24',
    usage:
      'Vol, agression, accident de la route, disparition. C’est aussi le numéro pour faire établir la déclaration qu’une assurance réclamera ensuite.',
    certainty: 'confirmed',
    source: JNTO_SOURCE,
  },
  {
    id: 'secours',
    label: 'Pompiers et ambulance',
    numero: '119',
    quand: '24 h/24',
    usage:
      'Incendie, malaise, blessure grave. Un seul numéro pour les deux : il n’existe pas de numéro d’ambulance distinct au Japon.',
    certainty: 'confirmed',
    source: JNTO_SOURCE,
  },
]

/**
 * SE FAIRE COMPRENDRE, ET SE FAIRE AIDER EN FRANÇAIS.
 *
 * Le 110 et le 119 sauvent la vie ; ils ne parlent pas français, et rarement
 * anglais. Ces trois lignes-ci servent à ce qui vient après : trouver un hôpital
 * qui reçoit un étranger, ou joindre quelqu'un qui parle sa langue.
 */
export const ASSISTANCE: Contact[] = [
  {
    id: 'hotline-visiteurs',
    label: 'Japan Visitor Hotline (JNTO)',
    numero: '050-3816-2787',
    quand: '24 h/24, 365 jours par an',
    langues: 'anglais, chinois, coréen — pas le français',
    usage:
      'La ligne à appeler pour être orienté vers un établissement de santé qui reçoit en langue étrangère, et en cas de catastrophe. Utile aussi comme interprète de fait quand personne ne se comprend.',
    certainty: 'confirmed',
    source: JNTO_SOURCE,
  },
  {
    id: 'urgence-consulaire',
    label: 'Urgence consulaire française',
    numero: '080-9539-3970',
    numeroInternational: '+81 80 9539 3970',
    quand: 'hors heures d’ouverture de l’ambassade',
    langues: 'français',
    usage:
      'Strictement en cas d’urgence humaine avérée concernant un ressortissant français : accident grave, décès, enlèvement, agression, arrestation. Rien d’autre — ni passeport perdu, ni question administrative.',
    certainty: 'confirmed',
    source: URGENCE_SOURCE,
  },
  {
    id: 'ambassade',
    label: 'Ambassade de France à Tokyo — standard',
    numero: '03-5798-6000',
    numeroInternational: '+81 3 5798 6000',
    quand: 'heures de bureau',
    langues: 'français',
    usage: 'Le standard. Pour tout ce qui n’est pas une urgence vitale.',
    certainty: 'confirmed',
    source: AMBASSADE_SOURCE,
  },
  {
    id: 'consulat',
    label: 'Section consulaire — appel local',
    numero: '03-4578-4174',
    quand: 'heures de bureau',
    langues: 'français',
    usage:
      'Passeport perdu ou volé, état civil, difficulté administrative. C’est ici qu’on appelle pour un laissez-passer permettant de rentrer sans passeport.',
    certainty: 'confirmed',
    source: CONSULAT_SOURCE,
    note: 'Les services consulaires reçoivent sur rendez-vous uniquement.',
  },
  {
    id: 'france-consulaire',
    label: 'France Consulaire',
    quand: 'du lundi au vendredi, 15 h – 21 h heure du Japon (hors jours fériés français)',
    langues: 'français',
    usage:
      'Le service téléphonique du ministère qui répond aux questions consulaires courantes, depuis la France. Ses horaires japonais sont ceux de la source ; son numéro n’y figurait pas.',
    certainty: 'todo',
    source: CONSULAT_SOURCE,
    note: 'Numéro à relever avant le départ sur le site de France Consulaire — il n’est pas écrit ici de mémoire.',
  },
]

/**
 * CE QUI NE PEUT VENIR QUE DU VOYAGEUR.
 *
 * Ces trois numéros n'existent dans aucune source publique : ils dépendent de la
 * banque et de l'assureur de la personne qui part. Ils sont pourtant les plus
 * urgents de la page — une carte bancaire avalée un dimanche soir à Matsuyama, et
 * il n'y a plus d'argent du tout jusqu'au lundi.
 *
 * Ils restent donc `todo`, visibles, avec le fichier à éditer. C'est exactement le
 * traitement des prix d'hôtel manquants : une case vide qui réclame, plutôt qu'un
 * numéro plausible.
 */
export const A_RECOPIER: Contact[] = [
  {
    id: 'opposition-carte',
    label: 'Opposition carte bancaire',
    usage:
      'Carte perdue, volée, ou avalée par un distributeur. À relever au dos de la carte ou dans l’application de la banque, au format international : le numéro vert français ne se compose pas depuis le Japon.',
    certainty: 'todo',
  },
  {
    id: 'assurance-voyage',
    label: 'Assistance de l’assurance voyage',
    usage:
      'Numéro d’assistance et numéro de contrat. Beaucoup d’assurances exigent d’être appelées **avant** l’hospitalisation pour prendre les frais en charge : le trouver sur place, en anglais, à l’accueil d’un hôpital, est exactement ce qu’on veut éviter.',
    certainty: 'todo',
  },
  {
    id: 'contact-france',
    label: 'Personne à joindre en France',
    usage:
      'Un nom et un numéro, au format international. C’est ce que demande un hôpital ou un consulat, et c’est ce qu’un téléphone verrouillé ne donne pas.',
    certainty: 'todo',
  },
]

/**
 * L'ADRESSE DE L'AMBASSADE, à montrer plutôt qu'à prononcer.
 *
 * Même raisonnement que `addressJa` pour les hébergements (voir `types.ts`) :
 * « 4-11-44 Minami-Azabu » ne se lit pas par un chauffeur de taxi. La forme
 * japonaise est là pour être montrée ou recopiée, et elle fonctionne hors
 * connexion.
 *
 * `adresseJaCertainty` vaut `estimate`, et c'est important : contrairement aux
 * adresses d'hôtels, celle-ci n'a **pas** été recopiée depuis une page japonaise de
 * l'ambassade. C'est la transcription des toponymes de l'adresse latine relevée à
 * la source — 港区 pour Minato-ku, 南麻布 pour Minami-Azabu, le code postal
 * inchangé. Les toponymes ne sont pas ambigus, l'ordre est l'ordre japonais, mais
 * ce n'est pas un relevé et la page le dit.
 *
 * Pas de coordonnées, donc pas de lien Maps : `lienMaps()` est bâtie sur des
 * coordonnées exactement pour ne pas lancer une recherche approximative, et aucune
 * n'a été relevée pour ce bâtiment.
 */
export const AMBASSADE = {
  nom: 'Ambassade de France au Japon',
  adresse: '4-11-44 Minami-Azabu, Minato-ku, Tokyo 106-8514',
  adresseJa: '〒106-8514 東京都港区南麻布4-11-44',
  adresseJaCertainty: 'estimate' as Certainty,
  courriel: 'admin-francais.tokyo-amba@diplomatie.gouv.fr',
  source: AMBASSADE_SOURCE,
} as const

/**
 * Une phrase à montrer ou à prononcer.
 *
 * `ja` est ce qu'on **montre** — c'est la version qui marche à coup sûr, et la
 * raison d'être de cette liste. `romaji` est ce qu'on tente de dire ; il est là par
 * honnêteté sur ce qu'une transcription permet, c'est-à-dire pas grand-chose.
 */
export type Phrase = {
  fr: string
  ja: string
  romaji: string
  note?: string
}

/**
 * DIX PHRASES, pas cinquante.
 *
 * Un lexique de voyage ne se lit pas dans l'urgence. Celles-ci sont retenues sur
 * un seul critère : elles servent quand quelque chose va mal, ou quand rien ne
 * passe. Les formules de politesse et le vocabulaire du restaurant n'y sont pas —
 * il y a des applications pour ça, et elles demandent du réseau.
 *
 * Ce sont des formulations standard, en japonais poli neutre (forme en -masu),
 * telles qu'on les trouve dans n'importe quel manuel. Contrairement au reste du
 * carnet elles ne portent pas de source précise : ce n'est pas un relevé sur une
 * grille tarifaire, c'est de la langue. La page le dit plutôt que d'invoquer une
 * autorité qu'elle n'a pas.
 */
export const PHRASES: Phrase[] = [
  {
    fr: 'Aidez-moi, s’il vous plaît.',
    ja: '助けてください。',
    romaji: 'Tasukete kudasai.',
  },
  {
    fr: 'Appelez une ambulance, s’il vous plaît.',
    ja: '救急車を呼んでください。',
    romaji: 'Kyūkyūsha o yonde kudasai.',
  },
  {
    fr: 'Appelez la police, s’il vous plaît.',
    ja: '警察を呼んでください。',
    romaji: 'Keisatsu o yonde kudasai.',
  },
  {
    fr: 'J’ai mal ici.',
    ja: 'ここが痛いです。',
    romaji: 'Koko ga itai desu.',
    note: 'À dire en montrant l’endroit. C’est la phrase la plus efficace de la liste.',
  },
  {
    fr: 'Où est l’hôpital le plus proche ?',
    ja: '一番近い病院はどこですか。',
    romaji: 'Ichiban chikai byōin wa doko desu ka.',
  },
  {
    fr: 'J’ai une allergie.',
    ja: 'アレルギーがあります。',
    romaji: 'Arerugī ga arimasu.',
    note: 'Pour nommer l’allergène, le montrer écrit vaut mieux que de le prononcer.',
  },
  {
    fr: 'Je ne parle pas japonais.',
    ja: '日本語が話せません。',
    romaji: 'Nihongo ga hanasemasen.',
  },
  {
    fr: 'Parlez-vous anglais ?',
    ja: '英語が話せますか。',
    romaji: 'Eigo ga hanasemasu ka.',
  },
  {
    fr: 'J’ai perdu mon passeport.',
    ja: 'パスポートをなくしました。',
    romaji: 'Pasupōto o nakushimashita.',
    note: 'Le remplacer par 財布 (saifu, portefeuille) ou 鞄 (kaban, sac) selon le cas.',
  },
  {
    fr: 'Je voudrais aller à cette adresse.',
    ja: 'この住所までお願いします。',
    romaji: 'Kono jūsho made onegai shimasu.',
    note:
      'La phrase du taxi : à dire en montrant l’adresse japonaise de l’hôtel, que la vue Hôtels affiche et permet de copier pour chaque étape réservée.',
  },
]

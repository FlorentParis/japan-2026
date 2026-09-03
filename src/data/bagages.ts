/**
 * LES ENVOIS DE VALISE — source de vérité.
 *
 * ▸ Le voyageur veut limiter au maximum d'avoir sa valise avec lui. Trois
 *   passages du voyage la rendent franchement pénible, et un la rend impossible :
 *   la route alpine Tateyama-Kurobe se traverse en funiculaire, téléphériques et
 *   bus de tunnel, sans soute. C'est cet envoi-là qui commande les autres.
 *
 * ▸ Quatre envois suffisent. On n'en a pas ajouté « pour le confort » : chaque
 *   envoi coûte une ou deux nuits sans la valise, et un envoi de plus qui ne
 *   supprime aucun portage serait une dépense et un risque pour rien. Les trajets
 *   de gare à gare (Nagano → Kurashiki, Matsuyama → Fukuoka) se font très bien
 *   avec la valise en porte-bagages, et le retour Nagasaki → Tokyo est un vol :
 *   la valise part en soute, l'expédier n'aurait aucun sens.
 *
 * ▸ Les dates ne sont pas inventées : elles se lisent sur le calendrier de
 *   `destinations.ts`. `sentOn` est un jour où l'on est encore dans la ville de
 *   départ, `deliveredOn` un jour où l'on est déjà dans celle d'arrivée —
 *   `checkIntegrity()` le vérifie, et refuse une date qui tomberait à côté.
 *
 * ▸ Les délais retenus sont tous « J+1 » et c'est le point à confirmer au
 *   guichet : Yamato annonce le lendemain entre préfectures voisines et deux jours
 *   sur les longues distances, mais aucun de ces quatre envois n'a été vérifié sur
 *   une grille de délais réelle. D'où `certainty: 'estimate'` partout, et la date
 *   de livraison désignée (配達日指定) qui sert de filet : c'est elle qu'on fait
 *   inscrire, pas « au plus vite ».
 *
 * ▸ Aucun prix n'est écrit ici. La grille Yamato dépend de la taille du colis et
 *   du couple de préfectures ; la réciter de mémoire serait exactement la donnée
 *   inventée que ce carnet refuse. Le budget compte donc les envois avec un tarif
 *   unitaire réglable dans les hypothèses, annoncé comme tel.
 */
import type { Expedition } from '../types'

/**
 * Les trois hébergements vers lesquels il ne faut **pas** expédier, et pourquoi.
 *
 * C'est une liste de refus, et elle a autant de valeur que les envois eux-mêmes :
 * un colis qui arrive dans un hébergement de cinq chambres, ou dans un hôtel pas
 * encore réservé, est un problème bien pire que la valise sur le dos.
 */
export const HEBERGEMENTS_A_EVITER: Array<{ destination: string; raison: string }> = [
  {
    destination: 'kamikochi',
    raison:
      'Guesthouse Tomoshibi : cinq chambres à Sawando, en fond de vallée. Rien n’oblige à lui faire garder un colis — la valise est déjà partie vers Takayama.',
  },
  {
    destination: 'shirakawago',
    raison:
      'GuestHouse Shirakawa-Go INN : cinq chambres, arrivée à partir de 16 h et une seule navette le matin. Le village se visite à pied, une valise n’y a pas sa place.',
  },
  {
    destination: 'omachi',
    raison:
      'Hébergement pas encore réservé, et Ōmachi Onsen-kyō est une petite station thermale. La valise saute donc Shinano-Ōmachi et va directement à Nagano.',
  },
]

/**
 * Ce qu'il faut savoir pour que ces quatre envois se passent bien.
 *
 * Ce ne sont pas des généralités sur le Japon : chaque ligne a corrigé un piège
 * concret de ce voyage-ci — un départ à 6 h de Toyama, un ramassage un dimanche à
 * Hiroshima, un jour férié le 23 novembre.
 */
export const REGLES_EXPEDITION: string[] = [
  'Sur le bordereau, côté destinataire : nom, adresse et téléphone de l’hôtel, puis votre nom et la date d’arrivée. Sans la date d’arrivée, la réception n’a aucune raison d’accepter un colis pour un inconnu.',
  'Faire désigner la date de livraison (配達日指定) : c’est gratuit, et c’est ce qui empêche un colis d’arriver la veille dans un hôtel qui ne vous attend pas.',
  'Un hôtel n’a en général qu’un seul ramassage par jour, souvent entre 10 h et 12 h. Dès que le départ est matinal — Toyama le 17 novembre —, remettre la valise à la réception la veille au soir.',
  'Prévenir l’hôtel destinataire avant chaque envoi, par courriel. C’est une minute, et c’est ce qui distingue un colis attendu d’un colis refusé.',
  'Ne jamais mettre dans la valise expédiée : passeport, médicaments, chargeurs, pass ferroviaire, et tout ce qui sert dans les 48 heures.',
  'Sur les shinkansen des lignes Tōkaidō, San’yō et Kyūshū, un bagage dont la somme des trois dimensions dépasse 160 cm exige une place « bagage encombrant » réservée. Une valise standard passe ; une très grande non.',
]

/**
 * Les envois, dans l'ordre du voyage.
 *
 * Chaque entrée dit ce qu'elle évite : c'est la seule justification acceptable
 * pour deux jours sans ses affaires.
 */
export const EXPEDITIONS: Expedition[] = [
  {
    id: 'exp-matsumoto-takayama',
    fromDestination: 'matsumoto',
    toDestination: 'takayama',
    sentOn: '2026-11-10',
    deliveredOn: '2026-11-11',
    certainty: 'estimate',
    reason:
      'Kamikōchi et les navettes de montagne : train jusqu’à Shin-Shimashima, bus jusqu’à Sawando, puis bus jusqu’à Hirayu et Takayama. Quatre correspondances de montagne avec une valise, pour une seule nuit.',
    note: 'Remise le matin du 10 au Toyoko Inn, livraison désignée au 11 au Yutoria Resort. La nuit du 10 à Sawando se fait avec un sac de jour — la vallée se visite de toute façon sans bagage, l’hébergement étant à l’entrée routière.',
    warnings: [
      'Matsumoto (Nagano) → Takayama (Gifu) : préfectures voisines mais route de montagne. Délai à confirmer à la réception ; si le lendemain n’est pas garanti, remettre la valise dès le 9 avec livraison désignée au 11.',
    ],
  },
  {
    id: 'exp-takayama-kanazawa',
    fromDestination: 'takayama',
    toDestination: 'kanazawa',
    sentOn: '2026-11-13',
    deliveredOn: '2026-11-14',
    certainty: 'estimate',
    reason:
      'Shirakawa-gō : village de maisons gasshō entièrement piéton, arrivée à l’hébergement à partir de 16 h seulement et une seule navette depuis le terminal de bus. Sans envoi, la journée du 13 se passe à faire garder la valise à la consigne du terminal.',
    note: 'Remise le matin du 13 au Yutoria Resort, livraison désignée au 14 à l’Arigato Stay Kanazawa Katamachi. Une nuit à Shirakawa-gō avec un sac de jour — douches partagées, il ne faut pas grand-chose.',
    warnings: [
      'L’hôtel de Kanazawa est réservé, mais rien ne dit encore qu’il accepte les colis : la livraison du 14 tombe avant l’heure d’arrivée (15 h), il faut donc que quelqu’un soit là pour la recevoir. À confirmer auprès de l’établissement avant de remettre la valise.',
    ],
  },
  {
    id: 'exp-toyama-nagano',
    fromDestination: 'toyama',
    toDestination: 'nagano',
    sentOn: '2026-11-17',
    deliveredOn: '2026-11-18',
    certainty: 'estimate',
    reason:
      'La route alpine Tateyama-Kurobe, traversée d’ouest en est le 17 : funiculaire, bus d’altitude, téléphériques et bus de tunnel. Les bagages ne passent pas — c’est le seul envoi du voyage qui ne soit pas un choix de confort.',
    note: 'La valise saute Shinano-Ōmachi et va directement à Nagano : deux nuits y sont prévues, et l’hébergement du 17 n’est pas réservé. Départ de Toyama très tôt le 17 — remettre la valise à la réception le soir du 16, en demandant l’expédition du 17 et la livraison désignée au 18.',
    warnings: [
      'À comparer avec le service de transfert de bagages propre à la route alpine, entre Toyama ou Tateyama et Ōgizawa ou Shinano-Ōmachi, qui livre en principe le jour même : fonctionnement 2026 et disponibilité à la mi-novembre à vérifier sur le site officiel de la route.',
    ],
  },
  {
    id: 'exp-hiroshima-takamatsu',
    fromDestination: 'hiroshima',
    toDestination: 'takamatsu',
    sentOn: '2026-11-22',
    deliveredOn: '2026-11-23',
    certainty: 'estimate',
    reason:
      'Naoshima le 23 : shinkansen jusqu’à Okayama, train jusqu’à Uno, ferry pour l’île, musées, puis second ferry pour Takamatsu. Comme on ne repasse jamais par Okayama, une consigne de gare ne sert à rien — l’envoi est la seule solution.',
    note: 'Remise le 22 à l’hôtel de Hiroshima, livraison désignée au 23 à celui de Takamatsu. La nuit du 22 se fait avec un sac de jour, dans un hôtel qu’on connaît déjà. Miyajima, le 22, se visite de toute façon sans bagage.',
    warnings: [
      'Le 22 novembre 2026 est un dimanche et le 23 un jour férié japonais (Kinrō Kansha no Hi) : faire confirmer le ramassage du dimanche à la réception. À défaut, déposer la valise dans un centre Yamato dès le 21, avec livraison désignée au 23.',
      'Suppose que l’hôtel de Takamatsu soit réservé et accepte les colis à l’avance.',
    ],
  },
]

/**
 * VUE PRATIQUE — la page qu'on espère ne jamais ouvrir.
 *
 * Elle est bâtie pour un seul scénario : quelque chose vient d'arriver, il est
 * 23 h, le réseau est mauvais, et on lit un téléphone d'une main. D'où trois
 * partis pris qui la distinguent du reste du carnet :
 *
 * ▸ Les deux numéros vitaux sont **en haut et en gros**, avant toute explication.
 *   Rien à faire défiler pour les atteindre.
 * ▸ Tous les numéros sont des liens `tel:` — un appel en un geste, sans recopie.
 * ▸ Aucune donnée distante. Tout est dans le bundle, donc dans le cache du service
 *   worker : cette page marche en mode avion, ce qui est le mode d'un téléphone
 *   dont le forfait de données vient d'expirer.
 *
 * Et, comme partout ici, ce qui manque est montré comme manquant : les numéros
 * d'opposition bancaire et d'assurance ne peuvent venir que du voyageur, ils
 * s'affichent donc en « à compléter » plutôt qu'en numéros vraisemblables.
 */
import { BoutonCopier, CertaintyBadge, SectionTitle, ToFill } from '../components/ui'
import {
  AMBASSADE,
  ASSISTANCE,
  A_RECOPIER,
  PHRASES,
  SECOURS,
  type Contact,
} from '../data/pratique'

/** Un numéro composable : les séparateurs sautent, le reste est laissé intact. */
function lienTel(numero: string): string {
  return `tel:${numero.replace(/[^\d+]/g, '')}`
}

/** La source d'une information, en petit, cliquable. Rien du tout s'il n'y en a pas. */
function Source({ contact }: { contact: Contact }) {
  if (!contact.source) return null
  return (
    <p className="pratique-source">
      <a href={contact.source.url} target="_blank" rel="noreferrer noopener">
        {contact.source.nom}
      </a>{' '}
      — relevé le {contact.source.releve}
    </p>
  )
}

/**
 * Un des deux numéros vitaux, en pleine largeur.
 *
 * Le chiffre est le plus gros élément de la page : c'est la seule chose qu'on doive
 * pouvoir lire sans lunettes, dans le noir, en tremblant.
 */
function Vital({ contact }: { contact: Contact }) {
  return (
    <li className="vital">
      <a className="vital__numero" href={contact.numero ? lienTel(contact.numero) : undefined}>
        {contact.numero ?? <ToFill>numéro</ToFill>}
      </a>
      <div className="vital__corps">
        <p className="vital__label">
          {contact.label}
          {contact.quand && <span className="vital__quand"> · {contact.quand}</span>}
        </p>
        <p className="vital__usage">{contact.usage}</p>
        <Source contact={contact} />
      </div>
    </li>
  )
}

/** Un contact ordinaire : une ligne dense, avec son usage et sa source. */
function Ligne({ contact }: { contact: Contact }) {
  return (
    <li className={`pratique-row pratique-row--${contact.certainty}`}>
      <div className="pratique-row__tete">
        <p className="pratique-row__label">
          {contact.label} <CertaintyBadge certainty={contact.certainty} />
        </p>
        {contact.numero ? (
          <p className="pratique-row__numeros">
            <a className="pratique-row__numero" href={lienTel(contact.numero)}>
              {contact.numero}
            </a>
            {/* La forme internationale n'est pas un doublon : en itinérance sur un
                opérateur français, le 0 initial d'un numéro japonais ne passe pas. */}
            {contact.numeroInternational && (
              <a
                className="pratique-row__numero pratique-row__numero--intl"
                href={lienTel(contact.numeroInternational)}
              >
                {contact.numeroInternational}
              </a>
            )}
          </p>
        ) : (
          <p className="pratique-row__numeros">
            <ToFill>numéro</ToFill>
          </p>
        )}
      </div>

      <p className="pratique-row__usage">{contact.usage}</p>

      {(contact.quand || contact.langues) && (
        <p className="pratique-row__meta">
          {contact.quand}
          {contact.quand && contact.langues && ' · '}
          {contact.langues}
        </p>
      )}

      {contact.note && <p className="pratique-row__note">{contact.note}</p>}
      <Source contact={contact} />
    </li>
  )
}

export function PratiqueView() {
  return (
    <div className="view view--pratique">
      <SectionTitle eyebrow="En cas de besoin" title="Fiche pratique">
        <p>
          Cette page fonctionne <strong>sans connexion</strong> : tout y est écrit en dur, rien n’y
          est chargé. Chaque numéro porte l’organisme qui le publie et la date à laquelle il y a
          été relevé — aucun n’est écrit de mémoire. À revérifier une fois avant de partir.
        </p>
      </SectionTitle>

      {/* Avant tout le reste, et sans titre bavard : ce sont les deux seuls
          numéros qu'on compose sans avoir le temps de lire quoi que ce soit. */}
      <section className="panel panel--alert">
        <h2 className="panel__title">Les deux numéros d’urgence</h2>
        <p className="panel__intro">
          Gratuits, joignables 24 h/24 depuis n’importe quel téléphone, y compris sans carte SIM
          japonaise. <strong>Au Japon, l’ambulance n’a pas de numéro propre</strong> : c’est le 119,
          celui des pompiers, pour les deux. Chercher un équivalent du 15 fait perdre le seul temps
          qui compte.
        </p>
        <ul className="vitaux">
          {SECOURS.map((contact) => (
            <Vital key={contact.id} contact={contact} />
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">Se faire aider, et se faire comprendre</h2>
        <p className="panel__intro">
          Le 110 et le 119 sauvent la vie ; ils ne parlent pas français, et rarement anglais. Ces
          lignes-ci servent à ce qui vient ensuite — trouver un hôpital qui reçoit un étranger, ou
          joindre quelqu’un dans sa langue.
        </p>
        <ul className="pratique-list">
          {ASSISTANCE.map((contact) => (
            <Ligne key={contact.id} contact={contact} />
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">L’ambassade, sur place</h2>
        <p className="panel__intro">
          {AMBASSADE.nom} — l’adresse en alphabet latin sert à la trouver sur une carte, celle en
          japonais à la montrer à un chauffeur.
        </p>
        <p className="pratique-adresse">{AMBASSADE.adresse}</p>
        <p className="pratique-adresse pratique-adresse--ja">
          <span lang="ja">{AMBASSADE.adresseJa}</span>
          <CertaintyBadge certainty={AMBASSADE.adresseJaCertainty} />
          <BoutonCopier texte={AMBASSADE.adresseJa} quoi="l’adresse de l’ambassade en japonais" />
        </p>
        <p className="pratique-row__note">
          L’adresse japonaise est la transcription des toponymes de l’adresse latine relevée à la
          source (港区 pour Minato-ku, 南麻布 pour Minami-Azabu), et non une copie d’une page
          japonaise de l’ambassade : d’où la pastille « estimation ». Aucune coordonnée n’a été
          relevée pour ce bâtiment, il n’y a donc pas de lien Maps — le site ne fabrique pas de
          repère approximatif.
        </p>
        <p className="pratique-row__meta">
          <a href={`mailto:${AMBASSADE.courriel}`}>{AMBASSADE.courriel}</a> — questions
          administratives, hors urgence.
        </p>
        <p className="pratique-source">
          <a href={AMBASSADE.source.url} target="_blank" rel="noreferrer noopener">
            {AMBASSADE.source.nom}
          </a>{' '}
          — relevé le {AMBASSADE.source.releve}
        </p>
      </section>

      <section className="panel panel--todo">
        <h2 className="panel__title">
          À recopier avant de partir <span className="panel__count">{A_RECOPIER.length}</span>
        </h2>
        <p className="panel__intro">
          Ces numéros n’existent dans aucune source publique : ils dépendent de la banque et de
          l’assureur. Ce sont pourtant les plus urgents de la page — une carte avalée un dimanche
          soir, et il n’y a plus d’argent jusqu’au lundi. À écrire dans{' '}
          <code>src/data/pratique.ts</code>.
        </p>
        <ul className="pratique-list">
          {A_RECOPIER.map((contact) => (
            <Ligne key={contact.id} contact={contact} />
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">Dix phrases</h2>
        <p className="panel__intro">
          À <strong>montrer</strong> d’abord : le japonais écrit passe toujours, la prononciation
          rarement. Ce sont des formulations standard en forme polie — la seule partie de ce carnet
          qui ne porte pas de source précise, parce que c’est de la langue et non un relevé.
        </p>
        <ul className="phrases">
          {PHRASES.map((phrase) => (
            <li key={phrase.ja} className="phrase">
              <p className="phrase__fr">{phrase.fr}</p>
              <p className="phrase__ja" lang="ja">
                {phrase.ja}
                <BoutonCopier texte={phrase.ja} quoi={`la phrase « ${phrase.fr} » en japonais`} />
              </p>
              <p className="phrase__romaji">{phrase.romaji}</p>
              {phrase.note && <p className="phrase__note">{phrase.note}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

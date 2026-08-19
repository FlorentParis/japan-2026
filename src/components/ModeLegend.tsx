/**
 * LÉGENDE ET FILTRES de la carte.
 *
 * Les aperçus de traits sont dessinés à partir des mêmes valeurs que la carte
 * (`lib/modes.ts`) : la légende ne peut pas mentir sur ce qui est affiché.
 * Chaque entrée est aussi un filtre — on peut isoler les ferries, les bus…
 */
import { totalsByMode } from '../lib/derive'
import { formatKm } from '../lib/format'
import { MODE_STYLES } from '../lib/modes'
import { useTrip } from '../state/trip-state'
import type { TransportMode } from '../types'

function LinePreview({ mode }: { mode: TransportMode }) {
  const style = MODE_STYLES[mode]
  return (
    <svg className="legend__preview" viewBox="0 0 46 12" aria-hidden="true">
      <line
        x1="1"
        y1="6"
        x2="45"
        y2="6"
        stroke="#ffffff"
        strokeWidth={style.width + 3.4}
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="6"
        x2="45"
        y2="6"
        stroke={style.color}
        strokeWidth={style.width}
        strokeLinecap={style.dash ? 'butt' : 'round'}
        strokeDasharray={style.dash?.map((d) => d * style.width).join(' ')}
      />
    </svg>
  )
}

export function ModeLegend() {
  const { visibleModes, toggleMode, resetModes } = useTrip()
  const totals = totalsByMode()
  const allVisible = visibleModes.length === totals.length

  return (
    <div className="legend">
      <div className="legend__head">
        <h3 className="legend__title">Modes de transport</h3>
        {!allVisible && (
          <button type="button" className="link-button" onClick={resetModes}>
            Tout afficher
          </button>
        )}
      </div>

      <ul className="legend__list">
        {totals.map((total) => {
          const style = MODE_STYLES[total.mode]
          const on = visibleModes.includes(total.mode)
          return (
            <li key={total.mode}>
              <button
                type="button"
                className={`legend__item${on ? '' : ' is-off'}`}
                onClick={() => toggleMode(total.mode)}
                aria-pressed={on}
                title={style.hint}
              >
                <LinePreview mode={total.mode} />
                <span className="legend__label">
                  {style.icon} {style.plural}
                </span>
                <span className="legend__count">
                  {total.legs} · {formatKm(total.km)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="legend__markers">
        <span>
          <span className="legend__marker-sample" aria-hidden="true" />
          Étape numérotée
        </span>
        <span>
          <span className="legend__marker-sample legend__marker-sample--day" aria-hidden="true" />
          Traversée ou visite dans la journée, sans nuit
        </span>
      </p>

      <p className="legend__note">
        Tracés <strong>schématiques</strong> : ils suivent le corridor réel (vallées, gares,
        détroits) par points de passage, ce ne sont pas des relevés GPS. Le vol est un arc
        géodésique calculé. Les distances affichées sont celles de ces tracés, pas les
        kilométrages commerciaux.
      </p>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'voyage-japon:'

/**
 * `useState` sauvegardé dans le navigateur.
 * Sert aux réglages de l'utilisateur (devise, hypothèses de budget) — jamais
 * aux données du voyage, qui vivent dans `src/data/` et nulle part ailleurs.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const storageKey = PREFIX + key

  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // Navigation privée ou stockage plein : on continue sans persistance.
    }
  }, [storageKey, value])

  const reset = useCallback(() => setValue(initial), [initial])

  return [value, setValue, reset] as const
}

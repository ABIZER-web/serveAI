import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchSettings } from '../utils/api'
import { CONTACT } from '../data/contact'

const SettingsContext = createContext(null)

const FALLBACK_SETTINGS = {
  orderingPaused: false,
  closedMessage: "We're not accepting orders right now — check back soon!",
  contactLocationLines: CONTACT.locationLines,
  contactPhone: CONTACT.phone,
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetchSettings()
      .then(setSettings)
      .catch(() => {
        // Backend unreachable — fall back to the bundled defaults so the
        // page still renders sensibly.
        setSettings(FALLBACK_SETTINGS)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <SettingsContext.Provider value={{ settings, loading, refetch: load }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}

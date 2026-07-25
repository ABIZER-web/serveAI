import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { fetchMenu } from '../utils/api'
import { CATEGORIES as FALLBACK_CATEGORIES, MENU as FALLBACK_MENU } from '../data/menu'

const MenuContext = createContext(null)

function toFallbackShape() {
  return FALLBACK_CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    items: FALLBACK_MENU[cat.id] || [],
  }))
}

export function MenuProvider({ children }) {
  const [categories, setCategories] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetchMenu()
      .then((data) => {
        setCategories(data)
        setOffline(false)
      })
      .catch(() => {
        // Backend not reachable (not deployed yet, or briefly down) — fall
        // back to the bundled seed menu so the site still works.
        setCategories(toFallbackShape())
        setOffline(true)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const allItems = useMemo(
    () => (categories || []).flatMap((cat) => cat.items.map((item) => ({ ...item, categoryId: cat.id }))),
    [categories]
  )

  const categoryOfItem = useMemo(
    () => Object.fromEntries(allItems.map((item) => [item.id, item.categoryId])),
    [allItems]
  )

  return (
    <MenuContext.Provider
      value={{ categories: categories || [], allItems, categoryOfItem, loading, offline, refetch: load }}
    >
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used within MenuProvider')
  return ctx
}

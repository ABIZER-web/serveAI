import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'serveai_cart_v1'

// Builds a stable identity for a cart line — plain items just use their
// menu id, but two orders of the same item with different selected
// options (e.g. Large vs Regular) need to stay separate lines.
function buildLineId(itemId, selectedOptions) {
  if (!selectedOptions || selectedOptions.length === 0) return itemId
  const key = selectedOptions
    .map((o) => `${o.groupName}:${o.label}`)
    .sort()
    .join('|')
  return `${itemId}::${key}`
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable — cart just won't persist across reloads */
    }
  }, [items])

  // selectedOptions is optional — plain items (no variants) work exactly
  // as before. unitPrice is the base price plus every chosen option's
  // priceDelta, computed once here so the rest of the cart never has to
  // recompute it.
  const addItem = useCallback((item, selectedOptions = []) => {
    const lineId = buildLineId(item.id, selectedOptions)
    const unitPrice = item.price + selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0)

    setItems((prev) => {
      const existing = prev.find((i) => i.lineId === lineId)
      if (existing) {
        return prev.map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + 1 } : i))
      }
      return [
        ...prev,
        {
          lineId,
          id: item.id,
          name: item.name,
          icon: item.icon,
          image: item.image,
          price: item.price, // base price, kept for reference
          unitPrice,
          selectedOptions,
          qty: 1,
        },
      ]
    })
  }, [])

  const updateQty = useCallback((lineId, qty) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.lineId !== lineId)
      return prev.map((i) => (i.lineId === lineId ? { ...i, qty } : i))
    })
  }, [])

  const removeItem = useCallback((lineId) => {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

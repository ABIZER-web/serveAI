import { useCart } from '../context/CartContext'
import { Plus, Check, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import ItemOptionsModal from './ItemOptionsModal'

export default function MenuItem({ item }) {
  const { items, addItem, updateQty } = useCart()
  const hasOptions = item.optionGroups && item.optionGroups.length > 0
  const inCart = !hasOptions ? items.find((i) => i.lineId === item.id) : null
  const cartQtyForItem = hasOptions ? items.filter((i) => i.id === item.id).reduce((s, i) => s + i.qty, 0) : 0
  const [justAdded, setJustAdded] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const soldOut = item.available === false

  const handleAdd = () => {
    if (soldOut) return
    if (hasOptions) {
      setShowOptions(true)
      return
    }
    addItem(item)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 900)
  }

  const handleConfirmOptions = (selectedOptions) => {
    addItem(item, selectedOptions)
    setShowOptions(false)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 900)
  }

  return (
    <div className="flex gap-4 py-5 border-b border-charcoal/10 last:border-0">
      <div
        className="shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl overflow-hidden"
        style={{
          background: 'var(--color-paper-dim)',
          border: '2px solid var(--color-charcoal)',
          opacity: soldOut ? 0.4 : 1,
        }}
      >
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          item.icon
        )}
      </div>

      <div className="flex-1 min-w-0" style={{ opacity: soldOut ? 0.55 : 1 }}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg tracking-wide leading-tight" style={{ color: 'var(--color-ink)' }}>
            {item.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className="font-mono text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
          >
            {hasOptions ? `From ₹${item.price}` : `₹${item.price}`}
          </span>
          {soldOut ? (
            <span
              className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
            >
              Sold Out
            </span>
          ) : (
            item.tag && (
              <span
                className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-basil)', color: 'var(--color-paper)' }}
              >
                {item.tag}
              </span>
            )
          )}
        </div>

        <p className="text-sm opacity-70 mt-1.5 leading-snug pr-2">{item.desc}</p>
      </div>

      <div className="shrink-0 flex items-end">
        {soldOut ? (
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full"
            style={{ background: 'var(--color-paper-dim)', color: 'var(--color-ink)', opacity: 0.6 }}
          >
            Unavailable
          </span>
        ) : hasOptions ? (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-full transition-all active:scale-95 relative"
            style={{
              background: justAdded ? 'var(--color-basil)' : 'var(--color-chili)',
              color: 'var(--color-paper)',
            }}
          >
            {justAdded ? <Check size={14} /> : <SlidersHorizontal size={14} />}
            {justAdded ? 'Added' : 'Customize'}
            {cartQtyForItem > 0 && (
              <span
                className="absolute -top-2 -right-2 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
              >
                {cartQtyForItem}
              </span>
            )}
          </button>
        ) : !inCart ? (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-full transition-all active:scale-95"
            style={{
              background: justAdded ? 'var(--color-basil)' : 'var(--color-chili)',
              color: 'var(--color-paper)',
            }}
          >
            {justAdded ? <Check size={14} /> : <Plus size={14} />}
            {justAdded ? 'Added' : 'Add'}
          </button>
        ) : (
          <div
            className="flex items-center gap-2 rounded-full px-1 py-1"
            style={{ background: 'var(--color-charcoal)' }}
          >
            <button
              onClick={() => updateQty(item.id, inCart.qty - 1)}
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
              style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
              aria-label={`Remove one ${item.name}`}
            >
              −
            </button>
            <span className="font-mono text-sm font-bold w-4 text-center" style={{ color: 'var(--color-paper)' }}>
              {inCart.qty}
            </span>
            <button
              onClick={() => updateQty(item.id, inCart.qty + 1)}
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
              style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
              aria-label={`Add one more ${item.name}`}
            >
              +
            </button>
          </div>
        )}
      </div>

      {showOptions && (
        <ItemOptionsModal item={item} onClose={() => setShowOptions(false)} onConfirm={handleConfirmOptions} />
      )}
    </div>
  )
}

import { ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function FloatingCartButton({ onClick }) {
  const { totalItems, totalPrice } = useCart()
  if (totalItems === 0) return null

  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-30 flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full shadow-xl transition-transform active:scale-95"
      style={{ background: 'var(--color-charcoal)' }}
    >
      <span className="relative">
        <ShoppingBag size={20} color="var(--color-mustard)" />
        <span
          className="absolute -top-2 -right-2 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
        >
          {totalItems}
        </span>
      </span>
      <span className="font-display text-lg tracking-wide" style={{ color: 'var(--color-mustard)' }}>
        ₹{totalPrice}
      </span>
    </button>
  )
}

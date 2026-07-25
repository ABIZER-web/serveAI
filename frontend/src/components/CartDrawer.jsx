import { useState, useMemo } from 'react'
import { X, Trash2, Sparkles, Bike, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useMenu } from '../context/MenuContext'
import { useSettings } from '../context/SettingsContext'
import { validateName, validatePhone } from '../utils/validation'
import { placeOrder, verifyPayment } from '../utils/api'
import { getRecommendations } from '../utils/recommendations'

const ORDER_TYPES = [
  { key: 'dine-in', label: 'Dine-in', icon: UtensilsCrossed },
  { key: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
  { key: 'delivery', label: 'Delivery', icon: Bike },
]

// Loads the Razorpay checkout script once and reuses it on subsequent
// opens — the modal itself is provided by that script, not built here.
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the payment screen. Check your connection.'))
    document.body.appendChild(script)
  })
}

export default function CartDrawer({ open, onClose, onOrderPlaced, tableNumber }) {
  const { items, addItem, updateQty, clearCart, totalPrice, totalItems } = useCart()
  const { allItems, categoryOfItem } = useMenu()
  const { settings } = useSettings()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [orderType, setOrderType] = useState('dine-in')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('counter')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [paymentNotice, setPaymentNotice] = useState(null)

  const recommendations = useMemo(
    () => getRecommendations(items, allItems, categoryOfItem, 3),
    [items, allItems, categoryOfItem]
  )

  if (!open) return null

  const handleCheckout = async (e) => {
    e.preventDefault()
    const nameErr = validateName(name)
    const phoneErr = validatePhone(phone)
    const addressErr = orderType === 'delivery' && !deliveryAddress.trim() ? 'Enter a delivery address.' : null
    if (nameErr || phoneErr || addressErr || items.length === 0) {
      setErrors({
        name: nameErr,
        phone: phoneErr,
        address: addressErr,
        cart: items.length === 0 ? 'Your ticket is empty.' : null,
      })
      return
    }
    setSubmitting(true)
    setErrors({})
    setPaymentNotice(null)
    try {
      // The backend assigns the real, sequential order ID (1, 2, 3, 4…) —
      // the frontend never invents one itself.
      // The backend expects each line's *final* per-unit price (base +
      // any selected option surcharges) as `price` — the cart tracks that
      // separately as `unitPrice`, so it's mapped here rather than sent
      // as-is.
      const orderItems = items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.unitPrice,
        qty: i.qty,
        selectedOptions: i.selectedOptions,
      }))

      const order = await placeOrder({
        table: tableNumber || null,
        name: name.trim(),
        phone: phone.trim(),
        items: orderItems,
        total: totalPrice,
        notes: notes.trim(),
        orderType,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : '',
        paymentMethod,
      })

      if (paymentMethod === 'online' && order.payment) {
        try {
          await loadRazorpayScript()
          await new Promise((resolve) => {
            const rz = new window.Razorpay({
              key: order.payment.razorpayKeyId,
              amount: order.payment.amount,
              currency: 'INR',
              name: 'ServeAI',
              description: `Order #${String(order.id).padStart(4, '0')}`,
              order_id: order.payment.razorpayOrderId,
              handler: async (response) => {
                try {
                  await verifyPayment(order.id, {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  })
                } catch {
                  setPaymentNotice('Payment went through but could not be confirmed automatically — show your order number at the counter.')
                }
                resolve()
              },
              modal: {
                ondismiss: () => {
                  setPaymentNotice('Payment was not completed — your order is still placed, just pay at the counter instead.')
                  resolve()
                },
              },
              theme: { color: '#E1432B' },
            })
            rz.open()
          })
        } catch (err) {
          setPaymentNotice(err.message || 'Could not open the payment screen — your order is still placed, pay at the counter instead.')
        }
      }

      clearCart()
      setNotes('')
      onOrderPlaced(order)
    } catch (err) {
      setErrors({ cart: err.message || 'Could not reach the kitchen. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md h-full flex flex-col shadow-2xl"
        style={{ background: 'var(--color-paper)' }}
      >
        <div className="checker-strip" />
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="font-display text-2xl tracking-wide" style={{ color: 'var(--color-ink)' }}>
              Your Ticket
            </h2>
            <p className="font-mono text-xs opacity-60">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button onClick={clearCart} className="text-xs font-mono uppercase font-bold opacity-60 hover:opacity-100">
                Clear
              </button>
            )}
            <button onClick={onClose} aria-label="Close ticket">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60 gap-2 pb-20">
              <div className="text-5xl">🧾</div>
              <p className="font-mono text-sm">Nothing on the ticket yet.</p>
              <p className="text-xs">Tap Add on any item to get cooking.</p>
            </div>
          ) : (
            <div className="divide-y divide-charcoal/10">
              {items.map((item) => (
                <div key={item.lineId} className="flex items-center gap-3 py-3.5">
                  <div className="text-2xl w-10 text-center">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    {item.selectedOptions?.length > 0 && (
                      <p className="text-[11px] opacity-60 truncate">
                        {item.selectedOptions.map((o) => o.label).join(', ')}
                      </p>
                    )}
                    <p className="font-mono text-xs opacity-60">₹{item.unitPrice} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full px-1 py-1" style={{ background: 'var(--color-charcoal)' }}>
                    <button
                      onClick={() => updateQty(item.lineId, item.qty - 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ background: 'var(--color-mustard)' }}
                    >
                      −
                    </button>
                    <span className="font-mono text-xs font-bold w-3 text-center" style={{ color: 'var(--color-paper)' }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.lineId, item.qty + 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ background: 'var(--color-mustard)' }}
                    >
                      +
                    </button>
                  </div>
                  <button onClick={() => updateQty(item.lineId, 0)} className="opacity-40 hover:opacity-100 ml-1" aria-label={`Remove ${item.name}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && recommendations.length > 0 && (
          <div className="px-5 pt-3 pb-1 border-t border-dashed border-charcoal/20">
            <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider opacity-70 mb-2.5">
              <Sparkles size={13} style={{ color: 'var(--color-chili)' }} />
              You might also like
            </p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {recommendations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="shrink-0 w-28 rounded-xl px-2.5 py-2.5 text-left"
                  style={{ background: 'var(--color-paper-dim)', border: '1.5px solid var(--color-charcoal)' }}
                >
                  <div className="text-2xl">{item.icon}</div>
                  <p className="text-xs font-semibold leading-tight mt-1 line-clamp-2">{item.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--color-chili)' }}>
                      ₹{item.price}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
                    >
                      +
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleCheckout} className="border-t-2 border-dashed border-charcoal/20 px-5 py-4" style={{ background: 'var(--color-paper-dim)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-sm uppercase tracking-wide opacity-70">Total to pay</span>
            <span className="font-display text-2xl" style={{ color: 'var(--color-chili)' }}>₹{totalPrice}</span>
          </div>

          <div className="flex gap-1.5 mb-3">
            {ORDER_TYPES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setOrderType(key)}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 font-mono text-[10px] font-bold uppercase"
                style={{
                  borderColor: orderType === key ? 'var(--color-chili)' : 'rgba(36,28,20,0.15)',
                  background: orderType === key ? 'rgba(225,67,43,0.06)' : 'var(--color-paper)',
                }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {orderType === 'delivery' && (
              <div>
                <textarea
                  placeholder="Delivery address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 outline-none text-sm resize-none"
                  style={{ borderColor: errors.address ? 'var(--color-chili)' : 'rgba(36,28,20,0.2)', background: 'var(--color-paper)' }}
                />
                {errors.address && <p className="text-xs mt-1" style={{ color: 'var(--color-chili)' }}>{errors.address}</p>}
              </div>
            )}
            <div>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 outline-none text-sm"
                style={{ borderColor: errors.name ? 'var(--color-chili)' : 'rgba(36,28,20,0.2)', background: 'var(--color-paper)' }}
              />
              {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--color-chili)' }}>{errors.name}</p>}
            </div>
            <div>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                maxLength={10}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 outline-none text-sm font-mono"
                style={{ borderColor: errors.phone ? 'var(--color-chili)' : 'rgba(36,28,20,0.2)', background: 'var(--color-paper)' }}
              />
              {errors.phone && <p className="text-xs mt-1" style={{ color: 'var(--color-chili)' }}>{errors.phone}</p>}
            </div>
            {errors.cart && <p className="text-xs" style={{ color: 'var(--color-chili)' }}>{errors.cart}</p>}
            {paymentNotice && <p className="text-xs" style={{ color: 'var(--color-chili)' }}>{paymentNotice}</p>}
            <textarea
              placeholder="Any special instructions? e.g. no onions (optional)"
              value={notes}
              maxLength={300}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 outline-none text-sm resize-none"
              style={{ borderColor: 'rgba(36,28,20,0.2)', background: 'var(--color-paper)' }}
            />

            {settings.onlinePaymentEnabled && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('counter')}
                  className="flex-1 py-2 rounded-xl font-mono text-[11px] font-bold uppercase border-2"
                  style={{
                    borderColor: paymentMethod === 'counter' ? 'var(--color-chili)' : 'rgba(36,28,20,0.15)',
                    background: paymentMethod === 'counter' ? 'rgba(225,67,43,0.06)' : 'var(--color-paper)',
                  }}
                >
                  Pay at Counter
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className="flex-1 py-2 rounded-xl font-mono text-[11px] font-bold uppercase border-2"
                  style={{
                    borderColor: paymentMethod === 'online' ? 'var(--color-chili)' : 'rgba(36,28,20,0.15)',
                    background: paymentMethod === 'online' ? 'rgba(225,67,43,0.06)' : 'var(--color-paper)',
                  }}
                >
                  Pay Online
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 py-3.5 rounded-xl font-display text-lg tracking-wide transition-transform active:scale-[0.98] disabled:opacity-60"
            style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
          >
            {submitting ? 'Sending to kitchen…' : `Send to Kitchen · ₹${totalPrice}`}
          </button>
        </form>
      </div>
    </div>
  )
}

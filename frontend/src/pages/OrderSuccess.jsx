import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Check, MessageCircle, Sparkles } from 'lucide-react'
import Logo from '../components/Logo'
import { useSEO } from '../hooks/useSEO'
import { fetchOrder } from '../utils/api'
import { getSocket } from '../utils/socket'

const STATUS_STEPS = [
  { key: 'received', label: 'Received' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'served', label: 'Served' },
]
// Real-time updates arrive over the socket almost instantly; this longer
// interval is just a safety net in case that connection drops.
const POLL_FALLBACK_MS = 20000

export default function OrderSuccess() {
  useSEO({
    title: 'Order confirmed | ServeAI',
    robots: 'noindex, nofollow',
    path: '/order-success',
  })

  const { state } = useLocation()
  const navigate = useNavigate()
  const order = state?.order
  const [status, setStatus] = useState(order?.status || 'received')
  const pollRef = useRef(null)

  useEffect(() => {
    if (!order) return
    if (['served', 'cancelled'].includes(status)) return

    const socket = getSocket()
    socket.emit('order:subscribe', order.id)
    const onStatus = (payload) => {
      if (payload.id === order.id) setStatus(payload.status)
    }
    socket.on('order:status', onStatus)

    pollRef.current = setInterval(() => {
      fetchOrder(order.id)
        .then((data) => setStatus(data.status))
        .catch(() => {
          /* a missed poll isn't worth surfacing — it'll try again shortly */
        })
    }, POLL_FALLBACK_MS)

    return () => {
      socket.off('order:status', onStatus)
      clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, status])

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-2xl">No order to show</p>
        <button
          onClick={() => navigate('/')}
          className="font-mono text-sm uppercase font-bold px-5 py-2.5 rounded-full"
          style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
        >
          Back to menu
        </button>
      </div>
    )
  }

  const orderNumber = String(order.id).padStart(4, '0')
  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === status)
  const cancelled = status === 'cancelled'

  // The QR links to a live lookup page (/order/:id) that pulls the order
  // straight from the backend — so scanning it always shows exactly who
  // ordered what, not a static snapshot baked in at checkout time.
  const qrValue = `${window.location.origin}/order/${order.id}`

  // No fixed phone number here on purpose — this opens WhatsApp's contact
  // picker so the customer can send the tracking link to themselves, a
  // friend, or whoever's picking up the order.
  const whatsappText = encodeURIComponent(
    `My ServeAI order #${orderNumber} is in! Track it here: ${qrValue}`
  )
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`

  return (
    <div className="min-h-screen flex flex-col items-center px-5 py-10" style={{ background: 'var(--color-charcoal)' }}>
      <div className="checker-strip w-full max-w-md rounded-t-2xl" />
      <div
        className="w-full max-w-md rounded-b-2xl px-6 py-8 -mt-[1px]"
        style={{ background: 'var(--color-paper)' }}
      >
        <div className="flex justify-center mb-4">
          <Logo size={56} showWordmark={false} />
        </div>

        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-widest opacity-60">Order confirmed</p>
          <h1 className="font-display text-4xl tracking-wide mt-1" style={{ color: 'var(--color-chili)' }}>
            #{orderNumber}
          </h1>
          <p className="font-mono text-xs mt-1 opacity-70">
            {order.table ? `Table ${order.table} · ` : ''}Sent to the kitchen
          </p>
          {order.orderType && order.orderType !== 'dine-in' && (
            <p className="font-mono text-[10px] uppercase tracking-wider opacity-60 mt-1">
              {order.orderType === 'delivery' ? `Delivery — ${order.deliveryAddress}` : 'Takeaway'}
            </p>
          )}
          {order.isReturningCustomer && (
            <p
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mt-2"
              style={{ background: 'var(--color-basil)', color: 'white' }}
            >
              <Sparkles size={11} /> Welcome back!
            </p>
          )}
        </div>

        {cancelled ? (
          <p
            className="text-center font-mono text-xs font-bold uppercase tracking-wider mt-5 px-3 py-2 rounded-xl"
            style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
          >
            This order was cancelled
          </p>
        ) : (
          <div className="flex items-center justify-between mt-6 px-1">
            {STATUS_STEPS.map((step, i) => (
              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <div
                    className="absolute right-1/2 top-3 h-0.5 w-full -z-10"
                    style={{ background: i <= stepIndex ? 'var(--color-chili)' : 'rgba(36,28,20,0.15)' }}
                  />
                )}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: i <= stepIndex ? 'var(--color-chili)' : 'var(--color-paper-dim)',
                    border: i <= stepIndex ? 'none' : '2px solid rgba(36,28,20,0.2)',
                  }}
                >
                  {i < stepIndex && <Check size={13} color="white" />}
                  {i === stepIndex && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span
                  className="font-mono text-[9px] uppercase tracking-wide mt-1.5 text-center"
                  style={{ opacity: i <= stepIndex ? 1 : 0.4, color: i === stepIndex ? 'var(--color-chili)' : 'inherit' }}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center my-6">
          <div className="p-3 rounded-2xl bg-white" style={{ border: '3px solid var(--color-charcoal)' }}>
            <QRCodeSVG value={qrValue} size={168} fgColor="#1B1B1B" bgColor="#FFFFFF" />
          </div>
        </div>

        <p className="text-center">
          <a href={qrValue} className="font-mono text-[11px] underline opacity-50 break-all">
            {qrValue}
          </a>
        </p>

        <p className="text-center text-xs opacity-60 mb-5">
          Show this ticket at the counter — scanning the QR pulls up who ordered this and what's
          in it, straight from the kitchen system.
        </p>

        <div className="border-t-2 border-dashed border-charcoal/20 pt-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span>
                {item.qty} × {item.name}
                {item.selectedOptions?.length > 0 && (
                  <span className="block text-[10px] opacity-60">{item.selectedOptions.map((o) => o.label).join(', ')}</span>
                )}
              </span>
              <span className="font-mono">₹{item.qty * item.price}</span>
            </div>
          ))}
          <div className="flex justify-between font-display text-xl mt-2 pt-2 border-t border-charcoal/10">
            <span>Total</span>
            <span style={{ color: 'var(--color-chili)' }}>₹{order.total}</span>
          </div>
        </div>

        {order.notes && (
          <p className="text-xs italic opacity-70 mt-3 px-3 py-2 rounded-lg" style={{ background: 'var(--color-paper-dim)' }}>
            "{order.notes}"
          </p>
        )}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-display text-lg tracking-wide"
          style={{ background: '#25D366', color: 'white' }}
        >
          <MessageCircle size={18} /> Send to WhatsApp
        </a>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl font-display text-lg tracking-wide"
          style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
        >
          <ArrowLeft size={18} /> Back to menu
        </button>
      </div>
    </div>
  )
}

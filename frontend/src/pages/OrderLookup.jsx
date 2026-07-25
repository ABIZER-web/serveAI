import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Phone, Hash, Printer } from 'lucide-react'
import Logo from '../components/Logo'
import { fetchOrderAdmin, setOrderStatus } from '../utils/api'
import { useSEO } from '../hooks/useSEO'

const STATUS_LABELS = {
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
}

const STATUS_FLOW = ['received', 'preparing', 'ready', 'served']

export default function OrderLookup() {
  const { id } = useParams()
  const navigate = useNavigate()
  useSEO({
    title: `Order #${String(id).padStart(4, '0')} | ServeAI`,
    robots: 'noindex, nofollow',
    path: `/order/${id}`,
  })
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    fetchOrderAdmin(id)
      .then(setOrder)
      .catch((err) => {
        if (err.message?.toLowerCase().includes('expired') || err.message?.toLowerCase().includes('login required')) {
          navigate('/admin/login', { state: { from: `/order/${id}` } })
          return
        }
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleStatusChange = async (status) => {
    setUpdating(true)
    try {
      const updated = await setOrderStatus(id, status)
      setOrder(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const nextStatus = order && STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]

  return (
    <div className="min-h-screen px-5 py-8 print:bg-white print:py-0" style={{ background: 'var(--color-paper)' }}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Logo size={40} />
          <Link
            to="/"
            className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-3 py-2 rounded-full"
            style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
          >
            <ArrowLeft size={14} /> Menu
          </Link>
        </div>

        {loading && <p className="font-mono text-sm text-center opacity-60 py-10 print:hidden">Looking up order…</p>}

        {error && !loading && (
          <div className="text-center py-10 print:hidden">
            <p className="font-display text-2xl mb-2" style={{ color: 'var(--color-chili)' }}>Not found</p>
            <p className="text-sm opacity-70">{error}</p>
          </div>
        )}

        {order && !loading && (
          <>
            <div className="rounded-2xl overflow-hidden print:border-0 print:rounded-none" style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}>
              <div className="checker-strip print:hidden" />
              <div className="px-5 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">Order</p>
                    <h1 className="font-display text-3xl" style={{ color: 'var(--color-chili)' }}>
                      #{String(order.id).padStart(4, '0')}
                    </h1>
                  </div>
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                    style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-sm">
                  <p className="flex items-center gap-2">
                    <Hash size={14} className="opacity-50" />
                    {order.table ? `Table ${order.table}` : 'No table assigned'}
                    {order.orderType && order.orderType !== 'dine-in' && (
                      <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}>
                        {order.orderType}
                      </span>
                    )}
                  </p>
                  {order.orderType === 'delivery' && order.deliveryAddress && (
                    <p className="text-xs opacity-70">{order.deliveryAddress}</p>
                  )}
                  <p className="font-semibold">{order.name}</p>
                  <p className="flex items-center gap-2 font-mono text-xs opacity-70">
                    <Phone size={13} /> {order.phone}
                  </p>
                  <p className="text-xs opacity-50">{order.createdAt}</p>
                  {order.paymentMethod === 'online' && (
                    <p className="font-mono text-[10px] font-bold uppercase" style={{ color: order.paymentStatus === 'paid' ? 'var(--color-basil)' : 'var(--color-chili)' }}>
                      {order.paymentStatus === 'paid' ? '✓ Paid online' : 'Payment pending'}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t-2 border-dashed border-charcoal/20">
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
                    Note: "{order.notes}"
                  </p>
                )}

                {order.isReturningCustomer && (
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider mt-2 opacity-60 print:hidden">
                    ★ Returning customer
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 print:hidden">
              {nextStatus && (
                <button
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={updating}
                  className="flex-1 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-60"
                  style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
                >
                  {updating ? 'Updating…' : `Mark ${STATUS_LABELS[nextStatus]}`}
                </button>
              )}
              {order.status !== 'cancelled' && order.status !== 'served' && (
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updating}
                  className="py-2.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-60"
                  style={{ background: 'var(--color-paper-dim)', color: 'var(--color-ink)' }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="py-2.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
              >
                <Printer size={14} /> Print
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

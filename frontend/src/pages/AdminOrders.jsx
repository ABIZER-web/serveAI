import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, RefreshCw, Bell, BellOff, StickyNote, Search, X } from 'lucide-react'
import AdminNav from '../components/AdminNav'
import { useSEO } from '../hooks/useSEO'
import { fetchOrders, setOrderStatus, downloadOrdersCsv, searchOrdersByPhone, getAdminToken } from '../utils/api'
import { getSocket } from '../utils/socket'

const STATUS_LABELS = {
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
}
const STATUS_FLOW = ['received', 'preparing', 'ready', 'served']
const FILTERS = ['active', 'all', 'received', 'preparing', 'ready', 'served', 'cancelled']
// Real-time socket events handle the moment-to-moment updates; this
// longer interval is just a safety net in case that connection drops.
const POLL_FALLBACK_MS = 30000
const SOUND_PREF_KEY = 'serveai_kitchen_sound'

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(`${iso.replace(' ', 'T')}Z`).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  return `${hours}h ago`
}

// A quick two-tone chime built with the Web Audio API — no audio file
// needed. Browsers require a user gesture before audio can play, which is
// why this only fires once the staff member has tapped the sound toggle.
function playNewOrderChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[880, 1108.73].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.16
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.32)
    })
  } catch {
    /* Web Audio unavailable — just skip the sound */
  }
}

function OrderCard({ order, isNew, busyId, onStatusChange }) {
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]
  return (
    <div
      className="rounded-2xl p-4 transition-shadow"
      style={{
        background: 'white',
        border: `2px solid ${isNew ? 'var(--color-chili)' : 'var(--color-charcoal)'}`,
        boxShadow: isNew ? '0 0 0 4px rgba(225,67,43,0.18)' : 'none',
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div>
          <span className="font-display text-lg" style={{ color: 'var(--color-chili)' }}>
            #{String(order.id).padStart(4, '0')}
          </span>
          <span className="text-xs opacity-60 ml-2">
            {order.table ? `Table ${order.table}` : 'No table'} · {timeAgo(order.createdAt)}
          </span>
          {order.orderType && order.orderType !== 'dine-in' && (
            <span className="ml-2 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-paper-dim)', color: 'var(--color-ink)' }}>
              {order.orderType}
            </span>
          )}
          {order.isReturningCustomer && (
            <span className="ml-2 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}>
              Regular
            </span>
          )}
        </div>
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <p className="text-sm font-semibold mt-2">{order.name} · <span className="font-mono text-xs opacity-70">{order.phone}</span></p>
      {order.orderType === 'delivery' && order.deliveryAddress && (
        <p className="text-xs opacity-60">{order.deliveryAddress}</p>
      )}

      <div className="mt-2 space-y-0.5">
        {order.items.map((item, i) => (
          <p key={i} className="text-xs opacity-80">
            {item.qty} × {item.name}
            {item.selectedOptions?.length > 0 && <span className="opacity-60"> ({item.selectedOptions.map((o) => o.label).join(', ')})</span>}
          </p>
        ))}
      </div>

      {order.notes && (
        <p className="flex items-start gap-1.5 text-xs mt-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--color-paper-dim)' }}>
          <StickyNote size={12} className="shrink-0 mt-0.5 opacity-60" />
          <span className="italic opacity-80">{order.notes}</span>
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-charcoal/20">
        <span className="font-mono text-sm font-bold" style={{ color: 'var(--color-chili)' }}>₹{order.total}</span>
        <div className="flex gap-2">
          <Link
            to={`/order/${order.id}`}
            className="font-mono text-[10px] font-bold uppercase px-3 py-1.5 rounded-full"
            style={{ background: 'var(--color-paper-dim)', color: 'var(--color-ink)' }}
          >
            Details
          </Link>
          {nextStatus && (
            <button
              disabled={busyId === order.id}
              onClick={() => onStatusChange(order.id, nextStatus)}
              className="font-mono text-[10px] font-bold uppercase px-3 py-1.5 rounded-full disabled:opacity-50"
              style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
            >
              Mark {STATUS_LABELS[nextStatus]}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminOrders() {
  useSEO({ title: 'Orders | ServeAI', robots: 'noindex, nofollow', path: '/admin/orders' })
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('active')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [newIds, setNewIds] = useState(new Set())
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem(SOUND_PREF_KEY) === 'on'
    } catch {
      return false
    }
  })
  const [searchPhone, setSearchPhone] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const pollRef = useRef(null)

  const flashNew = (id) => {
    setNewIds((prev) => new Set([...prev, id]))
    setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 5000)
  }

  const load = (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    fetchOrders(100)
      .then(setOrders)
      .catch((err) => {
        if (err.message?.toLowerCase().includes('expired') || err.message?.toLowerCase().includes('login required')) {
          navigate('/admin/login')
          return
        }
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }

  // Real-time: authenticate the socket with the admin token, join the
  // admin room, and react to new orders / status changes as they happen.
  useEffect(() => {
    const socket = getSocket()
    const token = getAdminToken()
    if (token) socket.emit('admin:auth', token)

    const onNewOrder = (order) => {
      setOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [order, ...prev]))
      flashNew(order.id)
      if (soundOn) playNewOrderChime()
    }
    const onUpdatedOrder = (order) => {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)))
    }

    socket.on('order:new', onNewOrder)
    socket.on('order:updated', onUpdatedOrder)
    socket.on('connect', () => socket.emit('admin:auth', token))

    return () => {
      socket.off('order:new', onNewOrder)
      socket.off('order:updated', onUpdatedOrder)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn])

  useEffect(() => {
    load(true)
    pollRef.current = setInterval(() => load(false), POLL_FALLBACK_MS)
    return () => clearInterval(pollRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    try {
      localStorage.setItem(SOUND_PREF_KEY, next ? 'on' : 'off')
    } catch {
      /* preference just won't persist */
    }
    if (next) playNewOrderChime() // quick confirmation beep so staff know it's on
  }

  const handleStatusChange = async (id, status) => {
    setBusyId(id)
    try {
      const updated = await setOrderStatus(id, status)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      setSearchResults((prev) => prev?.map((o) => (o.id === updated.id ? updated : o)) ?? null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleExport = async () => {
    try {
      await downloadOrdersCsv()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!/^\d{10}$/.test(searchPhone)) {
      setError('Enter a 10-digit phone number to search.')
      return
    }
    setSearching(true)
    setError(null)
    try {
      const results = await searchOrdersByPhone(searchPhone)
      setSearchResults(results)
    } catch (err) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchPhone('')
    setSearchResults(null)
  }

  const visibleOrders = orders.filter((o) => {
    if (filter === 'all') return true
    if (filter === 'active') return !['served', 'cancelled'].includes(o.status)
    return o.status === filter
  })

  return (
    <div className="min-h-screen px-5 py-8" style={{ background: 'var(--color-paper)' }}>
      <div className="max-w-2xl mx-auto">
        <AdminNav current="/admin/orders" />

        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h1 className="font-display text-3xl">Orders</h1>
          <div className="flex gap-2">
            <button
              onClick={toggleSound}
              className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-3.5 py-2 rounded-full"
              style={{
                background: soundOn ? 'var(--color-basil)' : 'var(--color-paper-dim)',
                color: soundOn ? 'white' : 'var(--color-ink)',
              }}
              title={soundOn ? 'New-order sound is on' : 'Tap to enable a sound for new orders'}
            >
              {soundOn ? <Bell size={14} /> : <BellOff size={14} />} {soundOn ? 'Sound on' : 'Sound off'}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-4 py-2 rounded-full"
              style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
        <p className="text-sm opacity-70 mb-4 flex items-center gap-1.5">
          <RefreshCw size={12} className="opacity-50" /> Updates live as orders come in.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="tel"
            placeholder="Look up a customer by 10-digit phone…"
            value={searchPhone}
            maxLength={10}
            onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, ''))}
            className="flex-1 px-3.5 py-2 rounded-xl border-2 outline-none text-sm font-mono"
            style={{ borderColor: 'rgba(36,28,20,0.15)' }}
          />
          <button
            type="submit"
            disabled={searching}
            className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-4 py-2 rounded-xl disabled:opacity-60"
            style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
          >
            <Search size={14} /> {searching ? '…' : 'Search'}
          </button>
          {searchResults && (
            <button type="button" onClick={clearSearch} className="px-3 py-2 rounded-xl" style={{ background: 'var(--color-paper-dim)' }}>
              <X size={16} />
            </button>
          )}
        </form>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}>
            {error}
          </div>
        )}

        {searchResults ? (
          <>
            <p className="text-xs font-mono uppercase tracking-wide opacity-60 mb-3">
              {searchResults.length} order{searchResults.length !== 1 ? 's' : ''} for {searchPhone}
            </p>
            <div className="space-y-3">
              {searchResults.map((order) => (
                <OrderCard key={order.id} order={order} isNew={false} busyId={busyId} onStatusChange={handleStatusChange} />
              ))}
              {searchResults.length === 0 && <p className="text-sm opacity-50 text-center py-10">No orders found for that number.</p>}
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="shrink-0 font-mono text-xs font-bold uppercase px-3.5 py-1.5 rounded-full border-2"
                  style={{
                    background: filter === f ? 'var(--color-charcoal)' : 'transparent',
                    color: filter === f ? 'var(--color-mustard)' : 'var(--color-ink)',
                    borderColor: 'var(--color-charcoal)',
                  }}
                >
                  {f === 'active' ? 'Active' : f === 'all' ? 'All' : STATUS_LABELS[f]}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="font-mono text-sm opacity-60 py-10 text-center">Loading orders…</p>
            ) : visibleOrders.length === 0 ? (
              <p className="text-sm opacity-50 text-center py-10">No orders in this view.</p>
            ) : (
              <div className="space-y-3">
                {visibleOrders.map((order) => (
                  <OrderCard key={order.id} order={order} isNew={newIds.has(order.id)} busyId={busyId} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

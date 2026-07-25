import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Trophy, Clock } from 'lucide-react'
import AdminNav from '../components/AdminNav'
import { useSEO } from '../hooks/useSEO'
import { fetchSalesSummary, fetchDailySales, fetchTopItems, fetchHourlyDistribution } from '../utils/api'

const CARDS = [
  { key: 'today', label: 'Today' },
  { key: 'last7Days', label: 'Last 7 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'allTime', label: 'All Time' },
]

function formatDay(dayStr) {
  const d = new Date(`${dayStr}T00:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatHour(hour) {
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

export default function AdminDashboard() {
  useSEO({ title: 'Sales dashboard | ServeAI', robots: 'noindex, nofollow', path: '/admin/dashboard' })
  const navigate = useNavigate()

  const [summary, setSummary] = useState(null)
  const [daily, setDaily] = useState([])
  const [topItems, setTopItems] = useState([])
  const [hourly, setHourly] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchSalesSummary(), fetchDailySales(14), fetchTopItems(30, 5), fetchHourlyDistribution(30)])
      .then(([summaryData, dailyData, topItemsData, hourlyData]) => {
        setSummary(summaryData)
        setDaily(dailyData)
        setTopItems(topItemsData)
        setHourly(hourlyData)
      })
      .catch((err) => {
        if (err.message?.toLowerCase().includes('expired') || err.message?.toLowerCase().includes('login required')) {
          navigate('/admin/login')
          return
        }
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const maxRevenue = Math.max(1, ...daily.map((d) => d.revenue))
  const maxTopQty = Math.max(1, ...topItems.map((i) => i.qty))
  const maxHourlyOrders = Math.max(1, ...hourly.map((h) => h.orders))
  const busiestHour = hourly.reduce((best, h) => (h.orders > (best?.orders || 0) ? h : best), null)

  return (
    <div className="min-h-screen px-5 py-8" style={{ background: 'var(--color-paper)' }}>
      <div className="max-w-3xl mx-auto">
        <AdminNav current="/admin/dashboard" />

        <h1 className="font-display text-3xl mb-1">Sales Dashboard</h1>
        <p className="text-sm opacity-70 mb-6">
          Revenue and order counts, pulled live from every order that's come through.
        </p>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <p className="font-mono text-sm opacity-60 py-10 text-center">Loading sales data…</p>
        ) : (
          summary && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {CARDS.map(({ key, label }) => (
                  <div
                    key={key}
                    className="rounded-2xl p-4"
                    style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">{label}</p>
                    <p className="font-display text-2xl mt-1" style={{ color: 'var(--color-chili)' }}>
                      ₹{summary[key].revenue.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs opacity-60 mt-0.5">
                      {summary[key].orders} order{summary[key].orders !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}>
                <p className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider opacity-70 mb-4">
                  <TrendingUp size={14} style={{ color: 'var(--color-chili)' }} />
                  Last 14 days
                </p>

                {daily.length === 0 ? (
                  <p className="text-xs opacity-50 text-center py-6">No orders yet in this window.</p>
                ) : (
                  <div className="flex items-end gap-1.5 h-40">
                    {daily.map((d) => (
                      <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${formatDay(d.day)}: ₹${d.revenue} (${d.orders} orders)`}>
                        <div
                          className="w-full rounded-t-md min-h-[3px]"
                          style={{
                            height: `${Math.max(3, (d.revenue / maxRevenue) * 100)}%`,
                            background: 'var(--color-chili)',
                          }}
                        />
                        <span className="text-[8px] font-mono opacity-50 rotate-0 whitespace-nowrap">
                          {formatDay(d.day).split(' ')[1]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl p-5" style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}>
                <p className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider opacity-70 mb-4">
                  <Trophy size={14} style={{ color: 'var(--color-mustard)' }} />
                  Top Sellers (last 30 days)
                </p>

                {topItems.length === 0 ? (
                  <p className="text-xs opacity-50 text-center py-6">No orders yet in this window.</p>
                ) : (
                  <div className="space-y-2.5">
                    {topItems.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="font-display text-sm w-5 shrink-0 opacity-40">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <div className="h-1.5 rounded-full bg-black/5 mt-1 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(item.qty / maxTopQty) * 100}%`, background: 'var(--color-chili)' }}
                            />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-xs font-bold">{item.qty} sold</p>
                          <p className="font-mono text-[10px] opacity-50">₹{item.revenue.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl p-5 mt-6" style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}>
                <p className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
                  <Clock size={14} style={{ color: 'var(--color-chili)' }} />
                  Busiest Hours (last 30 days)
                </p>
                {busiestHour && busiestHour.orders > 0 && (
                  <p className="text-xs opacity-60 mb-4">
                    Peak time is around <strong>{formatHour(busiestHour.hour)}</strong> — {busiestHour.orders} orders in that hour over the last month.
                  </p>
                )}

                {hourly.every((h) => h.orders === 0) ? (
                  <p className="text-xs opacity-50 text-center py-6">No orders yet in this window.</p>
                ) : (
                  <div className="flex items-end gap-[3px] h-32">
                    {hourly.map((h) => (
                      <div
                        key={h.hour}
                        className="flex-1 flex flex-col items-center justify-end h-full"
                        title={`${formatHour(h.hour)}: ${h.orders} orders, ₹${h.revenue}`}
                      >
                        <div
                          className="w-full rounded-t-sm min-h-[2px]"
                          style={{
                            height: `${Math.max(2, (h.orders / maxHourlyOrders) * 100)}%`,
                            background: h.hour === busiestHour?.hour ? 'var(--color-chili)' : 'var(--color-mustard)',
                          }}
                        />
                        {h.hour % 6 === 0 && (
                          <span className="text-[7px] font-mono opacity-40 mt-1 whitespace-nowrap">{formatHour(h.hour)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )
        )}
      </div>
    </div>
  )
}

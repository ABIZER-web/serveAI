import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { BookOpen, AlertTriangle } from 'lucide-react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import CategoryNav from '../components/CategoryNav'
import MenuItem from '../components/MenuItem'
import CartDrawer from '../components/CartDrawer'
import FloatingCartButton from '../components/FloatingCartButton'
import FindUs from '../components/FindUs'
import Footer from '../components/Footer'
import { useMenu } from '../context/MenuContext'
import { useSettings } from '../context/SettingsContext'
import { useSEO } from '../hooks/useSEO'
import { injectRestaurantSchema } from '../utils/structuredData'

export default function Menu() {
  useSEO({
    title: 'ServeAI — Scan. Tap. Served.',
    description:
      'Order straight from your table at the truck. Browse the menu, build your ticket, and skip the line — powered by ServeAI.',
    robots: 'index, follow',
    path: '/',
  })

  const { categories, loading, offline } = useMenu()
  const { settings } = useSettings()

  useEffect(() => {
    if (categories.length > 0) injectRestaurantSchema(categories, settings)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, settings.contactLocationLines, settings.contactPhone])

  const [searchParams] = useSearchParams()
  const tableFromUrl = searchParams.get('table')
  const [tableNumber] = useState(() => {
    if (tableFromUrl) {
      try {
        localStorage.setItem('serveai_table', tableFromUrl)
      } catch {
        /* storage unavailable — table just won't persist across navigation */
      }
      return tableFromUrl
    }
    try {
      return localStorage.getItem('serveai_table')
    } catch {
      return null
    }
  })
  const [active, setActive] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const sectionRefs = useRef({})
  const navigate = useNavigate()

  useEffect(() => {
    if (!active && categories.length > 0) setActive(categories[0].id)
  }, [categories, active])

  const scrollTo = (id) => {
    setActive(id)
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (categories.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.dataset.category)
        })
      },
      { rootMargin: '-140px 0px -70% 0px' }
    )
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [categories])

  const handleOrderPlaced = (order) => {
    setCartOpen(false)
    navigate('/order-success', { state: { order } })
  }

  return (
    <div className="min-h-screen pb-24">
      <Header tableNumber={tableNumber} />
      <Hero />
      <div className="checker-strip" />

      {offline && !loading && (
        <p className="text-center text-xs font-mono py-1.5" style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}>
          Showing a saved menu — reconnecting to the kitchen…
        </p>
      )}

      {settings.orderingPaused && (
        <div
          className="flex items-center justify-center gap-2 text-center text-sm font-semibold px-4 py-3"
          style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
        >
          <AlertTriangle size={16} className="shrink-0" />
          <span>{settings.closedMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <p className="font-mono text-sm opacity-60">Loading the menu…</p>
        </div>
      ) : (
        <>
          <CategoryNav categories={categories} active={active} onSelect={scrollTo} />

          <main className="px-4">
            {categories.map((cat) => (
              <section
                key={cat.id}
                data-category={cat.id}
                ref={(el) => (sectionRefs.current[cat.id] = el)}
                className="pt-6"
              >
                <h2 className="font-display text-2xl tracking-wide mb-1" style={{ color: 'var(--color-ink)' }}>
                  {cat.label}
                </h2>
                <div
                  className="rounded-2xl px-4 mt-2"
                  style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}
                >
                  {cat.items.map((item) => (
                    <MenuItem key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </main>

          <div className="flex justify-center px-4 pt-8">
            <Link
              to="/booklet"
              className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-full transition-transform active:scale-95"
              style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
            >
              <BookOpen size={16} /> Flip through the menu booklet
            </Link>
          </div>

          <FindUs />
          <div className="checker-strip" />
          <Footer />
        </>
      )}

      <FloatingCartButton onClick={() => setCartOpen(true)} />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onOrderPlaced={handleOrderPlaced}
        tableNumber={tableNumber}
      />
    </div>
  )
}

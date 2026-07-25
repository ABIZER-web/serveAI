import { forwardRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Logo from './Logo'
import { useSettings } from '../context/SettingsContext'

// react-pageflip requires each page to forward a ref to its root DOM node.
const BookletPage = forwardRef(function BookletPage({ variant = 'category', category }, ref) {
  const { settings } = useSettings()

  if (variant === 'cover') {
    return (
      <div ref={ref} className="booklet-page flex flex-col items-center justify-center text-center px-6 py-8" style={{ background: 'var(--color-charcoal)' }}>
        <div className="checker-strip w-full absolute top-0 left-0" />
        <Logo size={72} showWordmark={false} />
        <h1 className="font-display text-5xl tracking-wide mt-4" style={{ color: 'var(--color-mustard)' }}>
          MENU
        </h1>
        <p className="font-mono text-xs tracking-[0.3em] uppercase mt-2" style={{ color: 'var(--color-paper)', opacity: 0.7 }}>
          Scan · Tap · Served
        </p>

        <div className="mt-8 p-3 rounded-2xl bg-white">
          <QRCodeSVG value={window.location.origin} size={120} fgColor="#1B1B1B" bgColor="#FFFFFF" />
        </div>
        <p className="font-display text-lg tracking-wide mt-3" style={{ color: 'var(--color-mustard)' }}>
          SCAN &amp; ORDER
        </p>

        <p className="font-mono text-[10px] mt-10 opacity-40" style={{ color: 'var(--color-paper)' }}>
          Flip through for the full menu →
        </p>
        <div className="checker-strip w-full absolute bottom-0 left-0" />
      </div>
    )
  }

  if (variant === 'back') {
    return (
      <div ref={ref} className="booklet-page flex flex-col items-center justify-center text-center px-6 py-8" style={{ background: 'var(--color-charcoal)' }}>
        <div className="checker-strip w-full absolute top-0 left-0" />
        <Logo size={48} showWordmark={false} />
        <p className="font-display text-2xl tracking-wide mt-5 mb-1" style={{ color: 'var(--color-mustard)' }}>
          Find Us
        </p>
        <div className="mt-3 space-y-0.5">
          {settings.contactLocationLines.map((line) => (
            <p key={line} className="font-display text-sm tracking-wide" style={{ color: 'var(--color-paper)' }}>
              {line}
            </p>
          ))}
        </div>
        <a
          href={`tel:${settings.contactPhone.replace(/\s/g, '')}`}
          className="font-display text-lg tracking-wide mt-4"
          style={{ color: 'var(--color-mustard)' }}
        >
          {settings.contactPhone}
        </a>
        <p className="font-mono text-[10px] mt-8 opacity-40" style={{ color: 'var(--color-paper)' }}>
          Thanks for stopping by the truck.
        </p>
        <div className="checker-strip w-full absolute bottom-0 left-0" />
      </div>
    )
  }

  // category page
  return (
    <div ref={ref} className="booklet-page flex flex-col px-4 py-6" style={{ background: 'var(--color-paper)' }}>
      <h2 className="font-display text-2xl tracking-wide text-center mb-4" style={{ color: 'var(--color-chili)' }}>
        {category.label}
      </h2>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {category.items.map((item) => {
          const soldOut = item.available === false
          return (
            <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-dashed border-charcoal/20 last:border-0" style={{ opacity: soldOut ? 0.45 : 1 }}>
              <div
                className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl overflow-hidden"
                style={{ background: 'var(--color-paper-dim)', border: '1.5px solid var(--color-charcoal)' }}
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  item.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm tracking-wide leading-tight">{item.name}</p>
                {soldOut ? (
                  <span
                    className="inline-block text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full mt-0.5"
                    style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
                  >
                    Sold Out
                  </span>
                ) : (
                  item.tag && (
                    <span
                      className="inline-block text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full mt-0.5"
                      style={{ background: 'var(--color-basil)', color: 'var(--color-paper)' }}
                    >
                      {item.tag}
                    </span>
                  )
                )}
              </div>
              <span className="font-mono text-sm font-bold shrink-0" style={{ color: 'var(--color-chili)' }}>
                ₹{item.price}
              </span>
            </div>
          )
        })}
        {category.items.length === 0 && (
          <p className="text-center text-xs opacity-50 pt-6">No items in this section yet.</p>
        )}
      </div>
      <p className="text-center font-mono text-[9px] opacity-30 pt-3">ServeAI</p>
    </div>
  )
})

export default BookletPage

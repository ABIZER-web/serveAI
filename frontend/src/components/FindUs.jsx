import { useSettings } from '../context/SettingsContext'

export default function FindUs() {
  const { settings } = useSettings()

  return (
    <section className="px-4 pt-10 pb-8">
      <div className="flex items-center justify-center gap-4 mb-6">
        <span className="h-px w-14" style={{ background: 'var(--color-charcoal)', opacity: 0.3 }} />
        <h2 className="font-display text-3xl tracking-wide" style={{ color: 'var(--color-chili)' }}>
          Find Us
        </h2>
        <span className="h-px w-14" style={{ background: 'var(--color-charcoal)', opacity: 0.3 }} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
        <div
          className="flex-1 rounded-2xl px-5 py-6 text-center"
          style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">Location</p>
          {settings.contactLocationLines.map((line) => (
            <p key={line} className="font-display text-base tracking-wide leading-snug" style={{ color: 'var(--color-chili)' }}>
              {line}
            </p>
          ))}
        </div>

        <div
          className="flex-1 rounded-2xl px-5 py-6 text-center flex flex-col justify-center"
          style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">Drop a text / call</p>
          <a
            href={`tel:${settings.contactPhone.replace(/\s/g, '')}`}
            className="font-display text-xl tracking-wide"
            style={{ color: 'var(--color-chili)' }}
          >
            {settings.contactPhone}
          </a>
        </div>
      </div>
    </section>
  )
}

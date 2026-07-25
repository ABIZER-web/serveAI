export default function Hero() {
  return (
    <section
      className="relative overflow-hidden px-5 pt-8 pb-7"
      style={{ background: 'var(--color-charcoal)' }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20" style={{ background: 'var(--color-chili)' }} />
      <div className="relative flex items-start gap-3">
        <div className="text-5xl leading-none mt-1">
          <span className="inline-block steam-line" style={{ animationDelay: '0s' }}>~</span>
        </div>
      </div>
      <h1
        className="relative font-display text-4xl leading-[0.95] tracking-wide"
        style={{ color: 'var(--color-paper)' }}
      >
        SCAN.<br />
        TAP.<br />
        <span style={{ color: 'var(--color-mustard)' }}>SERVED.</span>
      </h1>
      <p className="relative font-mono text-xs mt-3 max-w-xs opacity-70" style={{ color: 'var(--color-paper)' }}>
        Order straight from your table — no waiting in line, no waving down a server. Your food, your pace.
      </p>
    </section>
  )
}

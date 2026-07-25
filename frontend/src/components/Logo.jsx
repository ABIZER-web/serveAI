export default function Logo({ size = 48, animated = true, showWordmark = true }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={animated ? 'float-badge' : ''}
      >
        <circle cx="50" cy="50" r="48" fill="var(--color-chili)" stroke="var(--color-mustard)" strokeWidth="4" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-paper)" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.6" />
        {/* speed swoosh */}
        <path d="M14 62 C 30 68, 70 68, 86 58" stroke="var(--color-mustard)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
        {/* cloche / serving dome */}
        <path
          d="M28 60 Q28 34 50 34 Q72 34 72 60 Z"
          fill="var(--color-paper)"
        />
        <rect x="24" y="60" width="52" height="7" rx="3.5" fill="var(--color-paper)" />
        <circle cx="50" cy="30" r="4" fill="var(--color-paper)" />
        <rect x="47.5" y="24" width="5" height="7" rx="2" fill="var(--color-paper)" />
        {/* AI spark on dome */}
        <path d="M50 40 L52.3 45.6 L58 48 L52.3 50.4 L50 56 L47.7 50.4 L42 48 L47.7 45.6 Z" fill="var(--color-chili)" />
      </svg>
      {showWordmark && (
        <div className="leading-none">
          <div className="font-display text-2xl tracking-wide text-charcoal" style={{ color: 'var(--color-ink)' }}>
            SERVE<span style={{ color: 'var(--color-chili)' }}>AI</span>
          </div>
          <div className="font-mono text-[9px] tracking-[0.3em] uppercase opacity-60 mt-0.5">
            Scan · Tap · Served
          </div>
        </div>
      )}
    </div>
  )
}

export default function CategoryNav({ categories, active, onSelect }) {
  return (
    <div
      className="sticky top-[64px] z-30 flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar"
      style={{ background: 'var(--color-paper)', borderBottom: '1px solid rgba(36,28,20,0.1)' }}
    >
      {categories.map((cat) => {
        const isActive = active === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="shrink-0 font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border-2 transition-colors"
            style={{
              background: isActive ? 'var(--color-charcoal)' : 'transparent',
              color: isActive ? 'var(--color-mustard)' : 'var(--color-ink)',
              borderColor: 'var(--color-charcoal)',
            }}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}

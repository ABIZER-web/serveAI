import Logo from './Logo'

export default function Header({ tableNumber }) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5"
      style={{ background: 'var(--color-paper)', borderBottom: '1px solid rgba(36,28,20,0.12)' }}
    >
      <Logo size={40} />
      {tableNumber && (
        <div
          className="font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
        >
          Table {tableNumber}
        </div>
      )}
    </header>
  )
}

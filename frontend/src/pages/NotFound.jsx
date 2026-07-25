import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { useSEO } from '../hooks/useSEO'

export default function NotFound() {
  useSEO({ title: 'Page not found | ServeAI', robots: 'noindex, nofollow' })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: 'var(--color-paper)' }}>
      <Logo size={56} showWordmark={false} />
      <p className="font-display text-3xl tracking-wide" style={{ color: 'var(--color-chili)' }}>
        Page not found
      </p>
      <p className="text-sm opacity-70 max-w-xs">
        That link or QR code doesn't match anything here.
      </p>
      <Link
        to="/"
        className="font-mono text-sm uppercase font-bold px-5 py-2.5 rounded-full"
        style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
      >
        Back to menu
      </Link>
    </div>
  )
}

import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="text-center px-4 py-6" style={{ background: 'var(--color-charcoal)' }}>
      <p className="font-mono text-[11px]" style={{ color: 'var(--color-paper)', opacity: 0.6 }}>
        © 2026 ServeAI. All rights reserved.
      </p>
      <p className="font-mono text-[11px] mt-1" style={{ color: 'var(--color-mustard)' }}>
        Made with ♥ by Abizer Saify
      </p>
      <Link
        to="/terms"
        className="inline-block font-mono text-[10px] uppercase tracking-wider underline mt-2"
        style={{ color: 'var(--color-paper)', opacity: 0.5 }}
      >
        Terms &amp; Conditions
      </Link>
    </footer>
  )
}

import { Component } from 'react'
import Logo from './Logo'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Swap for real error reporting (Sentry, etc.) once you have one wired up.
    console.error('ServeAI crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
          style={{ background: 'var(--color-paper)' }}
        >
          <Logo size={56} showWordmark={false} />
          <p className="font-display text-3xl tracking-wide" style={{ color: 'var(--color-chili)' }}>
            Something went sideways
          </p>
          <p className="text-sm opacity-70 max-w-xs">
            Give it another try — if it keeps happening, let the counter staff know.
          </p>
          <button
            onClick={() => window.location.assign('/')}
            className="font-mono text-sm uppercase font-bold px-5 py-2.5 rounded-full"
            style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
          >
            Reload menu
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

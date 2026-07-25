import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock } from 'lucide-react'
import Logo from '../components/Logo'
import { adminLogin } from '../utils/api'
import { useSEO } from '../hooks/useSEO'

export default function AdminLogin() {
  useSEO({ title: 'Admin login | ServeAI', robots: 'noindex, nofollow', path: '/admin/login' })

  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const destination = location.state?.from || '/admin/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await adminLogin(password)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--color-charcoal)' }}>
      <div className="w-full max-w-sm rounded-2xl px-6 py-8" style={{ background: 'var(--color-paper)' }}>
        <div className="flex flex-col items-center gap-3 mb-6">
          <Logo size={48} showWordmark={false} />
          <div className="text-center">
            <p className="font-display text-2xl tracking-wide">Staff Login</p>
            <p className="text-xs opacity-60 mt-1">Manage the menu and table QR codes.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="password"
              autoFocus
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 outline-none text-sm"
              style={{ borderColor: error ? 'var(--color-chili)' : 'rgba(36,28,20,0.2)' }}
            />
          </div>
          {error && <p className="text-xs" style={{ color: 'var(--color-chili)' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl font-display text-lg tracking-wide disabled:opacity-60"
            style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
          >
            {loading ? 'Checking…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}

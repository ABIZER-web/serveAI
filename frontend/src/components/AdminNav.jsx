import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, ListOrdered, ClipboardList, QrCode, Settings, LogOut } from 'lucide-react'
import Logo from './Logo'
import { clearAdminToken } from '../utils/api'

const LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/orders', label: 'Orders', icon: ListOrdered },
  { to: '/admin/menu', label: 'Menu manager', icon: ClipboardList },
  { to: '/admin/qr-codes', label: 'Table QR codes', icon: QrCode },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminNav({ current }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAdminToken()
    navigate('/admin/login')
  }

  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3 print:hidden">
      <Logo size={40} />
      <div className="flex items-center gap-2 flex-wrap">
        {LINKS.filter((l) => l.to !== current).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-3 py-2 rounded-full"
            style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
          >
            <Icon size={14} /> {label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-3 py-2 rounded-full"
          style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
        >
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  )
}

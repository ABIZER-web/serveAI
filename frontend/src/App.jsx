import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { MenuProvider } from './context/MenuContext'
import { SettingsProvider } from './context/SettingsContext'
import RequireAdmin from './components/RequireAdmin'
import Menu from './pages/Menu'
import Booklet from './pages/Booklet'
import OrderSuccess from './pages/OrderSuccess'
import OrderLookup from './pages/OrderLookup'
import AdminLogin from './pages/AdminLogin'
import AdminMenu from './pages/AdminMenu'
import AdminQR from './pages/AdminQR'
import AdminDashboard from './pages/AdminDashboard'
import AdminOrders from './pages/AdminOrders'
import AdminSettings from './pages/AdminSettings'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <SettingsProvider>
      <MenuProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/booklet" element={<Booklet />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/order/:id" element={<RequireAdmin><OrderLookup /></RequireAdmin>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
            <Route path="/admin/menu" element={<RequireAdmin><AdminMenu /></RequireAdmin>} />
            <Route path="/admin/qr-codes" element={<RequireAdmin><AdminQR /></RequireAdmin>} />
            <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </MenuProvider>
    </SettingsProvider>
  )
}

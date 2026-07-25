// Talks to the ServeAI backend (see /server). Set VITE_API_URL in a .env
// file to point at your deployed API, e.g. VITE_API_URL=https://api.yoursite.com
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const TOKEN_KEY = 'serveai_admin_token'

export async function placeOrder({ table, name, phone, items, total, notes, orderType, deliveryAddress, paymentMethod }) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, name, phone, items, total, notes, orderType, deliveryAddress, paymentMethod }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Could not place order. Please try again.')
  }
  return data
}

export async function verifyPayment(orderId, payload) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Payment could not be verified.')
  return data
}

export async function fetchOrder(id) {
  const res = await fetch(`${API_URL}/api/orders/${id}`)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Order not found.')
  }
  return data
}

export async function fetchMenu() {
  const res = await fetch(`${API_URL}/api/menu`)
  if (!res.ok) throw new Error('Could not load the menu.')
  return res.json()
}

// --- Admin auth -----------------------------------------------------------

export function getAdminToken() {
  try {
    // localStorage (not sessionStorage) on purpose — this is a single,
    // trusted admin device, and staying logged in across browser restarts
    // is the point. The token itself still expires after 30 days
    // (see backend/auth.js).
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAdminToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* storage unavailable — login just won't persist across restarts */
  }
}

export function clearAdminToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* nothing to clear */
  }
}

export async function adminLogin(password) {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed.')
  setAdminToken(data.token)
  return data.token
}

async function adminFetch(path, options = {}) {
  const token = getAdminToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 401) {
    clearAdminToken()
    throw new Error('Your session expired — please log in again.')
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed.')
  return data
}

export const createItem = (item) => adminFetch('/api/items', { method: 'POST', body: JSON.stringify(item) })
export const updateItem = (id, item) =>
  adminFetch(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(item) })
export const deleteItem = (id) => adminFetch(`/api/items/${id}`, { method: 'DELETE' })
export const createCategory = (category) =>
  adminFetch('/api/categories', { method: 'POST', body: JSON.stringify(category) })
export const deleteCategory = (id) => adminFetch(`/api/categories/${id}`, { method: 'DELETE' })
export const reorderCategories = (orderedIds) =>
  adminFetch('/api/categories/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) })
export const reorderItems = (categoryId, orderedIds) =>
  adminFetch('/api/items/reorder', { method: 'PUT', body: JSON.stringify({ categoryId, orderedIds }) })

export const fetchSalesSummary = () => adminFetch('/api/admin/analytics')
export const fetchDailySales = (days = 14) => adminFetch(`/api/admin/analytics/daily?days=${days}`)
export const fetchTopItems = (days = 30, limit = 5) =>
  adminFetch(`/api/admin/analytics/top-items?days=${days}&limit=${limit}`)
export const fetchHourlyDistribution = (days = 30) => adminFetch(`/api/admin/analytics/hourly?days=${days}`)

// --- Admin order management (kitchen view) --------------------------------

// Full order detail, including the customer's name and phone — only
// available to a logged-in admin. (fetchOrder above is the public,
// redacted version customers poll for their own status.)
export const fetchOrderAdmin = (id) => adminFetch(`/api/orders/${id}`)
export const fetchOrders = (limit = 100) => adminFetch(`/api/orders?limit=${limit}`)
export const setOrderStatus = (id, status) =>
  adminFetch(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const searchOrdersByPhone = (phone) => adminFetch(`/api/admin/orders/search?phone=${phone}`)

export async function downloadOrdersCsv() {
  const token = getAdminToken()
  const res = await fetch(`${API_URL}/api/admin/orders/export.csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) {
    clearAdminToken()
    throw new Error('Your session expired — please log in again.')
  }
  if (!res.ok) throw new Error('Could not export orders.')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'serveai-orders.csv'
  link.click()
  URL.revokeObjectURL(url)
}

// --- Site settings (store status + Find Us info) --------------------------

// Public — the ordering menu needs this without requiring a login.
export async function fetchSettings() {
  const res = await fetch(`${API_URL}/api/settings`)
  if (!res.ok) throw new Error('Could not load settings.')
  return res.json()
}

export const updateSettings = (patch) =>
  adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(patch) })

// --- AI-assisted descriptions (needs GEMINI_API_KEY on the backend) -------

export const generateDescription = ({ name, category }) =>
  adminFetch('/api/admin/ai/describe-item', { method: 'POST', body: JSON.stringify({ name, category }) })

// --- Backup / restore -------------------------------------------------

export async function downloadBackup() {
  const token = getAdminToken()
  const res = await fetch(`${API_URL}/api/admin/backup`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 401) {
    clearAdminToken()
    throw new Error('Your session expired — please log in again.')
  }
  if (!res.ok) throw new Error('Could not create a backup.')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `serveai-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export const restoreBackup = (data) =>
  adminFetch('/api/admin/restore', { method: 'POST', body: JSON.stringify(data) })

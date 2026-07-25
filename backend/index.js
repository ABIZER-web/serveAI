import http from 'node:http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import {
  connectDB,
  createOrder,
  getOrder,
  listOrders,
  findOrdersByPhone,
  updateOrderStatus,
  setOrderRazorpayInfo,
  markOrderPaid,
  getMenu,
  createCategory,
  deleteCategory,
  reorderCategories,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
  getSalesSummary,
  getDailySales,
  getTopItems,
  getHourlyDistribution,
  getSettings,
  updateSettings,
  exportBackup,
  restoreBackup,
} from './db.js'
import { verifyAdminPassword, issueAdminToken, requireAdmin, isAdminRequest } from './auth.js'
import { generateItemDescription } from './gemini.js'
import { createRazorpayOrder, verifyRazorpaySignature, isRazorpayConfigured } from './razorpay.js'
import { initSocket, emitNewOrder, emitOrderStatusChanged } from './realtime.js'

const app = express()
const PORT = process.env.PORT || 4000
const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN || '*'

app.use(helmet())
app.use(cors({ origin: ALLOWED_ORIGIN }))
// Bumped up from earlier to comfortably fit a full database backup/restore
// payload (which can include many orders) as well as compressed item photos.
app.use(express.json({ limit: '15mb' }))

// A generous general limit, plus tighter ones on the actions worth
// specifically protecting against spam.
app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }))
const orderLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false })
const loginLimiter = rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: true, legacyHeaders: false })

// Small helper so every route doesn't need its own try/catch — any thrown
// error (including Mongoose errors) becomes a clean 500 instead of
// crashing the process.
const handle = (fn) => (req, res) => fn(req, res).catch((err) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

// --- Menu (public read) -----------------------------------------------

app.get('/api/menu', handle(async (req, res) => {
  res.json(await getMenu())
}))

// --- Site settings ------------------------------------------------------

// Public — the ordering menu needs to know if the store is paused, and
// Find Us needs the contact info, without requiring a login.
app.get('/api/settings', handle(async (req, res) => {
  const settings = await getSettings()
  res.json({ ...settings, onlinePaymentEnabled: isRazorpayConfigured() })
}))

app.put('/api/admin/settings', requireAdmin, handle(async (req, res) => {
  const { orderingPaused, closedMessage, contactLocationLines, contactPhone } = req.body || {}
  if (orderingPaused !== undefined && typeof orderingPaused !== 'boolean') {
    return res.status(400).json({ error: 'orderingPaused must be true or false.' })
  }
  if (contactLocationLines !== undefined && !Array.isArray(contactLocationLines)) {
    return res.status(400).json({ error: 'contactLocationLines must be a list of lines.' })
  }
  const settings = await updateSettings({ orderingPaused, closedMessage, contactLocationLines, contactPhone })
  res.json({ ...settings, onlinePaymentEnabled: isRazorpayConfigured() })
}))

// --- Admin auth ----------------------------------------------------------

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { password } = req.body || {}
  if (!verifyAdminPassword(password)) {
    return res.status(401).json({ error: 'Incorrect password.' })
  }
  res.json({ token: issueAdminToken() })
})

// --- Menu management (admin only) ----------------------------------------

app.post('/api/categories', requireAdmin, handle(async (req, res) => {
  const { id, label } = req.body || {}
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    return res.status(400).json({ error: 'Category id must be lowercase letters, numbers, and dashes only.' })
  }
  if (!label || typeof label !== 'string' || !label.trim()) {
    return res.status(400).json({ error: 'Category needs a label.' })
  }
  try {
    const category = await createCategory({ id, label: label.trim() })
    res.status(201).json(category)
  } catch (err) {
    res.status(400).json({ error: err.code === 11000 ? 'That category id is already used.' : err.message })
  }
}))

app.delete('/api/categories/:id', requireAdmin, handle(async (req, res) => {
  try {
    await deleteCategory(req.params.id)
    res.status(204).end()
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}))

app.put('/api/categories/reorder', requireAdmin, handle(async (req, res) => {
  const { orderedIds } = req.body || {}
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'string')) {
    return res.status(400).json({ error: 'orderedIds must be a list of category ids.' })
  }
  await reorderCategories(orderedIds)
  res.json(await getMenu())
}))

function validItemPayload({ name, price }) {
  return typeof name === 'string' && name.trim().length > 0 && typeof price === 'number' && price > 0 && price < 100_000
}

function validImage(image) {
  if (image === undefined || image === null || image === '') return true
  return typeof image === 'string' && image.length < 2_000_000 && image.startsWith('data:image/')
}

// Option groups are optional and admin-authored, but still worth a sanity
// check so a malformed payload can't wedge weird data into the menu.
function validOptionGroups(optionGroups) {
  if (optionGroups === undefined) return true
  if (!Array.isArray(optionGroups) || optionGroups.length > 10) return false
  return optionGroups.every(
    (group) =>
      group &&
      typeof group.name === 'string' &&
      group.name.trim().length > 0 &&
      typeof group.multiple === 'boolean' &&
      Array.isArray(group.choices) &&
      group.choices.length <= 20 &&
      group.choices.every(
        (c) => c && typeof c.label === 'string' && c.label.trim().length > 0 && typeof c.priceDelta === 'number'
      )
  )
}

app.post('/api/items', requireAdmin, handle(async (req, res) => {
  const { categoryId, name, price, desc, tag, icon, image, optionGroups } = req.body || {}
  if (!categoryId || typeof categoryId !== 'string') {
    return res.status(400).json({ error: 'Item needs a category.' })
  }
  if (!validItemPayload({ name, price })) {
    return res.status(400).json({ error: 'Item needs a name and a positive price.' })
  }
  if (!validImage(image)) {
    return res.status(400).json({ error: 'Image is too large or invalid — try a smaller photo.' })
  }
  if (!validOptionGroups(optionGroups)) {
    return res.status(400).json({ error: 'One of the option groups looks malformed.' })
  }
  const item = await createItem({ categoryId, name: name.trim(), price, desc, tag, icon, image, optionGroups })
  res.status(201).json(item)
}))

app.put('/api/items/:id', requireAdmin, handle(async (req, res) => {
  const { name, price, desc, tag, icon, image, categoryId, available, optionGroups } = req.body || {}
  if (price !== undefined && !(typeof price === 'number' && price > 0 && price < 100_000)) {
    return res.status(400).json({ error: 'Price must be a positive number.' })
  }
  if (!validImage(image)) {
    return res.status(400).json({ error: 'Image is too large or invalid — try a smaller photo.' })
  }
  if (available !== undefined && typeof available !== 'boolean') {
    return res.status(400).json({ error: 'Available must be true or false.' })
  }
  if (!validOptionGroups(optionGroups)) {
    return res.status(400).json({ error: 'One of the option groups looks malformed.' })
  }
  const item = await updateItem(req.params.id, { name, price, desc, tag, icon, image, categoryId, available, optionGroups })
  if (!item) return res.status(404).json({ error: 'Item not found.' })
  res.json(item)
}))

app.delete('/api/items/:id', requireAdmin, handle(async (req, res) => {
  await deleteItem(req.params.id)
  res.status(204).end()
}))

app.put('/api/items/reorder', requireAdmin, handle(async (req, res) => {
  const { categoryId, orderedIds } = req.body || {}
  if (!categoryId || !Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'categoryId and orderedIds are required.' })
  }
  await reorderItems(categoryId, orderedIds)
  res.json(await getMenu())
}))

// --- AI-assisted menu descriptions (admin only, needs GEMINI_API_KEY) ----

app.post('/api/admin/ai/describe-item', requireAdmin, handle(async (req, res) => {
  const { name, category } = req.body || {}
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Give it an item name first.' })
  }
  try {
    const description = await generateItemDescription({ name, category })
    res.json({ description })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}))

// --- Orders ---------------------------------------------------------------

function validItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return false
  return items.every(
    (item) =>
      item &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.price === 'number' &&
      item.price > 0 &&
      Number.isInteger(item.qty) &&
      item.qty > 0 &&
      item.qty <= 50 &&
      (item.selectedOptions === undefined ||
        (Array.isArray(item.selectedOptions) &&
          item.selectedOptions.every(
            (o) => o && typeof o.groupName === 'string' && typeof o.label === 'string' && typeof o.priceDelta === 'number'
          )))
  )
}

app.post('/api/orders', orderLimiter, handle(async (req, res) => {
  const { table, name, phone, items, total, notes, orderType, deliveryAddress, paymentMethod } = req.body || {}

  const settings = await getSettings()
  if (settings.orderingPaused) {
    return res.status(403).json({ error: settings.closedMessage })
  }

  if (!name || typeof name !== 'string' || name.trim().replace(/[^a-zA-Z]/g, '').length < 2) {
    return res.status(400).json({ error: 'Name must contain at least 2 letters.' })
  }
  if (!phone || !/^\d{10}$/.test(String(phone).trim())) {
    return res.status(400).json({ error: 'Phone must be exactly 10 digits.' })
  }
  if (!validItems(items)) {
    return res.status(400).json({ error: 'Order must contain at least one valid item.' })
  }
  if (typeof total !== 'number' || total <= 0 || total > 500_000) {
    return res.status(400).json({ error: 'Invalid order total.' })
  }
  if (notes !== undefined && (typeof notes !== 'string' || notes.length > 300)) {
    return res.status(400).json({ error: 'Notes must be 300 characters or fewer.' })
  }
  if (orderType !== undefined && !['dine-in', 'takeaway', 'delivery'].includes(orderType)) {
    return res.status(400).json({ error: 'Invalid order type.' })
  }
  if (orderType === 'delivery' && (!deliveryAddress || !deliveryAddress.trim())) {
    return res.status(400).json({ error: 'Delivery orders need an address.' })
  }
  if (paymentMethod !== undefined && !['counter', 'online'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method.' })
  }
  if (paymentMethod === 'online' && !isRazorpayConfigured()) {
    return res.status(400).json({ error: 'Online payment is not set up yet — choose pay at counter instead.' })
  }

  const order = await createOrder({
    tableNo: table,
    name: name.trim(),
    phone: phone.trim(),
    items,
    total,
    notes: notes?.trim() || '',
    orderType,
    deliveryAddress: deliveryAddress?.trim() || '',
    paymentMethod,
  })

  let payment = null
  if (paymentMethod === 'online') {
    try {
      const razorpayOrder = await createRazorpayOrder({ amountInRupees: total, receipt: `serveai-${order.id}` })
      await setOrderRazorpayInfo(order.id, razorpayOrder.id)
      payment = { razorpayOrderId: razorpayOrder.id, razorpayKeyId: process.env.RAZORPAY_KEY_ID, amount: razorpayOrder.amount }
    } catch (err) {
      console.error('Razorpay order creation failed:', err.message)
      // The ServeAI order still exists (payment stays "pending") — the
      // frontend can offer to retry payment or fall back to pay-at-counter.
    }
  }

  emitNewOrder(order)
  res.status(201).json({ ...order, payment })
}))

// Verifies a completed Razorpay payment against the order it belongs to.
// Public — this is called from the customer's own browser right after
// the Razorpay checkout popup succeeds, before they're ever an admin.
app.post('/api/orders/:id/verify-payment', handle(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {}
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields.' })
  }

  const order = await getOrder(req.params.id)
  if (!order || order.razorpayOrderId !== razorpay_order_id) {
    return res.status(400).json({ error: 'This payment does not match that order.' })
  }

  const valid = verifyRazorpaySignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  })
  if (!valid) {
    return res.status(400).json({ error: 'Payment could not be verified.' })
  }

  const updated = await markOrderPaid(req.params.id, razorpay_payment_id)
  const { name, phone, ...publicOrder } = updated
  res.json(publicOrder)
}))

// Fetch one order by its sequential ID. Customers polling their own
// order-success page get a redacted view (no name/phone); staff logged
// in as admin get the full record.
app.get('/api/orders/:id', handle(async (req, res) => {
  const order = await getOrder(req.params.id)
  if (!order) return res.status(404).json({ error: 'Order not found.' })

  if (isAdminRequest(req)) {
    return res.json(order)
  }

  const { name, phone, ...publicOrder } = order
  res.json(publicOrder)
}))

app.get('/api/orders', requireAdmin, handle(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  res.json(await listOrders(limit))
}))

// Look up every order for a phone number — for "did my order go
// through" customer-service questions at the counter.
app.get('/api/admin/orders/search', requireAdmin, handle(async (req, res) => {
  const phone = String(req.query.phone || '').trim()
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Enter a 10-digit phone number to search.' })
  }
  res.json(await findOrdersByPhone(phone))
}))

app.patch('/api/orders/:id/status', requireAdmin, handle(async (req, res) => {
  const { status } = req.body || {}
  if (!['received', 'preparing', 'ready', 'served', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' })
  }
  const order = await updateOrderStatus(req.params.id, status)
  if (!order) return res.status(404).json({ error: 'Order not found.' })
  emitOrderStatusChanged(order)
  res.json(order)
}))

app.get('/api/admin/orders/export.csv', requireAdmin, handle(async (req, res) => {
  const orders = await listOrders(10_000)
  const header = 'Order ID,Table,Type,Name,Phone,Items,Total,Notes,Status,Payment,Created At\n'
  const rows = orders.map((o) => {
    const itemsSummary = o.items.map((i) => `${i.qty}x ${i.name}`).join('; ')
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    return [o.id, o.table, o.orderType, o.name, o.phone, itemsSummary, o.total, o.notes, o.status, `${o.paymentMethod}/${o.paymentStatus}`, o.createdAt]
      .map(escape)
      .join(',')
  })
  const csv = header + rows.join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="serveai-orders.csv"')
  res.send(csv)
}))

// --- Sales dashboard (admin only) -----------------------------------------

app.get('/api/admin/analytics', requireAdmin, handle(async (req, res) => {
  res.json(await getSalesSummary())
}))

app.get('/api/admin/analytics/daily', requireAdmin, handle(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 90)
  res.json(await getDailySales(days))
}))

app.get('/api/admin/analytics/top-items', requireAdmin, handle(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365)
  const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20)
  res.json(await getTopItems({ days, limit }))
}))

app.get('/api/admin/analytics/hourly', requireAdmin, handle(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365)
  res.json(await getHourlyDistribution(days))
}))

// --- Backup / restore (admin only) ----------------------------------------

app.get('/api/admin/backup', requireAdmin, handle(async (req, res) => {
  const backup = await exportBackup()
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', 'attachment; filename="serveai-backup.json"')
  res.send(JSON.stringify(backup, null, 2))
}))

app.post('/api/admin/restore', requireAdmin, handle(async (req, res) => {
  const data = req.body
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid backup file.' })
  }
  const summary = await restoreBackup(data)
  res.json(summary)
}))

app.get('/api/health', (req, res) => res.json({ ok: true }))

const httpServer = http.createServer(app)
initSocket(httpServer, ALLOWED_ORIGIN)

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`ServeAI API listening on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message)
    console.error('Check MONGODB_URI in .env — see the README for how to get a connection string.')
    process.exit(1)
  })

import mongoose from 'mongoose'
import Category from './models/Category.js'
import Item from './models/Item.js'
import Order from './models/Order.js'
import Customer from './models/Customer.js'
import Settings, { getSettings as getSettingsDoc } from './models/Settings.js'

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set in .env — see the README for how to get a connection string.'
    )
  }
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })

  // Seed a starter menu once, the first time this connects to an empty
  // database, so the site has something to show before anyone's used the
  // admin panel.
  const categoryCount = await Category.countDocuments()
  if (categoryCount === 0) {
    await seedMenu()
  }
}

async function seedMenu() {
  const seedCategories = [
    { _id: 'combos', label: 'Truck Combos', sortOrder: 0 },
    { _id: 'burgers', label: 'Burgers & Wraps', sortOrder: 1 },
    { _id: 'sides', label: 'Fries & Sides', sortOrder: 2 },
    { _id: 'drinks', label: 'Drinks', sortOrder: 3 },
    { _id: 'sweet', label: 'Sweet Treats', sortOrder: 4 },
  ]
  const seedItems = [
    { categoryId: 'combos', name: 'Smash Combo', price: 249, tag: 'Bestseller', description: 'Smash burger, loaded fries and a regular soda — the whole truck experience.', icon: '🍔' },
    { categoryId: 'combos', name: 'Grill Wrap Combo', price: 219, tag: 'Chef pick', description: 'Grilled paneer or chicken wrap with peri fries and a cold drink.', icon: '🌯' },
    { categoryId: 'burgers', name: 'Classic Smash Burger', price: 149, tag: null, description: 'Double smashed patty, cheddar melt, house sauce, toasted bun.', icon: '🍔' },
    { categoryId: 'burgers', name: 'Firestorm Burger', price: 169, tag: 'Spicy', description: 'Crispy fried patty, chipotle mayo, pickled jalapeños.', icon: '🌶️' },
    { categoryId: 'burgers', name: 'Tandoori Paneer Wrap', price: 159, tag: 'Veg', description: 'Char-grilled paneer, mint chutney, crunchy slaw, rumali roll.', icon: '🌯' },
    { categoryId: 'burgers', name: 'Peri Chicken Wrap', price: 179, tag: null, description: 'Peri-peri grilled chicken, garlic mayo, fresh veg.', icon: '🌯' },
    { categoryId: 'sides', name: 'Truck Fries', price: 99, tag: null, description: 'Crisp-cut fries tossed in ServeAI seasoning.', icon: '🍟' },
    { categoryId: 'sides', name: 'Loaded Cheese Fries', price: 149, tag: 'Bestseller', description: 'Fries buried under molten cheese, jalapeños and chipotle drizzle.', icon: '🧀' },
    { categoryId: 'sides', name: 'Crunch Nuggets (6pc)', price: 129, tag: null, description: 'Golden fried nuggets with a smoky dip.', icon: '🍗' },
    { categoryId: 'drinks', name: 'Classic Cola Float', price: 89, tag: null, description: 'Chilled cola topped with a scoop of vanilla foam.', icon: '🥤' },
    { categoryId: 'drinks', name: 'Truck Stop Lemonade', price: 99, tag: null, description: 'Fresh lemon, mint and a fizzy kick.', icon: '🍋' },
    { categoryId: 'drinks', name: 'Mango Chiller', price: 109, tag: 'Seasonal', description: 'Ripe mango blended with ice and a citrus twist.', icon: '🥭' },
    { categoryId: 'sweet', name: 'Molten Choco Brownie', price: 129, tag: 'Bestseller', description: 'Warm brownie, melted center, cocoa dust.', icon: '🍫' },
    { categoryId: 'sweet', name: 'Glazed Ring Donut', price: 79, tag: null, description: 'Classic glazed donut, fresh off the fryer.', icon: '🍩' },
  ]

  await Category.insertMany(seedCategories)
  await Item.insertMany(seedItems.map((it, i) => ({ ...it, sortOrder: i })))
}

// --- Menu -------------------------------------------------------------

function shapeItem(doc) {
  return {
    id: String(doc._id),
    categoryId: doc.categoryId,
    name: doc.name,
    price: doc.price,
    desc: doc.description,
    tag: doc.tag,
    icon: doc.icon,
    image: doc.image || null,
    available: doc.available !== false,
    optionGroups: doc.optionGroups || [],
  }
}

export async function getMenu() {
  const categories = await Category.find().sort({ sortOrder: 1, label: 1 })
  const items = await Item.find().sort({ sortOrder: 1, _id: 1 })
  return categories.map((cat) => ({
    id: cat._id,
    label: cat.label,
    sortOrder: cat.sortOrder,
    items: items.filter((it) => it.categoryId === cat._id).map(shapeItem),
  }))
}

export async function createCategory({ id, label }) {
  const top = await Category.find().sort({ sortOrder: -1 }).limit(1)
  const sortOrder = (top[0]?.sortOrder ?? -1) + 1
  const doc = await Category.create({ _id: id, label, sortOrder })
  return { id: doc._id, label: doc.label }
}

export async function deleteCategory(id) {
  const itemCount = await Item.countDocuments({ categoryId: id })
  if (itemCount > 0) {
    throw new Error('Category still has items — remove or move them first.')
  }
  await Category.findByIdAndDelete(id)
}

// Persists a new display order for every category, in one go — powers
// drag-to-reorder in the admin menu manager.
export async function reorderCategories(orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) => Category.findByIdAndUpdate(id, { sortOrder: index }))
  )
}

export async function createItem({ categoryId, name, price, desc, tag, icon, image, optionGroups }) {
  const top = await Item.find({ categoryId }).sort({ sortOrder: -1 }).limit(1)
  const sortOrder = (top[0]?.sortOrder ?? -1) + 1
  const doc = await Item.create({
    categoryId,
    name,
    price,
    description: desc || '',
    tag: tag || null,
    icon: icon || '🍽️',
    image: image || null,
    sortOrder,
    optionGroups: optionGroups || [],
  })
  return shapeItem(doc)
}

export async function getItem(id) {
  try {
    const doc = await Item.findById(id)
    return doc ? shapeItem(doc) : null
  } catch {
    // Malformed id (not a valid ObjectId) — treat as not found rather
    // than letting Mongoose throw a CastError up the stack.
    return null
  }
}

export async function updateItem(id, { name, price, desc, tag, icon, image, categoryId, available, optionGroups }) {
  let doc
  try {
    doc = await Item.findById(id)
  } catch {
    return null
  }
  if (!doc) return null

  if (name !== undefined) doc.name = name
  if (price !== undefined) doc.price = price
  if (desc !== undefined) doc.description = desc
  if (tag !== undefined) doc.tag = tag
  if (icon !== undefined) doc.icon = icon
  if (image !== undefined) doc.image = image
  if (categoryId !== undefined) doc.categoryId = categoryId
  if (available !== undefined) doc.available = available
  if (optionGroups !== undefined) doc.optionGroups = optionGroups

  await doc.save()
  return shapeItem(doc)
}

export async function deleteItem(id) {
  try {
    await Item.findByIdAndDelete(id)
  } catch {
    /* invalid id — nothing to delete */
  }
}

// Persists a new display order for every item within a category — powers
// drag-to-reorder in the admin menu manager.
export async function reorderItems(categoryId, orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) =>
      Item.findOneAndUpdate({ _id: id, categoryId }, { sortOrder: index })
    )
  )
}

// --- Orders -------------------------------------------------------------

function shapeOrder(doc) {
  return {
    id: doc.orderNumber,
    table: doc.table,
    name: doc.name,
    phone: doc.phone,
    items: doc.items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty,
      selectedOptions: (i.selectedOptions || []).map((o) => ({
        groupName: o.groupName,
        label: o.label,
        priceDelta: o.priceDelta,
      })),
    })),
    total: doc.total,
    notes: doc.notes || '',
    orderType: doc.orderType || 'dine-in',
    deliveryAddress: doc.deliveryAddress || '',
    status: doc.status,
    isReturningCustomer: doc.isReturningCustomer,
    paymentMethod: doc.paymentMethod || 'counter',
    paymentStatus: doc.paymentStatus || 'pending',
    razorpayOrderId: doc.razorpayOrderId || null,
    createdAt: doc.createdAt.toISOString(),
  }
}

export async function createOrder({
  tableNo,
  name,
  phone,
  items,
  total,
  notes,
  orderType,
  deliveryAddress,
  paymentMethod,
}) {
  const existingCustomer = await Customer.findOne({ phone })
  const isReturningCustomer = !!existingCustomer

  const order = await Order.create({
    table: tableNo ?? null,
    name,
    phone,
    items,
    total,
    notes: notes || '',
    orderType: orderType || 'dine-in',
    deliveryAddress: deliveryAddress || '',
    isReturningCustomer,
    paymentMethod: paymentMethod || 'counter',
    paymentStatus: paymentMethod === 'online' ? 'pending' : 'paid', // pay-at-counter is settled in person, so it's not "pending" in the online-payment sense
  })

  if (existingCustomer) {
    existingCustomer.name = name
    existingCustomer.orderCount += 1
    existingCustomer.lastOrderAt = new Date()
    await existingCustomer.save()
  } else {
    await Customer.create({ phone, name, orderCount: 1 })
  }

  return shapeOrder(order)
}

export async function setOrderRazorpayInfo(orderNumber, razorpayOrderId) {
  const doc = await Order.findOneAndUpdate(
    { orderNumber: Number(orderNumber) },
    { razorpayOrderId },
    { new: true }
  )
  return doc ? shapeOrder(doc) : null
}

export async function markOrderPaid(orderNumber, razorpayPaymentId) {
  const doc = await Order.findOneAndUpdate(
    { orderNumber: Number(orderNumber) },
    { paymentStatus: 'paid', razorpayPaymentId },
    { new: true }
  )
  return doc ? shapeOrder(doc) : null
}

export async function getOrder(id) {
  const doc = await Order.findOne({ orderNumber: Number(id) })
  return doc ? shapeOrder(doc) : null
}

export async function listOrders(limit = 50) {
  const docs = await Order.find().sort({ orderNumber: -1 }).limit(limit)
  return docs.map(shapeOrder)
}

// All orders for a phone number, most recent first — powers the "look up
// a customer's orders" search in the admin orders view.
export async function findOrdersByPhone(phone) {
  const docs = await Order.find({ phone: phone.trim() }).sort({ orderNumber: -1 }).limit(50)
  return docs.map(shapeOrder)
}

export async function updateOrderStatus(id, status) {
  const doc = await Order.findOneAndUpdate({ orderNumber: Number(id) }, { status }, { new: true })
  return doc ? shapeOrder(doc) : null
}

// --- Analytics ------------------------------------------------------------

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function daysAgo(n) {
  const d = startOfDay()
  d.setDate(d.getDate() - n)
  return d
}
function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function startOfYear() {
  const d = new Date()
  return new Date(d.getFullYear(), 0, 1)
}

async function revenueWindow(since) {
  const result = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' }, ...(since ? { createdAt: { $gte: since } } : {}) } },
    { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
  ])
  return result[0] ? { orders: result[0].orders, revenue: result[0].revenue } : { orders: 0, revenue: 0 }
}

export async function getSalesSummary() {
  const [today, last7Days, thisMonth, thisYear, allTime] = await Promise.all([
    revenueWindow(startOfDay()),
    revenueWindow(daysAgo(6)),
    revenueWindow(startOfMonth()),
    revenueWindow(startOfYear()),
    revenueWindow(null),
  ])
  return { today, last7Days, thisMonth, thisYear, allTime }
}

export async function getDailySales(days = 14) {
  const since = daysAgo(days - 1)
  const rows = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ])
  return rows.map((r) => ({ day: r._id, orders: r.orders, revenue: r.revenue }))
}

export async function getTopItems({ days = 30, limit = 5 } = {}) {
  const since = daysAgo(days)
  const rows = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: since } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        qty: { $sum: '$items.qty' },
        revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: limit },
  ])
  return rows.map((r) => ({ name: r._id, qty: r.qty, revenue: r.revenue }))
}

// Order count and revenue by hour of day (0–23, in IST) over a rolling
// window — powers the dashboard's "when do we get busy" chart.
export async function getHourlyDistribution(days = 30) {
  const since = daysAgo(days)
  const rows = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $hour: { date: '$createdAt', timezone: 'Asia/Kolkata' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ])
  const byHour = new Map(rows.map((r) => [r._id, { orders: r.orders, revenue: r.revenue }]))
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    orders: byHour.get(hour)?.orders || 0,
    revenue: byHour.get(hour)?.revenue || 0,
  }))
}

// --- Settings ---------------------------------------------------------

export async function getSettings() {
  const doc = await getSettingsDoc()
  return {
    orderingPaused: doc.orderingPaused,
    closedMessage: doc.closedMessage,
    contactLocationLines: doc.contactLocationLines,
    contactPhone: doc.contactPhone,
  }
}

export async function updateSettings(patch) {
  const doc = await getSettingsDoc()
  if (patch.orderingPaused !== undefined) doc.orderingPaused = patch.orderingPaused
  if (patch.closedMessage !== undefined) doc.closedMessage = patch.closedMessage
  if (patch.contactLocationLines !== undefined) doc.contactLocationLines = patch.contactLocationLines
  if (patch.contactPhone !== undefined) doc.contactPhone = patch.contactPhone
  await doc.save()
  return getSettings()
}

// --- Backup / restore -------------------------------------------------

export async function exportBackup() {
  const [categories, items, orders, settings] = await Promise.all([
    Category.find().lean(),
    Item.find().lean(),
    Order.find().lean(),
    getSettingsDoc(),
  ])
  return {
    exportedAt: new Date().toISOString(),
    categories,
    items,
    orders,
    settings: settings.toObject(),
  }
}

export async function restoreBackup(data) {
  const summary = { categories: 0, items: 0, orders: 0, settingsRestored: false }

  if (Array.isArray(data.categories)) {
    for (const cat of data.categories) {
      await Category.findByIdAndUpdate(cat._id, cat, { upsert: true })
      summary.categories += 1
    }
  }

  if (Array.isArray(data.items)) {
    for (const item of data.items) {
      const { _id, ...rest } = item
      await Item.findByIdAndUpdate(_id, rest, { upsert: true })
      summary.items += 1
    }
  }

  // Orders are only inserted if they don't already exist (matched by
  // orderNumber) — restoring never overwrites live order history.
  if (Array.isArray(data.orders)) {
    for (const order of data.orders) {
      const exists = await Order.findOne({ orderNumber: order.orderNumber })
      if (!exists) {
        const { _id, ...rest } = order
        await Order.create(rest)
        summary.orders += 1
      }
    }
  }

  if (data.settings) {
    const { _id, ...rest } = data.settings
    await Settings.findByIdAndUpdate('singleton', rest, { upsert: true })
    summary.settingsRestored = true
  }

  return summary
}

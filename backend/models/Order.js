import mongoose from 'mongoose'
import { nextSequence } from './Counter.js'

// One selected option on a cart line — e.g. { groupName: "Size", label: "Large", priceDelta: 40 }
const selectedOptionSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true },
    label: { type: String, required: true },
    priceDelta: { type: Number, default: 0 },
  },
  { _id: false }
)

const orderItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // final unit price, base + selected option deltas
    qty: { type: Number, required: true },
    selectedOptions: { type: [selectedOptionSchema], default: [] },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, required: true, unique: true, index: true },
    table: { type: String, default: null },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    notes: { type: String, default: '' },
    orderType: { type: String, enum: ['dine-in', 'takeaway', 'delivery'], default: 'dine-in' },
    deliveryAddress: { type: String, default: '' },
    status: {
      type: String,
      enum: ['received', 'preparing', 'ready', 'served', 'cancelled'],
      default: 'received',
    },
    isReturningCustomer: { type: Boolean, default: false },
    paymentMethod: { type: String, enum: ['counter', 'online'], default: 'counter' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

// Assign the next sequential order number automatically on first save.
orderSchema.pre('save', async function assignOrderNumber(next) {
  if (this.isNew && this.orderNumber === undefined) {
    this.orderNumber = await nextSequence('orderNumber')
  }
  next()
})

export default mongoose.model('Order', orderSchema)

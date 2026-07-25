import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true }, // most recent name used
  orderCount: { type: Number, default: 0 },
  firstOrderAt: { type: Date, default: Date.now },
  lastOrderAt: { type: Date, default: Date.now },
})

export default mongoose.model('Customer', customerSchema)

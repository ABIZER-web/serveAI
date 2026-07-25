import mongoose from 'mongoose'

const counterSchema = new mongoose.Schema({
  _id: { type: String }, // counter name, e.g. "orderNumber"
  value: { type: Number, default: 0 },
})

const Counter = mongoose.model('Counter', counterSchema)

// Atomically increments and returns the next value — this is what keeps
// order numbers real and sequential (1, 2, 3, 4…) instead of using
// MongoDB's non-sequential ObjectId as the customer-facing order number.
export async function nextSequence(name) {
  const result = await Counter.findByIdAndUpdate(
    name,
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  )
  return result.value
}

export default Counter

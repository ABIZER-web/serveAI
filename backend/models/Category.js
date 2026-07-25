import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  _id: { type: String }, // human-chosen slug, e.g. "burgers"
  label: { type: String, required: true },
  sortOrder: { type: Number, required: true, default: 0 },
})

export default mongoose.model('Category', categorySchema)

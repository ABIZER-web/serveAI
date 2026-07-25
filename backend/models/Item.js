import mongoose from 'mongoose'

// A single choice within an option group — e.g. "Large" (+₹40) inside a
// "Size" group, or "Extra Cheese" (+₹20) inside an "Add-ons" group.
const optionChoiceSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    priceDelta: { type: Number, default: 0 }, // added to the base price when chosen
  },
  { _id: false }
)

// A group of choices. `multiple: false` behaves like a size picker (pick
// exactly one); `multiple: true` behaves like add-ons (pick any number).
const optionGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Size", "Add-ons"
    multiple: { type: Boolean, default: false },
    required: { type: Boolean, default: false }, // only meaningful when multiple: false
    choices: { type: [optionChoiceSchema], default: [] },
  },
  { _id: false }
)

const itemSchema = new mongoose.Schema(
  {
    categoryId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    tag: { type: String, default: null },
    icon: { type: String, default: '🍽️' },
    image: { type: String, default: null }, // base64 data URI, compressed client-side
    available: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    optionGroups: { type: [optionGroupSchema], default: [] },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

export default mongoose.model('Item', itemSchema)

import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' }, // there's only ever one settings document
  orderingPaused: { type: Boolean, default: false },
  closedMessage: { type: String, default: "We're not accepting orders right now — check back soon!" },
  contactLocationLines: {
    type: [String],
    default: ['YOUR AREA NAME', 'NEAR A LANDMARK', 'OPPOSITE TO ___', 'CITY, STATE - PINCODE'],
  },
  contactPhone: { type: String, default: '+91 00000 00000' },
})

const Settings = mongoose.model('Settings', settingsSchema)

export async function getSettings() {
  let doc = await Settings.findById('singleton')
  if (!doc) doc = await Settings.create({ _id: 'singleton' })
  return doc
}

export default Settings

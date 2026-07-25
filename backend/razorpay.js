import Razorpay from 'razorpay'
import crypto from 'node:crypto'

function getClient() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set in .env — online payment is turned off until they are.')
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

// Amount is in rupees on our side; Razorpay wants the smallest currency
// unit (paise), so it's multiplied by 100 here — nowhere else.
export async function createRazorpayOrder({ amountInRupees, receipt }) {
  const client = getClient()
  return client.orders.create({
    amount: Math.round(amountInRupees * 100),
    currency: 'INR',
    receipt,
  })
}

export function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) return false

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  return expected === razorpaySignature
}

export function isRazorpayConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

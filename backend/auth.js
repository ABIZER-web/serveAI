import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-only-secret-change-me'

// Plain-text password for now, straight from .env — simplest thing that
// works while you're setting this up. When you're ready to harden it,
// switch to hash-password.js + bcrypt (see README "Upgrading to a hashed
// password" section) instead of comparing ADMIN_PASSWORD directly.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_PASSWORD) {
  console.warn(
    '⚠️  ADMIN_PASSWORD is not set in .env — admin login will reject everyone.'
  )
}

export function verifyAdminPassword(password) {
  if (!ADMIN_PASSWORD || !password) return false
  return password === ADMIN_PASSWORD
}

export function issueAdminToken() {
  // Long-lived on purpose — this is meant to stay logged in on the one
  // trusted device it's used from, not expire like a public web session.
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '30d' })
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Admin login required.' })

  try {
    jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Session expired — please log in again.' })
  }
}

// Non-blocking check for routes that return different data to admins vs.
// the public (e.g. order status: customers can poll their own order's
// status, but only staff should see the name/phone attached to it).
export function isAdminRequest(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return false
  try {
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

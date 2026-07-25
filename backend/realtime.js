import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-only-secret-change-me'

let io = null

export function initSocket(httpServer, corsOrigin) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin },
  })

  io.on('connection', (socket) => {
    // Staff clients present their admin JWT to join the room that gets
    // full order details (name, phone, everything).
    socket.on('admin:auth', (token) => {
      try {
        jwt.verify(token, JWT_SECRET)
        socket.join('admin')
      } catch {
        /* bad/expired token — socket just won't receive admin events */
      }
    })

    // Customers join a room scoped to their own order number, so they
    // only ever receive status updates for that one order — never
    // anyone else's, and never the name/phone attached to it.
    socket.on('order:subscribe', (orderNumber) => {
      if (Number.isInteger(Number(orderNumber))) {
        socket.join(`order:${orderNumber}`)
      }
    })
  })

  return io
}

// Full order (name, phone, everything) — staff only.
export function emitNewOrder(order) {
  io?.to('admin').emit('order:new', order)
}

export function emitOrderStatusChanged(order) {
  io?.to('admin').emit('order:updated', order)
  // Customers watching their own order only get the status, not the
  // rest of the record.
  io?.to(`order:${order.id}`).emit('order:status', { id: order.id, status: order.status })
}

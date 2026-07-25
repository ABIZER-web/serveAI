import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

let socket = null

// Lazily creates one shared socket connection. Autoconnect is left on —
// socket.io handles reconnection automatically, and every caller here
// treats real-time updates as a nice-to-have on top of polling, never
// the only source of truth.
export function getSocket() {
  if (!socket) {
    socket = io(API_URL, { withCredentials: false })
  }
  return socket
}

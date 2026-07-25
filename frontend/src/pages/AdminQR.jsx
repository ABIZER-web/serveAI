import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Printer } from 'lucide-react'
import AdminNav from '../components/AdminNav'
import { useSEO } from '../hooks/useSEO'

export default function AdminQR() {
  useSEO({
    title: 'Table QR Generator | ServeAI',
    robots: 'noindex, nofollow',
    path: '/admin/qr-codes',
  })
  const [count, setCount] = useState(10)
  const [baseUrl, setBaseUrl] = useState(window.location.origin)
  const canvasRefs = useRef({})

  const tables = Array.from({ length: count }, (_, i) => i + 1)

  const downloadQR = (tableNo) => {
    const canvas = canvasRefs.current[tableNo]
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `serveai-table-${tableNo}.png`
    link.click()
  }

  return (
    <div className="min-h-screen px-5 py-8" style={{ background: 'var(--color-paper)' }}>
      <div className="max-w-3xl mx-auto">
        <AdminNav current="/admin/qr-codes" />

        <div className="flex items-center justify-between mb-1 print:hidden">
          <h1 className="font-display text-3xl">Table QR Generator</h1>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase px-4 py-2.5 rounded-full"
            style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
          >
            <Printer size={15} /> Print all
          </button>
        </div>
        <p className="text-sm opacity-70 mb-5 print:hidden">
          Every table gets its own unique QR code linking to <span className="font-mono">?table=N</span> —
          scan it and the menu opens already knowing which table placed the order.
        </p>

        <div className="flex gap-3 mb-8 flex-wrap print:hidden">
          <label className="flex items-center gap-2 text-sm">
            Number of tables
            <input
              type="number"
              min={1}
              max={200}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
              className="w-20 px-2 py-1.5 rounded-lg border-2"
              style={{ borderColor: 'var(--color-charcoal)' }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm flex-1 min-w-[220px]">
            Site URL
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg border-2 font-mono text-xs"
              style={{ borderColor: 'var(--color-charcoal)' }}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 print:grid-cols-2">
          {tables.map((t) => {
            const url = `${baseUrl}/?table=${t}`
            return (
              <div
                key={t}
                className="rounded-2xl p-4 flex flex-col items-center gap-2 break-inside-avoid"
                style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}
              >
                <p className="font-display text-lg" style={{ color: 'var(--color-chili)' }}>Table {t}</p>
                <QRCodeCanvas
                  value={url}
                  size={140}
                  fgColor="#1B1B1B"
                  bgColor="#FFFFFF"
                  ref={(el) => (canvasRefs.current[t] = el)}
                />
                <p className="font-mono text-[10px] opacity-50 break-all text-center">{url}</p>
                <button
                  onClick={() => downloadQR(t)}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-full print:hidden"
                  style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
                >
                  <Download size={13} /> Save
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

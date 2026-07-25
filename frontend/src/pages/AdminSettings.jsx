import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Download, Upload, AlertTriangle, Store } from 'lucide-react'
import AdminNav from '../components/AdminNav'
import { useSEO } from '../hooks/useSEO'
import { fetchSettings, updateSettings, downloadBackup, restoreBackup } from '../utils/api'

export default function AdminSettings() {
  useSEO({ title: 'Settings | ServeAI', robots: 'noindex, nofollow', path: '/admin/settings' })
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreSummary, setRestoreSummary] = useState(null)

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleAdminError = (err) => {
    if (err.message?.toLowerCase().includes('expired') || err.message?.toLowerCase().includes('login required')) {
      navigate('/admin/login')
      return
    }
    setError(err.message)
  }

  const saveSettings = async (patch) => {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const updated = await updateSettings(patch)
      setSettings(updated)
      setNotice('Saved.')
      setTimeout(() => setNotice(null), 2500)
    } catch (err) {
      handleAdminError(err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleClosed = () => saveSettings({ orderingPaused: !settings.orderingPaused })

  const handleSaveContact = (e) => {
    e.preventDefault()
    saveSettings({
      contactLocationLines: settings.contactLocationLines,
      contactPhone: settings.contactPhone,
    })
  }

  const updateLocationLine = (index, value) => {
    const next = [...settings.contactLocationLines]
    next[index] = value
    setSettings({ ...settings, contactLocationLines: next })
  }

  const handleBackup = async () => {
    setError(null)
    try {
      await downloadBackup()
    } catch (err) {
      handleAdminError(err)
    }
  }

  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setRestoreSummary(null)

    if (
      !window.confirm(
        'Restoring will add any categories/items/orders/settings from this file that are missing here. ' +
          'It will NOT delete or overwrite your current orders. Continue?'
      )
    ) {
      e.target.value = ''
      return
    }

    setRestoring(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const summary = await restoreBackup(data)
      setRestoreSummary(summary)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('That file is not valid JSON — is it a ServeAI backup file?')
      } else {
        handleAdminError(err)
      }
    } finally {
      setRestoring(false)
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen px-5 py-8" style={{ background: 'var(--color-paper)' }}>
      <div className="max-w-2xl mx-auto">
        <AdminNav current="/admin/settings" />

        <h1 className="font-display text-3xl mb-1">Settings</h1>
        <p className="text-sm opacity-70 mb-6">Store status, contact info, and backups.</p>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}>
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--color-basil)', color: 'white' }}>
            {notice}
          </div>
        )}

        {loading || !settings ? (
          <p className="font-mono text-sm opacity-60 py-10 text-center">Loading settings…</p>
        ) : (
          <div className="space-y-6">
            {/* Store status */}
            <section className="rounded-2xl p-5" style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}>
              <p className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
                <Store size={14} style={{ color: 'var(--color-chili)' }} /> Store Status
              </p>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">{settings.orderingPaused ? 'Closed to new orders' : 'Open for orders'}</p>
                  <p className="text-xs opacity-60">Toggle this off any time you need to pause the ordering menu.</p>
                </div>
                <button
                  onClick={handleToggleClosed}
                  disabled={saving}
                  className="shrink-0 w-14 h-8 rounded-full relative transition-colors disabled:opacity-60"
                  style={{ background: settings.orderingPaused ? 'var(--color-chili)' : 'var(--color-basil)' }}
                  aria-label="Toggle store open/closed"
                >
                  <span
                    className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
                    style={{ left: settings.orderingPaused ? '4px' : 'calc(100% - 28px)' }}
                  />
                </button>
              </div>

              {settings.orderingPaused && (
                <div>
                  <label className="text-xs font-mono uppercase tracking-wide opacity-60">Message shown to customers</label>
                  <textarea
                    value={settings.closedMessage}
                    onChange={(e) => setSettings({ ...settings, closedMessage: e.target.value })}
                    onBlur={() => saveSettings({ closedMessage: settings.closedMessage })}
                    rows={2}
                    className="w-full mt-1 px-3 py-2 rounded-lg border text-sm resize-none"
                  />
                </div>
              )}
            </section>

            {/* Find Us */}
            <form onSubmit={handleSaveContact} className="rounded-2xl p-5" style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}>
              <p className="font-mono text-xs font-bold uppercase tracking-wider opacity-70 mb-3">Find Us</p>

              <label className="text-xs font-mono uppercase tracking-wide opacity-60">Location (shown as separate lines)</label>
              <div className="space-y-1.5 mt-1 mb-3">
                {settings.contactLocationLines.map((line, i) => (
                  <input
                    key={i}
                    value={line}
                    onChange={(e) => updateLocationLine(i, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                  />
                ))}
              </div>

              <label className="text-xs font-mono uppercase tracking-wide opacity-60">Phone number</label>
              <input
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full mt-1 mb-3 px-3 py-2 rounded-lg border text-sm"
              />

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-4 py-2.5 rounded-full disabled:opacity-60"
                style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
              >
                <Save size={14} /> {saving ? 'Saving…' : 'Save contact info'}
              </button>
            </form>

            {/* Backup / restore */}
            <section className="rounded-2xl p-5" style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}>
              <p className="font-mono text-xs font-bold uppercase tracking-wider opacity-70 mb-3">Backup &amp; Restore</p>
              <p className="text-xs opacity-60 mb-3">
                Download a full copy of your menu, settings, and order history as a JSON file. Restoring
                adds anything from a backup file that's missing here — it never deletes or overwrites
                existing orders.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleBackup}
                  className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-4 py-2.5 rounded-full"
                  style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
                >
                  <Download size={14} /> Download backup
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={restoring}
                  className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-4 py-2.5 rounded-full disabled:opacity-60"
                  style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
                >
                  <Upload size={14} /> {restoring ? 'Restoring…' : 'Restore from file'}
                </button>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleRestoreFile} />
              </div>

              {restoreSummary && (
                <p className="text-xs mt-3 flex items-start gap-1.5" style={{ color: 'var(--color-basil)' }}>
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  Restored {restoreSummary.categories} categories, {restoreSummary.items} items, and{' '}
                  {restoreSummary.orders} orders that weren't already here.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

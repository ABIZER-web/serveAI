import { useState } from 'react'
import { X } from 'lucide-react'

export default function ItemOptionsModal({ item, onClose, onConfirm }) {
  // For each single-select group, default to its first choice (if the
  // group is required) so the price preview is accurate immediately.
  const [selections, setSelections] = useState(() => {
    const initial = {}
    item.optionGroups.forEach((group) => {
      if (!group.multiple) {
        initial[group.name] = group.required && group.choices[0] ? [group.choices[0].label] : []
      } else {
        initial[group.name] = []
      }
    })
    return initial
  })

  const toggleSingle = (groupName, label) => {
    setSelections((prev) => ({ ...prev, [groupName]: [label] }))
  }

  const toggleMultiple = (groupName, label) => {
    setSelections((prev) => {
      const current = prev[groupName] || []
      const next = current.includes(label) ? current.filter((l) => l !== label) : [...current, label]
      return { ...prev, [groupName]: next }
    })
  }

  const selectedOptions = item.optionGroups.flatMap((group) =>
    (selections[group.name] || []).map((label) => {
      const choice = group.choices.find((c) => c.label === label)
      return { groupName: group.name, label, priceDelta: choice?.priceDelta || 0 }
    })
  )

  const unitPrice = item.price + selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0)

  const missingRequired = item.optionGroups.some(
    (group) => !group.multiple && group.required && (selections[group.name] || []).length === 0
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-sm max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl px-5 py-5"
        style={{ background: 'var(--color-paper)' }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center text-3xl shrink-0"
              style={{ background: 'var(--color-paper-dim)', border: '2px solid var(--color-charcoal)' }}
            >
              {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : item.icon}
            </div>
            <div>
              <h2 className="font-display text-xl tracking-wide leading-tight">{item.name}</h2>
              <p className="font-mono text-xs opacity-60">From ₹{item.price}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {item.optionGroups.map((group) => (
            <div key={group.name}>
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider opacity-70 mb-2">
                {group.name}
                {group.required && <span style={{ color: 'var(--color-chili)' }}> *</span>}
              </p>
              <div className="space-y-2">
                {group.choices.map((choice) => {
                  const checked = (selections[group.name] || []).includes(choice.label)
                  return (
                    <button
                      key={choice.label}
                      type="button"
                      onClick={() =>
                        group.multiple
                          ? toggleMultiple(group.name, choice.label)
                          : toggleSingle(group.name, choice.label)
                      }
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2"
                      style={{
                        borderColor: checked ? 'var(--color-chili)' : 'rgba(36,28,20,0.15)',
                        background: checked ? 'rgba(225,67,43,0.06)' : 'white',
                      }}
                    >
                      <span className="text-sm font-medium">{choice.label}</span>
                      <span className="font-mono text-xs font-bold opacity-70">
                        {choice.priceDelta > 0 ? `+₹${choice.priceDelta}` : choice.priceDelta < 0 ? `-₹${Math.abs(choice.priceDelta)}` : '—'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          disabled={missingRequired}
          onClick={() => onConfirm(selectedOptions)}
          className="w-full mt-6 py-3.5 rounded-xl font-display text-lg tracking-wide disabled:opacity-50"
          style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
        >
          Add for ₹{unitPrice}
        </button>
      </div>
    </div>
  )
}

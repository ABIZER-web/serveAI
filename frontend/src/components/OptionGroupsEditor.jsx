import { Plus, Trash2 } from 'lucide-react'

const EMPTY_GROUP = { name: '', multiple: false, required: false, choices: [{ label: '', priceDelta: 0 }] }

export default function OptionGroupsEditor({ optionGroups, onChange }) {
  const groups = optionGroups || []

  const updateGroup = (index, patch) => {
    onChange(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)))
  }

  const updateChoice = (groupIndex, choiceIndex, patch) => {
    const group = groups[groupIndex]
    const choices = group.choices.map((c, i) => (i === choiceIndex ? { ...c, ...patch } : c))
    updateGroup(groupIndex, { choices })
  }

  const addGroup = () => onChange([...groups, { ...EMPTY_GROUP, choices: [{ label: '', priceDelta: 0 }] }])
  const removeGroup = (index) => onChange(groups.filter((_, i) => i !== index))
  const addChoice = (groupIndex) => {
    const group = groups[groupIndex]
    updateGroup(groupIndex, { choices: [...group.choices, { label: '', priceDelta: 0 }] })
  }
  const removeChoice = (groupIndex, choiceIndex) => {
    const group = groups[groupIndex]
    updateGroup(groupIndex, { choices: group.choices.filter((_, i) => i !== choiceIndex) })
  }

  return (
    <div className="space-y-3">
      {groups.length > 0 && (
        <p className="font-mono text-[10px] uppercase tracking-wide opacity-50">Sizes &amp; add-ons (optional)</p>
      )}
      {groups.map((group, gi) => (
        <div key={gi} className="rounded-lg p-2.5 space-y-2" style={{ background: 'var(--color-paper-dim)', border: '1px dashed rgba(36,28,20,0.25)' }}>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 px-2 py-1.5 rounded-lg border text-xs"
              placeholder='Group name (e.g. "Size" or "Add-ons")'
              value={group.name}
              onChange={(e) => updateGroup(gi, { name: e.target.value })}
            />
            <label className="flex items-center gap-1 text-[10px] font-mono uppercase whitespace-nowrap">
              <input type="checkbox" checked={group.multiple} onChange={(e) => updateGroup(gi, { multiple: e.target.checked })} />
              Multi-pick
            </label>
            {!group.multiple && (
              <label className="flex items-center gap-1 text-[10px] font-mono uppercase whitespace-nowrap">
                <input type="checkbox" checked={group.required} onChange={(e) => updateGroup(gi, { required: e.target.checked })} />
                Required
              </label>
            )}
            <button type="button" onClick={() => removeGroup(gi)} className="opacity-50 hover:opacity-100 shrink-0">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="space-y-1.5 pl-2">
            {group.choices.map((choice, ci) => (
              <div key={ci} className="flex items-center gap-1.5">
                <input
                  className="flex-1 px-2 py-1 rounded-lg border text-xs"
                  placeholder="Choice (e.g. Large)"
                  value={choice.label}
                  onChange={(e) => updateChoice(gi, ci, { label: e.target.value })}
                />
                <input
                  type="number"
                  className="w-20 px-2 py-1 rounded-lg border text-xs font-mono"
                  placeholder="+/-₹"
                  value={choice.priceDelta}
                  onChange={(e) => updateChoice(gi, ci, { priceDelta: Number(e.target.value) || 0 })}
                />
                <button type="button" onClick={() => removeChoice(gi, ci)} className="opacity-40 hover:opacity-100 shrink-0">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addChoice(gi)}
              className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase opacity-60 hover:opacity-100"
            >
              <Plus size={11} /> Add choice
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addGroup}
        className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-full"
        style={{ background: 'var(--color-paper-dim)', color: 'var(--color-ink)' }}
      >
        <Plus size={12} /> Add option group
      </button>
    </div>
  )
}

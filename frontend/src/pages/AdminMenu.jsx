import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Trash2, Pencil, X, Check, ImagePlus, Sparkles, GripVertical } from 'lucide-react'
import AdminNav from '../components/AdminNav'
import OptionGroupsEditor from '../components/OptionGroupsEditor'
import { useMenu } from '../context/MenuContext'
import { useSEO } from '../hooks/useSEO'
import {
  createItem,
  updateItem,
  deleteItem,
  createCategory,
  deleteCategory,
  reorderCategories,
  reorderItems,
  generateDescription,
} from '../utils/api'
import { fileToCompressedDataUrl } from '../utils/imageUpload'

const EMPTY_ITEM = { name: '', price: '', desc: '', tag: '', icon: '🍽️', image: null, optionGroups: [] }

// Drops any group/choice the admin left blank, so a half-filled row in
// the editor doesn't get saved as real menu data.
function cleanOptionGroups(optionGroups) {
  return (optionGroups || [])
    .filter((g) => g.name.trim())
    .map((g) => ({ ...g, choices: g.choices.filter((c) => c.label.trim()) }))
    .filter((g) => g.choices.length > 0)
}

// Wraps a row (category header or item row) to make it draggable via
// @dnd-kit — the grip handle is the only draggable surface, so clicking
// inputs/buttons inside the row still works normally.
function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1">
      <button {...attributes} {...listeners} type="button" className="cursor-grab pt-3 opacity-30 hover:opacity-70 shrink-0 touch-none">
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

export default function AdminMenu() {
  useSEO({ title: 'Menu manager | ServeAI', robots: 'noindex, nofollow', path: '/admin/menu' })

  const { categories, refetch } = useMenu()
  const navigate = useNavigate()

  const [newItemForm, setNewItemForm] = useState(null) // categoryId currently adding to
  const [itemDraft, setItemDraft] = useState(EMPTY_ITEM)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(EMPTY_ITEM)
  const [newCategory, setNewCategory] = useState({ id: '', label: '' })
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [generatingId, setGeneratingId] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleItemDragEnd = async (categoryId, event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const cat = categories.find((c) => c.id === categoryId)
    const oldIndex = cat.items.findIndex((i) => i.id === active.id)
    const newIndex = cat.items.findIndex((i) => i.id === over.id)
    const newOrder = arrayMove(cat.items, oldIndex, newIndex).map((i) => i.id)
    try {
      await reorderItems(categoryId, newOrder)
      refetch()
    } catch (err) {
      handleAdminError(err)
    }
  }

  const handleCategoryDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)
    const newOrder = arrayMove(categories, oldIndex, newIndex).map((c) => c.id)
    try {
      await reorderCategories(newOrder)
      refetch()
    } catch (err) {
      handleAdminError(err)
    }
  }

  const handleAdminError = (err) => {
    if (err.message?.toLowerCase().includes('expired') || err.message?.toLowerCase().includes('login required')) {
      navigate('/admin/login')
      return
    }
    setError(err.message)
  }

  const handleImagePick = async (e, setDraft) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setError(null)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setDraft((prev) => ({ ...prev, image: dataUrl }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleGenerateDescription = async (name, categoryLabel, setDraft, key) => {
    if (!name?.trim()) {
      setError('Enter a name first so AI knows what to describe.')
      return
    }
    setGeneratingId(key)
    setError(null)
    try {
      const { description } = await generateDescription({ name: name.trim(), category: categoryLabel })
      setDraft((prev) => ({ ...prev, desc: description }))
    } catch (err) {
      handleAdminError(err)
    } finally {
      setGeneratingId(null)
    }
  }

  const startAdd = (categoryId) => {
    setNewItemForm(categoryId)
    setItemDraft(EMPTY_ITEM)
    setError(null)
  }

  const submitAdd = async (categoryId) => {
    if (!itemDraft.name.trim() || !itemDraft.price) {
      setError('Name and price are required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await createItem({
        categoryId,
        name: itemDraft.name.trim(),
        price: Number(itemDraft.price),
        desc: itemDraft.desc.trim(),
        tag: itemDraft.tag.trim() || null,
        icon: itemDraft.icon.trim() || '🍽️',
        image: itemDraft.image || null,
        optionGroups: cleanOptionGroups(itemDraft.optionGroups),
      })
      setNewItemForm(null)
      refetch()
    } catch (err) {
      handleAdminError(err)
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditDraft({
      name: item.name,
      price: item.price,
      desc: item.desc || '',
      tag: item.tag || '',
      icon: item.icon,
      image: item.image || null,
      optionGroups: item.optionGroups || [],
    })
    setError(null)
  }

  const submitEdit = async (id) => {
    if (!editDraft.name.trim() || !editDraft.price) {
      setError('Name and price are required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updateItem(id, {
        name: editDraft.name.trim(),
        price: Number(editDraft.price),
        desc: editDraft.desc.trim(),
        tag: editDraft.tag.trim() || null,
        icon: editDraft.icon.trim() || '🍽️',
        image: editDraft.image || null,
        optionGroups: cleanOptionGroups(editDraft.optionGroups),
      })
      setEditingId(null)
      refetch()
    } catch (err) {
      handleAdminError(err)
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Remove this item from the menu?')) return
    setBusy(true)
    try {
      await deleteItem(id)
      refetch()
    } catch (err) {
      handleAdminError(err)
    } finally {
      setBusy(false)
    }
  }

  const handleToggleAvailability = async (item) => {
    const newAvailable = item.available === false
    try {
      await updateItem(item.id, { available: newAvailable })
      refetch()
    } catch (err) {
      handleAdminError(err)
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.id.trim() || !newCategory.label.trim()) {
      setError('Category needs both an id and a label.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await createCategory({ id: newCategory.id.trim().toLowerCase(), label: newCategory.label.trim() })
      setNewCategory({ id: '', label: '' })
      setShowNewCategory(false)
      refetch()
    } catch (err) {
      handleAdminError(err)
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? It must be empty first.')) return
    setBusy(true)
    try {
      await deleteCategory(id)
      refetch()
    } catch (err) {
      handleAdminError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen px-5 py-8" style={{ background: 'var(--color-paper)' }}>
      <div className="max-w-2xl mx-auto">
        <AdminNav current="/admin/menu" />

        <h1 className="font-display text-3xl mb-1">Menu Manager</h1>
        <p className="text-sm opacity-70 mb-6">
          Add, edit, or remove items — changes show up instantly on the ordering menu and the booklet.
        </p>

        {error && (
          <div
            className="mb-4 px-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--color-chili)', color: 'var(--color-paper)' }}
          >
            {error}
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {categories.map((cat) => (
              <SortableRow key={cat.id} id={cat.id}>
                <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: 'white', border: '2px solid var(--color-charcoal)' }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--color-charcoal)' }}>
                    <h2 className="font-display text-lg tracking-wide" style={{ color: 'var(--color-mustard)' }}>
                      {cat.label}
                    </h2>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="opacity-60 hover:opacity-100"
                      style={{ color: 'var(--color-paper)' }}
                      title="Delete category (must be empty)"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="divide-y divide-charcoal/10 px-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleItemDragEnd(cat.id, e)}>
                      <SortableContext items={cat.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        {cat.items.map((item) => (
                          <SortableRow key={item.id} id={item.id}>
                            {editingId === item.id ? (
                  <div key={item.id} className="py-3 space-y-2">
                    <div className="flex gap-2 items-center">
                      <label className="shrink-0 w-14 h-14 rounded-lg border-2 border-dashed flex items-center justify-center text-2xl cursor-pointer overflow-hidden" style={{ borderColor: 'var(--color-charcoal)' }}>
                        {editDraft.image ? (
                          <img src={editDraft.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImagePlus size={18} className="opacity-50" />
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImagePick(e, setEditDraft)} />
                      </label>
                      <input
                        className="w-14 px-2 py-1.5 rounded-lg border text-center text-lg"
                        value={editDraft.icon}
                        onChange={(e) => setEditDraft({ ...editDraft, icon: e.target.value })}
                        title="Emoji fallback (shown if no photo)"
                      />
                      <input
                        className="flex-1 px-2.5 py-1.5 rounded-lg border text-sm"
                        placeholder="Name"
                        value={editDraft.name}
                        onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                      />
                      <input
                        type="number"
                        className="w-24 px-2.5 py-1.5 rounded-lg border text-sm font-mono"
                        placeholder="Price"
                        value={editDraft.price}
                        onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <textarea
                        className="w-full px-2.5 py-1.5 rounded-lg border text-sm"
                        placeholder="Description"
                        value={editDraft.desc}
                        onChange={(e) => setEditDraft({ ...editDraft, desc: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => handleGenerateDescription(editDraft.name, cat.label, setEditDraft, item.id)}
                        disabled={generatingId === item.id}
                        className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-2 py-1 rounded-full disabled:opacity-60"
                        style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
                      >
                        <Sparkles size={11} /> {generatingId === item.id ? 'Writing…' : 'Generate with AI'}
                      </button>
                    </div>
                    <OptionGroupsEditor
                      optionGroups={editDraft.optionGroups}
                      onChange={(optionGroups) => setEditDraft({ ...editDraft, optionGroups })}
                    />
                    <div className="flex gap-2 items-center">
                      <input
                        className="flex-1 px-2.5 py-1.5 rounded-lg border text-sm"
                        placeholder="Tag (optional, e.g. Bestseller)"
                        value={editDraft.tag}
                        onChange={(e) => setEditDraft({ ...editDraft, tag: e.target.value })}
                      />
                      <button
                        disabled={busy}
                        onClick={() => submitEdit(item.id)}
                        className="p-2 rounded-lg"
                        style={{ background: 'var(--color-basil)', color: 'white' }}
                      >
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-2 rounded-lg" style={{ background: 'var(--color-paper-dim)' }}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} className="flex items-center gap-3 py-3" style={{ opacity: item.available === false ? 0.55 : 1 }}>
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 text-2xl flex items-center justify-center">
                      {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {item.name}
                        {item.available === false && (
                          <span className="ml-2 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-chili)', color: 'white' }}>
                            Sold Out
                          </span>
                        )}
                      </p>
                      <p className="text-xs opacity-60 truncate">{item.desc}</p>
                    </div>
                    <span className="font-mono text-xs font-bold shrink-0" style={{ color: 'var(--color-chili)' }}>
                      ₹{item.price}
                    </span>
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className="shrink-0 font-mono text-[9px] font-bold uppercase px-2 py-1 rounded-full"
                      style={{
                        background: item.available === false ? 'var(--color-basil)' : 'var(--color-paper-dim)',
                        color: item.available === false ? 'white' : 'var(--color-ink)',
                      }}
                      title={item.available === false ? 'Mark back in stock' : 'Mark sold out'}
                    >
                      {item.available === false ? 'Restock' : 'Sold out'}
                    </button>
                    <button onClick={() => startEdit(item)} className="opacity-50 hover:opacity-100 shrink-0">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} className="opacity-50 hover:opacity-100 shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
                          </SortableRow>
                        ))}
                      </SortableContext>
                    </DndContext>
            </div>

            <div className="px-4 pb-4">
              {newItemForm === cat.id ? (
                <div className="space-y-2 pt-3 border-t border-dashed border-charcoal/20">
                  <div className="flex gap-2 items-center">
                    <label className="shrink-0 w-14 h-14 rounded-lg border-2 border-dashed flex items-center justify-center text-2xl cursor-pointer overflow-hidden" style={{ borderColor: 'var(--color-charcoal)' }}>
                      {itemDraft.image ? (
                        <img src={itemDraft.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImagePlus size={18} className="opacity-50" />
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImagePick(e, setItemDraft)} />
                    </label>
                    <input
                      className="w-14 px-2 py-1.5 rounded-lg border text-center text-lg"
                      placeholder="🍔"
                      value={itemDraft.icon}
                      onChange={(e) => setItemDraft({ ...itemDraft, icon: e.target.value })}
                      title="Emoji fallback (shown if no photo)"
                    />
                    <input
                      className="flex-1 px-2.5 py-1.5 rounded-lg border text-sm"
                      placeholder="Item name"
                      value={itemDraft.name}
                      onChange={(e) => setItemDraft({ ...itemDraft, name: e.target.value })}
                    />
                    <input
                      type="number"
                      className="w-24 px-2.5 py-1.5 rounded-lg border text-sm font-mono"
                      placeholder="Price"
                      value={itemDraft.price}
                      onChange={(e) => setItemDraft({ ...itemDraft, price: e.target.value })}
                    />
                  </div>
                  {uploadingImage && <p className="text-xs opacity-60 font-mono">Compressing image…</p>}
                  <div className="space-y-1">
                    <textarea
                      className="w-full px-2.5 py-1.5 rounded-lg border text-sm"
                      placeholder="Short description"
                      value={itemDraft.desc}
                      onChange={(e) => setItemDraft({ ...itemDraft, desc: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => handleGenerateDescription(itemDraft.name, cat.label, setItemDraft, 'new')}
                      disabled={generatingId === 'new'}
                      className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-2 py-1 rounded-full disabled:opacity-60"
                      style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
                    >
                      <Sparkles size={11} /> {generatingId === 'new' ? 'Writing…' : 'Generate with AI'}
                    </button>
                  </div>
                  <OptionGroupsEditor
                    optionGroups={itemDraft.optionGroups}
                    onChange={(optionGroups) => setItemDraft({ ...itemDraft, optionGroups })}
                  />
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-2.5 py-1.5 rounded-lg border text-sm"
                      placeholder="Tag (optional, e.g. Bestseller)"
                      value={itemDraft.tag}
                      onChange={(e) => setItemDraft({ ...itemDraft, tag: e.target.value })}
                    />
                    <button
                      disabled={busy}
                      onClick={() => submitAdd(cat.id)}
                      className="px-4 rounded-lg font-mono text-xs font-bold uppercase"
                      style={{ background: 'var(--color-chili)', color: 'white' }}
                    >
                      Save
                    </button>
                    <button onClick={() => setNewItemForm(null)} className="px-3 rounded-lg" style={{ background: 'var(--color-paper-dim)' }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startAdd(cat.id)}
                  className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider mt-3 opacity-70 hover:opacity-100"
                >
                  <Plus size={14} /> Add item to {cat.label}
                </button>
              )}
            </div>
                </div>
              </SortableRow>
            ))}
          </SortableContext>
        </DndContext>

        {showNewCategory ? (
          <form onSubmit={handleAddCategory} className="rounded-2xl p-4 space-y-2" style={{ background: 'white', border: '2px dashed var(--color-charcoal)' }}>
            <div className="flex gap-2">
              <input
                className="w-32 px-2.5 py-2 rounded-lg border text-sm font-mono"
                placeholder="id (e.g. tacos)"
                value={newCategory.id}
                onChange={(e) => setNewCategory({ ...newCategory, id: e.target.value })}
              />
              <input
                className="flex-1 px-2.5 py-2 rounded-lg border text-sm"
                placeholder="Display name (e.g. Truck Tacos)"
                value={newCategory.label}
                onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button disabled={busy} type="submit" className="px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase" style={{ background: 'var(--color-chili)', color: 'white' }}>
                Add category
              </button>
              <button type="button" onClick={() => setShowNewCategory(false)} className="px-3 py-2 rounded-lg" style={{ background: 'var(--color-paper-dim)' }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewCategory(true)}
            className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider px-5 py-3 rounded-full mx-auto"
            style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
          >
            <Plus size={16} /> New category
          </button>
        )}
      </div>
    </div>
  )
}

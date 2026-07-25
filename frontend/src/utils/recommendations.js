// Which category an item's category pairs well with — a simple, fast,
// predictable lookup that still reads as a "smart recommendation" to the
// customer, with no external AI call needed. Falls back gracefully for
// any category an admin adds that isn't in this table.
const CATEGORY_PAIRINGS = {
  combos: ['sweet'],
  burgers: ['sides', 'drinks'],
  sides: ['drinks'],
  drinks: ['sweet'],
  sweet: ['drinks'],
}

// Suggests items that complement what's already in the cart — e.g. a
// burger in the cart nudges fries and a drink, a drink nudges dessert.
// Falls back to bestsellers so there's always something to show.
export function getRecommendations(cartItems, allItems, categoryOfItem, limit = 3) {
  const inCartIds = new Set(cartItems.map((i) => i.id))
  const cartCategories = new Set(cartItems.map((i) => categoryOfItem[i.id]).filter(Boolean))
  const inStockItems = allItems.filter((item) => item.available !== false)

  const wantedCategories = new Set()
  cartCategories.forEach((cat) => {
    ;(CATEGORY_PAIRINGS[cat] || []).forEach((paired) => {
      if (!cartCategories.has(paired)) wantedCategories.add(paired)
    })
  })

  const fromPairings = inStockItems.filter(
    (item) => wantedCategories.has(categoryOfItem[item.id]) && !inCartIds.has(item.id)
  )

  const picks = []
  const seen = new Set()
  for (const item of fromPairings) {
    if (picks.length >= limit) break
    if (seen.has(item.id)) continue
    picks.push(item)
    seen.add(item.id)
  }

  if (picks.length < limit) {
    const bestsellers = inStockItems.filter(
      (item) => item.tag === 'Bestseller' && !inCartIds.has(item.id) && !seen.has(item.id)
    )
    for (const item of bestsellers) {
      if (picks.length >= limit) break
      picks.push(item)
      seen.add(item.id)
    }
  }

  return picks.slice(0, limit)
}

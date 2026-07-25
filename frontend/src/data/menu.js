// OFFLINE FALLBACK menu for ServeAI. The real, editable menu lives in the
// database and is managed from /admin/menu — this file only kicks in if
// the backend can't be reached (see src/context/MenuContext.jsx).
// icon: emoji used as a lightweight stand-in for a product photo (keeps the
// package dependency-free — swap for real photos by editing `image` per item).

export const CATEGORIES = [
  { id: 'combos', label: 'Truck Combos' },
  { id: 'burgers', label: 'Burgers & Wraps' },
  { id: 'sides', label: 'Fries & Sides' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'sweet', label: 'Sweet Treats' },
]

export const MENU = {
  combos: [
    {
      id: 'combo-smash',
      name: 'Smash Combo',
      price: 249,
      tag: 'Bestseller',
      desc: 'Smash burger, loaded fries and a regular soda — the whole truck experience.',
      icon: '🍔',
    },
    {
      id: 'combo-wrap',
      name: 'Grill Wrap Combo',
      price: 219,
      tag: 'Chef pick',
      desc: 'Grilled paneer or chicken wrap with peri fries and a cold drink.',
      icon: '🌯',
    },
  ],
  burgers: [
    {
      id: 'burger-classic',
      name: 'Classic Smash Burger',
      price: 149,
      tag: null,
      desc: 'Double smashed patty, cheddar melt, house sauce, toasted bun.',
      icon: '🍔',
    },
    {
      id: 'burger-spicy',
      name: 'Firestorm Burger',
      price: 169,
      tag: 'Spicy',
      desc: 'Crispy fried patty, chipotle mayo, pickled jalapeños.',
      icon: '🌶️',
    },
    {
      id: 'wrap-paneer',
      name: 'Tandoori Paneer Wrap',
      price: 159,
      tag: 'Veg',
      desc: 'Char-grilled paneer, mint chutney, crunchy slaw, rumali roll.',
      icon: '🌯',
    },
    {
      id: 'wrap-chicken',
      name: 'Peri Chicken Wrap',
      price: 179,
      tag: null,
      desc: 'Peri-peri grilled chicken, garlic mayo, fresh veg.',
      icon: '🌯',
    },
  ],
  sides: [
    {
      id: 'side-fries',
      name: 'Truck Fries',
      price: 99,
      tag: null,
      desc: 'Crisp-cut fries tossed in ServeAI seasoning.',
      icon: '🍟',
    },
    {
      id: 'side-loaded',
      name: 'Loaded Cheese Fries',
      price: 149,
      tag: 'Bestseller',
      desc: 'Fries buried under molten cheese, jalapeños and chipotle drizzle.',
      icon: '🧀',
    },
    {
      id: 'side-nuggets',
      name: 'Crunch Nuggets (6pc)',
      price: 129,
      tag: null,
      desc: 'Golden fried nuggets with a smoky dip.',
      icon: '🍗',
    },
  ],
  drinks: [
    {
      id: 'drink-cola',
      name: 'Classic Cola Float',
      price: 89,
      tag: null,
      desc: 'Chilled cola topped with a scoop of vanilla foam.',
      icon: '🥤',
    },
    {
      id: 'drink-lemon',
      name: 'Truck Stop Lemonade',
      price: 99,
      tag: null,
      desc: 'Fresh lemon, mint and a fizzy kick.',
      icon: '🍋',
    },
    {
      id: 'drink-mango',
      name: 'Mango Chiller',
      price: 109,
      tag: 'Seasonal',
      desc: 'Ripe mango blended with ice and a citrus twist.',
      icon: '🥭',
    },
  ],
  sweet: [
    {
      id: 'sweet-brownie',
      name: 'Molten Choco Brownie',
      price: 129,
      tag: 'Bestseller',
      desc: 'Warm brownie, melted center, cocoa dust.',
      icon: '🍫',
    },
    {
      id: 'sweet-donut',
      name: 'Glazed Ring Donut',
      price: 79,
      tag: null,
      desc: 'Classic glazed donut, fresh off the fryer.',
      icon: '🍩',
    },
  ],
}

// This file is only the OFFLINE FALLBACK menu — the real menu lives in the
// database and is managed from /admin/menu. If the backend is unreachable,
// MenuProvider (src/context/MenuContext.jsx) falls back to this data so the
// site still works. Edit it if you want the fallback to match your live menu.
export const ALL_ITEMS = Object.values(MENU).flat()

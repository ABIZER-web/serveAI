// Builds a schema.org FoodEstablishment record from the live settings
// (Find Us info, editable in /admin/settings) and the live menu from the
// backend — one source of truth, so editing either one updates both the
// visible page and the structured data search engines read.
export function getRestaurantSchema(categories, settings) {
  const [line1, line2, line3, line4] = settings.contactLocationLines

  return {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: 'ServeAI',
    servesCuisine: 'Fast Food',
    priceRange: '₹₹',
    telephone: settings.contactPhone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [line1, line2, line3].filter(Boolean).join(', '),
      addressLocality: line4 || undefined,
      addressCountry: 'IN',
    },
    hasMenu: {
      '@type': 'Menu',
      hasMenuSection: categories.map((cat) => ({
        '@type': 'MenuSection',
        name: cat.label,
        hasMenuItem: cat.items.map((item) => ({
          '@type': 'MenuItem',
          name: item.name,
          description: item.desc,
          offers: {
            '@type': 'Offer',
            price: item.price,
            priceCurrency: 'INR',
          },
        })),
      })),
    },
  }
}

export function injectRestaurantSchema(categories, settings) {
  const existing = document.getElementById('restaurant-schema')
  if (existing) existing.remove()

  const script = document.createElement('script')
  script.id = 'restaurant-schema'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(getRestaurantSchema(categories, settings))
  document.head.appendChild(script)
}

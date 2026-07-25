// Calls Google's Gemini API to generate a short, appetizing menu item
// description. Model name is configurable via GEMINI_MODEL since Google
// periodically renames/retires model versions — if generateDescription
// starts failing with a 404, this is the first thing to check against
// https://ai.google.dev/gemini-api/docs/models
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

export async function generateItemDescription({ name, category }) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in .env — AI descriptions are turned off until it is.')
  }

  const prompt =
    `Write one short, appetizing menu description for a food-truck item called "${name}"` +
    (category ? ` in the "${category}" category` : '') +
    `. Under 20 words, no quotation marks, no emoji, no pricing, just the description text itself.`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 60, temperature: 0.8 },
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Gemini request failed (${res.status}). ${detail.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('Gemini returned an empty response.')
  }

  return text.trim().replace(/^["']|["']$/g, '')
}

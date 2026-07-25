import { useEffect } from 'react'

function setMeta(name, content) {
  if (!content) return
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(path) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', `${window.location.origin}${path}`)
}

/**
 * Sets the document title, meta description, robots directive, and
 * canonical URL for the current page. Public pages (the menu) get
 * "index, follow"; private/per-order or staff-only pages should pass
 * "noindex, nofollow" so search engines don't try to index someone's
 * order or the admin QR generator.
 */
export function useSEO({ title, description, robots = 'index, follow', path = '/' }) {
  useEffect(() => {
    if (title) document.title = title
    setMeta('description', description)
    setMeta('robots', robots)
    setCanonical(path)
  }, [title, description, robots, path])
}

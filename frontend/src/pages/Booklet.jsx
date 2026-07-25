import { useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import BookletPage from '../components/BookletPage'
import { useMenu } from '../context/MenuContext'
import { useSEO } from '../hooks/useSEO'

export default function Booklet() {
  useSEO({
    title: 'Menu Booklet | ServeAI',
    description: 'Flip through the ServeAI menu like a real booklet.',
    robots: 'noindex, nofollow',
    path: '/booklet',
  })

  const { categories, loading } = useMenu()
  const bookRef = useRef(null)
  const [pageIndex, setPageIndex] = useState(0)

  const totalPages = categories.length + 2 // cover + categories + back cover

  const flipNext = () => bookRef.current?.pageFlip()?.flipNext()
  const flipPrev = () => bookRef.current?.pageFlip()?.flipPrev()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-5" style={{ background: 'var(--color-charcoal)' }}>
      <Link
        to="/"
        className="self-start flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-3 py-2 rounded-full"
        style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
      >
        <ArrowLeft size={14} /> Back to ordering
      </Link>

      {loading || categories.length === 0 ? (
        <p className="font-mono text-sm opacity-60" style={{ color: 'var(--color-paper)' }}>
          Loading the booklet…
        </p>
      ) : (
        <>
          <div className="booklet-shell">
            <HTMLFlipBook
              ref={bookRef}
              width={320}
              height={480}
              size="stretch"
              minWidth={280}
              maxWidth={420}
              minHeight={420}
              maxHeight={620}
              maxShadowOpacity={0.4}
              showCover={false}
              mobileScrollSupport
              usePortrait
              className="booklet-flipbook"
              onFlip={(e) => setPageIndex(e.data)}
            >
              <BookletPage variant="cover" />
              {categories.map((cat) => (
                <BookletPage key={cat.id} variant="category" category={cat} />
              ))}
              <BookletPage variant="back" />
            </HTMLFlipBook>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={flipPrev}
              disabled={pageIndex === 0}
              className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30"
              style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            <p className="font-mono text-xs" style={{ color: 'var(--color-paper)' }}>
              {pageIndex + 1} / {totalPages}
            </p>
            <button
              onClick={flipNext}
              disabled={pageIndex >= totalPages - 1}
              className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30"
              style={{ background: 'var(--color-mustard)', color: 'var(--color-ink)' }}
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <p className="font-mono text-[10px] opacity-40 text-center max-w-xs" style={{ color: 'var(--color-paper)' }}>
            Drag a page corner (or use the arrows) to flip through the menu.
          </p>
        </>
      )}
    </div>
  )
}

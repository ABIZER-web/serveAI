import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo'
import Footer from '../components/Footer'
import { useSettings } from '../context/SettingsContext'
import { useSEO } from '../hooks/useSEO'

export default function Terms() {
  useSEO({
    title: 'Terms & Conditions | ServeAI',
    description: 'Terms and conditions for ordering through ServeAI.',
    robots: 'index, follow',
    path: '/terms',
  })
  const { settings } = useSettings()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-paper)' }}>
      <header className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(36,28,20,0.12)' }}>
        <Logo size={40} />
        <Link
          to="/"
          className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase px-3 py-2 rounded-full"
          style={{ background: 'var(--color-charcoal)', color: 'var(--color-mustard)' }}
        >
          <ArrowLeft size={14} /> Menu
        </Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-5 py-8 w-full">
        <h1 className="font-display text-3xl tracking-wide mb-1" style={{ color: 'var(--color-chili)' }}>
          Terms &amp; Conditions
        </h1>
        <p className="text-xs opacity-60 mb-6 font-mono">Last updated: 2026</p>

        <div className="space-y-5 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg mb-1.5">1. Acceptance of terms</h2>
            <p className="opacity-80">
              By scanning our QR code, browsing this menu, or placing an order through ServeAI, you
              agree to these terms and conditions. If you don't agree with any part of them, please
              don't place an order through this platform.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1.5">2. Orders &amp; pricing</h2>
            <p className="opacity-80">
              All menu items, descriptions, and prices are subject to change without notice.
              Availability isn't guaranteed — an item can sell out between when you view the menu and
              when your order is confirmed. Placing an order is an offer to buy at the price shown at
              checkout; we confirm that offer once your order is sent to the kitchen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1.5">3. Payment</h2>
            <p className="opacity-80">
              We accept payment at the counter (cash or UPI) and, where available, online payment at
              checkout. Online payments are processed by a third-party payment provider; we don't
              store your card or full payment details ourselves.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1.5">4. Cancellations &amp; refunds</h2>
            <p className="opacity-80">
              Once an order has been sent to the kitchen, we may not be able to cancel or modify it.
              If there's an issue with your order, please speak to our staff at the counter as soon as
              possible so we can make it right.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1.5">5. Allergens &amp; dietary information</h2>
            <p className="opacity-80">
              Please inform our staff of any allergies or dietary requirements before placing your
              order. While we take reasonable care, our kitchen handles a variety of ingredients and
              we can't guarantee any dish is completely free of a particular allergen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1.5">6. Your information</h2>
            <p className="opacity-80">
              We collect your name and phone number to identify your order and contact you if
              needed. We don't sell this information to third parties. See how your order data is
              used in the ordering flow itself — it's used only to fulfill and look up your order.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1.5">7. Ownership &amp; intellectual property</h2>
            <p className="opacity-80">
              This ordering platform — its design, code, and branding — is the property of Abizer
              Saify and is provided for use by this business only. Copying, reproducing, or
              redistributing the platform itself without permission is not allowed. Menu content
              (item names, descriptions, and photos) belongs to the restaurant operating this
              platform.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1.5">8. Changes to these terms</h2>
            <p className="opacity-80">
              We may update these terms from time to time. Continuing to place orders through
              ServeAI after a change means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-1.5">9. Contact</h2>
            <p className="opacity-80">
              Questions about these terms? Reach us at{' '}
              <a href={`tel:${settings.contactPhone.replace(/\s/g, '')}`} className="underline" style={{ color: 'var(--color-chili)' }}>
                {settings.contactPhone}
              </a>{' '}
              or find us at {settings.contactLocationLines.join(', ')}.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

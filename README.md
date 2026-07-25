# ServeAI 🍔

Scan-to-order platform for a modern fast-food / food-truck setup — a React +
Vite + Tailwind frontend backed by an Express + MongoDB API, with a Google
Gemini integration for AI-assisted menu descriptions.

Customers scan a QR code at their table, browse the menu (or flip through
it like a real booklet), build a "ticket" (cart), and place the order with
their name and phone number. They get a **real, sequential order number**,
a live status they can watch update, and a QR code staff can scan to see
exactly who ordered what. The admin — you — manages the menu (including
photos and AI-written descriptions), watches sales on a dashboard, runs
the kitchen from a live orders view, and configures the store from a
settings page — all logged in on your own device.

## ⚠️ Before you run this: MongoDB and Gemini need real credentials

This version moved from a local SQLite file to **MongoDB**, and added an
**optional** Google Gemini integration. Both are configured in
`backend/.env`, which already exists with placeholder/example values —
but you need to fill in the real ones before the backend will actually
work. See "Setting up MongoDB" and "Setting up Gemini (optional)" below.

**Important:** I was not able to test a live MongoDB connection while
building this — the sandbox this was built in has no path to a real
database server. The code is careful and has been checked for syntax
errors, but you should be the one running the *first* real connection
test, ideally locally before you deploy anywhere. If anything errors when
you connect a real database, bring the exact error message back and I'll
help debug it.

## Project layout

```
serveai/
├── frontend/     the React app (Vite + Tailwind) — what customers use
│   └── .env       VITE_API_URL — already filled in for local dev
└── backend/      the Express + MongoDB API — orders, menu, settings, AI
    ├── .env       MONGODB_URI, ADMIN_PASSWORD, GEMINI_API_KEY, etc.
    └── models/    Mongoose schemas (Category, Item, Order, Customer, Settings, Counter)
```

Both `.env` files are already there — no example file to copy — but
`backend/.env` needs your real MongoDB connection string (and, if you
want AI descriptions, a Gemini key) before it'll run. Don't commit either
`.env` anywhere public once real credentials are in them (both are
already in `.gitignore`).

## Setting up MongoDB

You need a MongoDB **connection string** — the easiest free option is
MongoDB Atlas:

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Create a free "M0" cluster (takes a couple of minutes to provision).
3. Under **Database Access**, add a database user with a username and password.
4. Under **Network Access**, add your current IP — or `0.0.0.0/0` ("allow
   from anywhere") while you're just testing locally; tighten this once
   you deploy.
5. Click **Connect** on your cluster → **Drivers** → copy the connection
   string. It looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/?retryWrites=true&w=majority
   ```
6. Paste it into `backend/.env` as `MONGODB_URI`, replacing `<username>`
   and `<password>` with the real values, and add `/serveai` before the
   `?` so it points at a database named `serveai`:
   ```
   MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/serveai?retryWrites=true&w=majority
   ```

(If you'd rather run MongoDB locally instead of Atlas, install MongoDB
Community Server and use `MONGODB_URI=mongodb://localhost:27017/serveai`
— that's already the placeholder value in `.env`.)

The first time the backend connects to an empty database, it
automatically seeds a starter menu — nothing else to set up.

## Setting up Gemini (optional)

This powers the **"Generate with AI"** button next to item descriptions
in `/admin/menu`. Skip this if you don't want it — the button just won't
work until a key is added, and everything else runs fine without it.

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   and create a free API key.
2. Paste it into `backend/.env` as `GEMINI_API_KEY`.
3. `GEMINI_MODEL` is already set to a sensible default — only change it
   if Google renames/retires that model (check
   [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) if descriptions start failing).

## Getting started

```bash
cd backend
npm install
npm start        # http://localhost:4000
```

If `MONGODB_URI` isn't reachable, the server prints a clear error and
exits rather than hanging — that's your sign to double-check the
connection string.

The admin password is **`admin123`** (plain text, set in `backend/.env`
as `ADMIN_PASSWORD`) — change it before you show this to anyone else. See
"Upgrading to a hashed password" below for tightening this up later.

**Start the frontend**, in a separate terminal:

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build      # production build → frontend/dist/
npm run preview    # preview the production build locally
```

## Managing the menu (the admin panel)

Visit `/admin/login` (e.g. `http://localhost:5173/admin/login`) and log
in with your admin password. From there:

- **`/admin/dashboard`** — sales numbers: today, last 7 days, this
  month, this year, and all-time revenue + order counts, a 14-day trend
  chart, and a top sellers list (last 30 days, ranked by quantity sold).
- **`/admin/orders`** — the kitchen/counter view. Every order,
  auto-refreshing every few seconds, with a **sound + flash alert** when
  a new one comes in (tap "Sound off" once to turn it on — browsers
  require that one click before they'll allow audio). Filter by status,
  advance an order with one tap, see any **special instructions** the
  customer added, and a **"Regular"** tag for returning customers. Open
  **Details** for the full view with a **Print** button formatted for a
  narrow receipt printer, or **Export CSV** for bookkeeping.
- **`/admin/menu`** — add, edit, or delete items and categories. Each
  item can have a **photo** (tap the square next to the name to upload
  one — resized and compressed in the browser first) and a **"Generate
  with AI"** button that writes a description for you via Gemini. A
  **Sold out** button hides the item from ordering without deleting it.
- **`/admin/qr-codes`** — generate and print unique QR codes per table.
- **`/admin/settings`** — new page:
  - **Store Status** — a toggle to pause new orders site-wide (shows a
    banner and a custom message to customers, and the backend rejects
    checkout attempts while it's on) — useful at closing time or when
    the kitchen's slammed.
  - **Find Us** — edit your location and phone number directly, no more
    editing a code file.
  - **Backup & Restore** — download your full menu, settings, and order
    history as a JSON file, or restore from one. Restoring only **adds**
    what's missing — it never deletes or overwrites existing orders.

**Staying logged in:** login is stored in this browser's `localStorage`,
so it survives closing the tab or restarting the browser — built for a
single trusted device, not a shared public computer. The session lasts
30 days before you need to log in again.

If the backend is unreachable, the ordering menu quietly falls back to a
bundled seed menu (`frontend/src/data/menu.js`) and default contact info
(`frontend/src/data/contact.js`) so the site still works — you'll see a
small banner saying it's showing a saved menu.

## What customers see

- **Live order status** — after checkout, the confirmation screen polls
  and shows Received → Preparing → Ready → Served in real time, no login
  needed.
- **"Send to WhatsApp"** button — opens WhatsApp's contact picker with
  the order number and tracking link pre-filled, so a customer can save
  it or share it without typing anything.
- **"Welcome back!"** badge for anyone who's ordered before (matched by
  phone number) — a small nice-to-have, no loyalty program attached.
- **Special instructions** — an optional notes field at checkout (e.g.
  "no onions"), shown to staff in the kitchen view and on the printed ticket.

## Testing the QR codes

There are two different QR codes in this app, and they're easiest to
test in two different ways.

### Table QR codes (`/admin/qr-codes`)

These just link to `yoursite.com/?table=N` — on your own computer,
during local development, the simplest test is to **click the URL printed
under each QR code** rather than scanning it; you'll land on the menu
with "Table N" shown in the header.

To actually scan one with your phone's camera while developing locally:

1. Find your computer's local network IP (Windows: `ipconfig`, look for
   "IPv4 Address", something like `192.168.1.23`).
2. Run the frontend so it's reachable on your network: `npm run dev -- --host`
3. On your phone (same Wi-Fi network), the URL becomes
   `http://192.168.1.23:5173` instead of `localhost:5173`.
4. On `/admin/qr-codes`, change the **Site URL** field to that same
   address — the QR codes regenerate, now scannable from your phone.
5. Your phone also needs to reach the backend: set `VITE_API_URL` in
   `frontend/.env` to `http://192.168.1.23:4000` (restart the dev server
   after changing it), and set `CLIENT_ORIGIN` in `backend/.env` to
   `http://192.168.1.23:5173`.

This LAN-IP trick is only for local testing — once deployed with a real
domain, QR codes just work from any phone anywhere.

### Order QR codes (shown after checkout)

Staff scan this to see who ordered what — it requires an admin login
(see "How ordering works" below). To test without a second device,
there's a plain text link printed right under the QR itself.

## The menu booklet

`/booklet` is a flip-through digital version of the menu — cover page,
one page per category, a "Find Us" back cover — built with
[react-pageflip](https://www.npmjs.com/package/react-pageflip) for a
real page-turn animation. Reads the same live menu and contact settings
as everywhere else. There's a link to it on the main ordering page.

## How ordering works

- Placing an order calls `POST /api/orders`. MongoDB doesn't have a
  built-in auto-increment, so a small atomic counter (`models/Counter.js`)
  assigns each order a real, sequential number (1, 2, 3, 4…) — never
  random, never skipped.
- The order-success screen shows that number (e.g. `#0004`), a live
  status stepper, and a QR code linking to `yoursite.com/order/4`.
- That QR (or the link beneath it) opens a **staff-only** lookup page —
  it requires an admin login, since it shows the customer's name and
  phone number. The customer-facing status polling and the staff-facing
  lookup share the same endpoint (`GET /api/orders/:id`); it just returns
  less (no name/phone) when nobody's logged in.
- `/admin/orders` lists every order with live status, filters, one-tap
  status changes, and now shows customer notes and a "Regular" badge for
  repeat customers.
- `GET /api/orders` (list) and `PATCH /api/orders/:id/status` both
  require admin login — worth knowing if you built anything external
  against an earlier version of this API where they didn't.
- New orders are rejected with a clear message if the store is toggled
  "closed" in `/admin/settings`.

## SEO & discoverability

- **`robots.txt`** allows crawling of the menu but blocks `/admin/` and
  `/order/`.
- **`sitemap.xml`** lists just the home page. **Update the `<loc>` URL**
  in `frontend/public/sitemap.xml` and the `Sitemap:` line in
  `frontend/public/robots.txt` once you know your real domain.
- Every page sets its own title, meta description, robots directive, and
  canonical URL via `src/hooks/useSEO.js`.
- **Structured data (JSON-LD)** — schema.org `FoodEstablishment` record
  built from your live settings and menu — one source of truth.
- Open Graph + Twitter card tags for link previews.

> **Reality check:** this is a client-rendered React SPA, not
> server-rendered. If ranking for local search really matters, a Google
> Business Profile listing or migrating to Next.js for SSR will move the
> needle more than anything client-side can.

## Features

- Modern food-truck visual identity (custom "ServeAI" logo, checkerboard
  flag accents, ticket-stub styling)
- **Live, database-backed menu** with **photo uploads**, **AI-generated
  descriptions** (Gemini), and a **sold-out toggle**
- **Kitchen/orders view** with sound + flash alerts for new orders,
  status filters, one-tap status changes, customer notes, returning
  customer tags, a printable ticket, and CSV export
- **Sales dashboard** — today/7-day/month/year/all-time revenue and
  order counts, a 14-day trend chart, and a top sellers list
- **Live order status for customers** — no login needed, real-time
- **Special instructions** at checkout, shown to staff everywhere
- **WhatsApp share** and **"Welcome back"** recognition for repeat customers
- **Store status toggle** — pause new orders site-wide with a custom message
- **Settings page** — edit Find Us contact info without touching code
- **Database backup & restore** — download/restore your data as JSON
- **Menu booklet** (`/booklet`) — flip-through digital menu
- Sliding cart drawer ("Your Ticket"), rule-based "you might also like"
  cross-sell (skips sold-out items, no external AI call needed for this part)
- Checkout validation (name ≥ 2 letters, phone = 10 digits) on both ends
- Unique, sequential order numbers with QR-based staff lookup
- Unique, printable QR code per table
- Password-protected admin panel (JWT-based), stays logged in 30 days
- Security headers, rate limiting, strict payload validation
- Installable as an app (PWA) with offline-friendly caching
- A 404 page and an error boundary
- Fully responsive, mobile-first

## Editing the menu

1. **`/admin/menu`** (recommended) — live, immediate, includes photos and AI descriptions.
2. **`frontend/src/data/menu.js`** — only the offline fallback if the backend's unreachable.

## Setting up table QR codes

1. Deploy both the frontend and backend and note the live frontend URL.
2. Visit `https://yoursite.com/admin/qr-codes` and log in.
3. Set the number of tables, confirm the Site URL field, then **Save**
   each one or **Print all**.
4. Stick one QR at each table.

## Deploying

**Frontend (Vercel)** — root directory `frontend`, environment variable
`VITE_API_URL` pointing at your deployed backend.

**Backend** — root directory `backend`. Since it's now MongoDB-backed
(not a local SQLite file), it can go on Vercel serverless functions,
Render, Railway, or a VPS — whichever you prefer, since there's no local
file to worry about losing. Environment variables needed: `MONGODB_URI`,
`CLIENT_ORIGIN`, `ADMIN_PASSWORD` (**set a real one**), `ADMIN_JWT_SECRET`,
and optionally `GEMINI_API_KEY` / `GEMINI_MODEL`.

Remember to widen MongoDB Atlas's **Network Access** list to include
your deployed backend's outbound IP (or use "allow from anywhere" if
your host uses unpredictable IPs — check your host's docs).

## Upgrading to a hashed password

Right now `ADMIN_PASSWORD` in `.env` is compared as plain text (see
`backend/auth.js`). When you're ready to tighten that up:

1. `node hash-password.js "yourNewPassword"` — prints a bcrypt hash.
2. In `.env`, replace `ADMIN_PASSWORD=...` with `ADMIN_PASSWORD_HASH=<the hash>`.
3. In `backend/auth.js`, swap the plain comparison for:
   ```js
   import bcrypt from 'bcryptjs'
   const PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
   export function verifyAdminPassword(password) {
     if (!PASSWORD_HASH || !password) return false
     return bcrypt.compareSync(password, PASSWORD_HASH)
   }
   ```

## Known limitations / good next steps

- **I couldn't live-test the MongoDB connection** while building this —
  the environment had no path to a real database. Please do that first
  test yourself, locally, before deploying — and let me know if anything
  errors so we can fix it together.
- **Order totals aren't independently re-verified** against menu prices
  on the backend at order time. Fine for pay-at-counter; matters if you
  add online payment later.
- **Single shared admin password, stored as plain text in `.env`** — see
  "Upgrading to a hashed password" above before this goes somewhere
  public long-term.
- **Item photos are stored as base64 inside MongoDB documents**
  (compressed client-side, capped at ~1.5MB each). Fine for a menu-sized
  number of items; a dedicated object store (S3, Cloudinary) would scale
  better for hundreds of photos.
- **Gemini descriptions cost nothing to try but aren't guaranteed
  perfect** — always read what it writes before saving; it's a starting
  point, not the final word.
- **Restore is additive, not a full rollback** — it won't undo changes
  made after a backup was taken, only add back what's missing.

## Tech stack

**Frontend:** React 19, Vite, Tailwind CSS 4, react-router-dom,
react-pageflip, qrcode.react, lucide-react
**Backend:** Express, MongoDB via Mongoose, jsonwebtoken, bcryptjs,
helmet, express-rate-limit, Google Gemini API

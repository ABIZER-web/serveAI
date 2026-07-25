# ServeAI — Private Notes

**This file is for your own reference only. It's git-ignored on purpose —
never remove it from `.gitignore`, and never upload this specific file
anywhere public (not GitHub, not a shared drive).**

---

## Accounts

| Service | Account email |
|---|---|
| Render (backend hosting) | abizerprivate515@gmail.com |
| MongoDB Atlas (database) | abizerprivate515@gmail.com |
| Vercel (frontend hosting) | *(fill in once created)* |
| Google AI Studio (Gemini key) | *(fill in if used)* |
| Razorpay (online payment) | *(fill in if used)* |

> A note on passwords: even though this file is git-ignored and private,
> it's still a plain text file sitting on your computer. Consider keeping
> actual passwords in a password manager instead of writing them here —
> this table is meant for "which email did I sign up with," not a
> password store. If you do add passwords below anyway, that's your call,
> just know the risk (anyone with access to this file/device sees them
> in plain text).

## Live URLs

| Environment | URL |
|---|---|
| Backend (Render) | https://serveai-yoa0.onrender.com |
| Frontend (Vercel) | *(fill in once deployed)* |
| MongoDB Atlas cluster | *(fill in your cluster name/region)* |

## Default credentials (change these before real customers use it)

- **Admin panel password:** `admin123` (set in `backend/.env` as `ADMIN_PASSWORD`) — plain text for now, see "Upgrading to a hashed password" in the project's setup notes when ready to harden it.
- **Admin login URL:** `https://<your-frontend-url>/admin/login`

## Environment variables reference

### `backend/.env`
```
PORT=4000
CLIENT_ORIGIN=<your deployed frontend URL, e.g. https://serve-ai.vercel.app>
MONGODB_URI=<MongoDB Atlas connection string>
ADMIN_PASSWORD=<a real password, not admin123>
ADMIN_JWT_SECRET=<a long random string — generate with:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" >
GEMINI_API_KEY=<optional — from aistudio.google.com/apikey>
GEMINI_MODEL=gemini-2.5-flash
RAZORPAY_KEY_ID=<optional — from dashboard.razorpay.com/app/keys>
RAZORPAY_KEY_SECRET=<optional>
```

### `frontend/.env`
```
VITE_API_URL=<your deployed backend URL, e.g. https://serveai-yoa0.onrender.com>
```

## Deployment runbook (what actually worked)

1. Repo pushed to GitHub: `github.com/ABIZER-web/serveAI` — root of the
   repo contains both `frontend/` and `backend/` folders side by side.
2. **Backend on Render:**
   - New Web Service → connect the GitHub repo
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment variables set per the reference above
   - Free tier spins down after inactivity — first request after idle
     time takes ~50 seconds. Upgrade to a paid instance to avoid this
     once this is handling real customers.
3. **Frontend on Vercel:**
   - Import the same repo
   - Application preset: **Other** (not "Services" — that mode tries to
     deploy both frontend and backend as separate Vercel services, which
     you don't want; the backend stays on Render because Socket.IO needs
     a persistent connection that Vercel's serverless functions don't
     reliably support)
   - Root directory: `frontend`
   - Environment variable: `VITE_API_URL` pointing at the Render backend
4. **Connect them:** after the Vercel URL exists, go back to Render →
   Environment → set `CLIENT_ORIGIN` to that Vercel URL, save (auto-redeploys).
5. **MongoDB Atlas Network Access:** set to allow access from anywhere
   (0.0.0.0/0) unless on a paid Render plan with a static outbound IP.

## Production checklist (before telling real customers it's live)

- [ ] `ADMIN_PASSWORD` changed from `admin123`
- [ ] MongoDB Atlas network access reviewed
- [ ] `frontend/public/robots.txt` and `sitemap.xml` updated with the real domain
- [ ] Full test order placed end-to-end (menu → cart → checkout → kitchen view → status updates)
- [ ] If using Razorpay: confirmed **live** keys are in place, not test keys
- [ ] Table QR codes generated from `/admin/qr-codes` with the real production URL
- [ ] Find Us contact info updated in `/admin/settings` (real address/phone, not placeholders)

## Known limitations / things not yet done

- **MongoDB connection was never live-tested during development** — the
  build environment had no path to a real database server. First real
  connection test needs to happen on your machine or in production.
- **Razorpay integration is untested live** for the same reason — no
  network path to Razorpay's API from the build environment. Test with
  Razorpay test-mode keys before switching to live keys.
- **Socket.IO real-time updates** — also untested against a real deployed
  pair of frontend+backend; should work based on the code, but confirm
  once both are live (place a test order and watch `/admin/orders` for
  the instant update + sound).
- **Hindi/English toggle** — requested but not built; would need
  translation work across most customer-facing pages.
- **Order totals aren't re-verified against menu prices server-side** at
  checkout time — fine for pay-at-counter, matters more if online
  payment volume grows.
- **Single shared admin password** stored as plain text in `.env` — see
  "Upgrading to a hashed password" in the setup notes for tightening
  this later.
- **Item photos stored as base64 in MongoDB** — fine at menu-item scale;
  a dedicated file store (S3, Cloudinary) would be better at hundreds of
  photos.

## Support

This project was built with Claude (Anthropic). If you're picking this
back up in a new conversation, sharing this file (privately, never
publicly) gives full context on what's built, what's pending, and what
to test first.

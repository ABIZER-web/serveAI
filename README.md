# ServeAI 🍔

**Scan. Tap. Served.**

A modern, full-stack scan-to-order platform built for fast-food trucks and
small food businesses — customers scan a QR code at their table, browse a
live digital menu, build their order, and track it in real time. Behind
the scenes, the owner gets a complete kitchen and business toolkit: live
order management, sales analytics, AI-assisted menu writing, and full
control over the menu, pricing, and store status — no code required.

Built with React, Node.js/Express, and MongoDB.

---

## 📸 Screenshots

<!--
  Add your screenshots to a `screenshots/` folder in the repo root, then
  update the paths below to match your filenames. Recommended shots:
  the ordering menu, the cart/ticket, order confirmation with QR, the
  menu booklet, the admin dashboard, and the kitchen/orders view.
-->

| | |
|---|---|
| ![Ordering menu](./screenshots/menu.png) | ![Cart / ticket](./screenshots/cart.png) |
| ![Order confirmation](./screenshots/order-success.png) | ![Menu booklet](./screenshots/booklet.png) |
| ![Admin dashboard](./screenshots/dashboard.png) | ![Kitchen / orders view](./screenshots/orders.png) |

---

## ✨ Features

**For customers**
- Scan-to-order from any table — no app download needed
- Browse the menu, or flip through a page-turning digital booklet
- Customize items with sizes and add-ons
- Choose dine-in, takeaway, or delivery
- Pay at the counter or online (Razorpay)
- Live order status tracking, right from the confirmation screen
- One-tap "send to WhatsApp" to save or share the order
- Installable as an app (PWA) for weak-signal reliability

**For the business owner (admin panel)**
- Full menu management — items, categories, photos, pricing, availability
- AI-assisted menu descriptions, powered by Google Gemini
- Live kitchen/orders view with sound alerts for new orders
- Sales dashboard — daily/weekly/monthly/yearly revenue, top sellers, peak hours
- Customer order lookup by phone number
- Drag-and-drop menu reordering
- Store open/closed toggle with a custom message
- Editable business info (location, contact) — no code edits needed
- One-click data backup & restore
- Printable order tickets and CSV export for bookkeeping
- Unique, printable QR codes per table

## 🛠 Tech stack

**Frontend:** React, Vite, Tailwind CSS, react-router-dom, react-pageflip,
Socket.IO client, qrcode.react

**Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT auth,
Google Gemini API, Razorpay

## 🚀 Getting started

```bash
# Backend
cd backend
npm install
# configure backend/.env — see the setup guide for what each value needs
npm start

# Frontend, in a separate terminal
cd frontend
npm install
# configure frontend/.env
npm run dev
```

## 📄 License & attribution

© 2026 ServeAI. All rights reserved.
Made with ♥ by **Abizer Saify**.

This project is shared for portfolio and demonstration purposes. Please
don't copy, redistribute, or claim this codebase as your own without
permission.

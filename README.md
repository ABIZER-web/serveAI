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

Ordering menu <img width="1896" height="862" alt="image" src="https://github.com/user-attachments/assets/12a8ed74-2949-4daf-bdcf-091e4c0a21f9" />
Cart / ticket <img width="1900" height="867" alt="image" src="https://github.com/user-attachments/assets/c5e6bf78-5ead-4fd4-940a-966ba6c23e80" />
Menu booklet <img width="1912" height="862" alt="image" src="https://github.com/user-attachments/assets/3713dcd3-7e82-4aa8-964a-bda444d210a3" />
Admin dashboard <img width="1896" height="867" alt="image" src="https://github.com/user-attachments/assets/72946f20-50c0-44dd-9fb7-3bd8e723ff9c" />
Kitchen <img width="1896" height="862" alt="image" src="https://github.com/user-attachments/assets/7beb6759-1852-475c-979f-a35346cfcf6a" />
Orders view<img width="1912" height="862" alt="image" src="https://github.com/user-attachments/assets/83abdd25-94a5-4ceb-8a01-4f62bfcc88da" />
Menu Manager <img width="1895" height="862" alt="image" src="https://github.com/user-attachments/assets/21f13e6a-fa77-41e3-be18-c9a5d187e53c" />
Table Qr Generator <img width="1896" height="863" alt="image" src="https://github.com/user-attachments/assets/fb6caf50-a6f2-4f9d-96f2-ed47a06ff12c" />
Settings <img width="1895" height="861" alt="image" src="https://github.com/user-attachments/assets/8908ca6a-a2e0-42f6-bd0e-980f922247e1" />


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

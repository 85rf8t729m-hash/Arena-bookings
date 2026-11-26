# Arena Bookings

A simple website where anyone can check when the arena is free and send a booking request. It works on any phone, tablet or computer, and visitors don't need to log in or create an account.

**How booking works:** a visitor picks a day and time, adds their name and number, and taps **WhatsApp**, **Email** or **Text message**. Their phone opens that app with the request already written, and they press Send. You reply to confirm, then mark the time as booked (see below).

---

## Put the site online (free, works from a phone)

The site is hosted for free by **GitHub Pages**. Do these steps in your phone's web browser (Safari or Chrome) at **github.com**, signed in. If a settings page looks cramped, tap the browser's **aA** or **⋮** menu and choose **Request desktop website**.

1. **Make the repository public.** GitHub Pages is only free for public repositories.
   Open the repository → **Settings** → scroll to the bottom (**Danger Zone**) → **Change visibility** → **Make public** → confirm.
2. **Turn on GitHub Pages.**
   **Settings** → **Pages** (in the left menu, under "Code and automation") → under **Build and deployment**, set **Source** to **Deploy from a branch** → set **Branch** to **main** with folder **/ (root)** → **Save**.
3. **Wait 1–2 minutes** and refresh the Pages settings page. It shows your site's address, which looks like
   `https://<your-github-username>.github.io/Arena-bookings/`

Share that link however you like. The site also has a **Show QR code** button (in "Contact & location") that you can screenshot for posters.

---

## Mark times as booked (from your phone)

1. Open **`bookings.js`** in the repository and tap the **pencil icon** (Edit).
2. Add a line under `booked:` for each confirmed booking, for example:
   ```js
   { date: "2026-12-05", from: "10:00", to: "12:00" },
   ```
3. Tap **Commit changes**. The website updates within a minute or two.

In the same file you can also add **weekly** bookings (such as a club night every Tuesday) and **closed** days (such as holidays). The example entries in the file are placeholders, so delete or replace them before you share the site.

## Change your details, prices and hours

Open **`config.js`** and edit it the same way. It holds:

- the arena name and description
- your WhatsApp number, phone and email (where requests go)
- address, opening hours and slot length
- prices, facilities and FAQs

> **Important:** Put your real WhatsApp number, phone and email in `config.js` before you share the site. The ones in the file are examples.

**Tip when editing:** keep the quotes `" "`, commas `,` and brackets exactly as they are. If you make a typo, the site shows a yellow notice at the top. Undo your last change and the site goes back to normal.

---

## What's in this folder

| File | What it is |
|---|---|
| `config.js` | **Edit this.** Your details, hours and prices |
| `bookings.js` | **Edit this.** Booked times and closed days |
| `index.html` | The page itself |
| `assets/` | Design, behaviour, icons and the QR code generator |
| `manifest.webmanifest` | Lets people add the site to their home screen like an app |

There are no logins, databases, servers or monthly fees. The site is plain files, so it stays fast and keeps working.

# Book the Arena

A simple booking page for the arena. Anyone with the link can book on any phone, tablet or computer. Nobody needs to log in.

People put their name, pick a day, a start time and how long, and tap **Book it**. Everyone sees the same bookings straight away.

**Rules built in:** 6am–10pm, 45 minutes max after 4pm, and no more than 2 riders in the arena at once. Ticking **Private** keeps the arena to yourself for that booking. To change them, edit the numbers near the top of the script in `index.html`.

---

## Where it lives

- **Website:** https://85rf8t729m-hash.github.io/Arena-bookings/ (published from the `gh-pages` branch)
- **Bookings database:** Google Firebase project `arena-bookings-23a76` (Firestore). Settings are in `firebase-config.js`; the database rules are in `firestore.rules`.

To change the live site, the change must be on the `gh-pages` branch.

---

## Handy to know

- **Cancel a booking:** people see **Your bookings** at the bottom of the page on the phone they booked with, and can cancel there.
- **Owner view:** add `#owner` to the end of the link (`…/Arena-bookings/#owner`). You'll see everyone's bookings for the chosen day and can cancel any of them. Anyone who knows this link can do the same, so keep it to yourself.
- **Add to home screen:** in Safari tap Share → **Add to Home Screen**. In Chrome tap ⋮ → **Add to Home screen**. It then opens like an app.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole booking page |
| `firebase-config.js` | Your Firebase settings (Step 2) |
| `firestore.rules` | Database rules to paste into Firebase (Step 2) |
| `assets/` | Icons, plus Google's Firebase code (Apache 2.0 licence) |

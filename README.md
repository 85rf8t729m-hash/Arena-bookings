# Book the Arena

A simple booking page for the arena. Anyone with the link can book on any phone, tablet or computer. Nobody needs to log in.

People put their name, pick a day, a start time and how long, and tap **Book it**. Everyone sees the same bookings straight away.

**Rules built in:** 6am–10pm, 45 minutes max after 4pm, and no more than 2 riders in the arena at once. To change them, edit the numbers near the top of the script in `index.html`.

---

## Step 1: Put the page online (free)

Do this in your phone's browser at **github.com**, signed in. If a settings page looks squashed, use the browser menu and choose **Request desktop website**.

1. Open this repository → **Settings** → scroll to the bottom → **Change visibility** → **Make public**.
2. **Settings** → **Pages** → **Source:** Deploy from a branch → **Branch:** `main`, folder `/ (root)` → **Save**.
3. After 1–2 minutes, the page is live at
   `https://85rf8t729m-hash.github.io/Arena-bookings/`

Until Step 2 is done, the page runs in **preview mode**: bookings only save on the phone that made them.

## Step 2: Connect the free booking database (Google Firebase)

This lets everyone see the same bookings. It takes about 5 minutes, once.

1. Go to **console.firebase.google.com** and sign in with any Google account.
2. Tap **Create a project** (or **Get started**). Name it `arena-bookings`. You can turn off Google Analytics. Tap **Create project**, then **Continue**.
3. Open the menu (☰) → **Build** → **Firestore Database** → **Create database**. Pick **Standard edition** if asked, and a location near you (for the UK, `europe-west2 (London)`). Choose **Start in production mode** → **Create**.
4. Tap the **Rules** tab. Delete everything in the box, paste in the contents of [`firestore.rules`](firestore.rules), and tap **Publish**.
5. Tap the **gear icon** → **Project settings**. Scroll to **Your apps**, tap the **web icon `</>`**, type any nickname, and tap **Register app**. You'll see a block starting with `const firebaseConfig = {`.
6. Copy that block and paste it into `firebase-config.js` in this repository (pencil icon → paste over the empty values → **Commit changes**). You can also send it to Claude to do for you.

Once that's done, the yellow "Preview" note disappears and bookings are live for everyone.

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

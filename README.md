# My Personal Tracker (PWA)

To-do + Career task tracker with dashboards, a Today view, custom dropdowns and notifications.
No build step, no dependencies.

## Files

```
index.html        the app
notify.js         notification logic (shared by app + service worker)
sw.js             service worker (offline + notifications)
manifest.json     PWA manifest
icons/            app icons (192, 512, maskable 512)
```

## Deploy on GitHub Pages

1. Create a repo and upload **all files, keeping the `icons/` folder**, to the repo root.
2. Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`.
3. Open `https://<your-username>.github.io/<repo>/` (HTTPS is required for PWAs and notifications).

## Install

- **Android (Chrome):** menu → *Install app*.
- **iPhone (Safari):** Share → *Add to Home Screen*. Notifications only work after this (iOS 16.4+).
- **Desktop (Chrome/Edge):** install icon in the address bar.

## Notifications

Open **Settings → Notifications → Enable notifications**, then pick per module (To-do / Career):

- Task end date (due today, due tomorrow, overdue)
- Today's tasks summary
- High-priority pending tasks
- Status: completed and pending (plus an instant alert when you tick a task as done)

Each alert is sent once per day, after the reminder time you choose.

### Important limits

Alerts are generated **on your device**, not by a server:

- They fire while the app is open or in the background, and when you reopen it.
- On Android Chrome with the app installed, a background check runs periodically (about hourly, browser-controlled), so alerts can arrive even when the app is closed.
- On iPhone and desktop, alerts can't be guaranteed while the app is fully closed.

For alerts that always arrive, add a push server (Web Push + VAPID keys, e.g. a small Cloudflare Worker or Firebase). `sw.js` already has a `push` handler ready for it.

## Data

Stored in your browser (`localStorage`) on each device. Use **Settings → Export JSON** to back up. Data is not synced between devices.

## Updating

Change `V = 'tracker-v1'` in `sw.js` (e.g. to `v2`) when you ship changes so old caches are cleared.

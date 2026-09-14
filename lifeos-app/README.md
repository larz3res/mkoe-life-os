# Life OS

A personal daily/weekly/monthly planning app — tasks, school, money, goals,
projects and habits in one dashboard.

## Deploy it in about 5 minutes (no coding required)

**1. Put this folder on GitHub**
- Go to github.com → New repository → name it `life-os` → Create.
- On the new repo page, choose "uploading an existing file" and drag in
  every file/folder from this project (keep the folder structure — `src/`,
  `public/`, `package.json`, etc.).
- Commit.

**2. Deploy on Vercel (free)**
- Go to vercel.com → Sign up/log in with your GitHub account.
- Click "Add New… → Project", pick the `life-os` repo, click Deploy.
- Vercel detects it's a Vite app automatically — no settings to change.
- In ~1 minute you'll get a live URL like `life-os-yourname.vercel.app`.

That's it — the site is live and stays live for free.

## Put it on your phone and laptop

- **Phone (iOS):** open the URL in Safari → Share button → "Add to Home
  Screen". It now behaves like an installed app (own icon, no browser bar).
- **Phone (Android):** open the URL in Chrome → menu (⋮) → "Add to Home
  screen" / "Install app".
- **Laptop:** open the URL in Chrome or Edge → click the install icon (a
  small monitor/plus icon) at the right of the address bar → Install.

## Important: data storage

This build saves your data in the browser's `localStorage`, so **each
device keeps its own data** — your phone and laptop won't automatically
see the same tasks unless you add real cross-device sync (e.g. a free
Supabase or Firebase project). Ask if you'd like that wired in — it's a
bigger change (needs a login and a database) but keeps everything in sync
everywhere.

## Running it locally (optional, if you have Node.js installed)

```bash
npm install
npm run dev      # opens a local dev server
npm run build    # produces a production build in dist/
```

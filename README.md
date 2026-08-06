# ExpenseTracker

A Progressive Web App for logging everyday household expenses — groceries, lunch and dinner, travel, utilities and everything in between. Built as a sibling to **HomeTracker** and **AutoTrack**, and it writes into the *same* Firestore `transactions` ledger those apps use, so a household sees all of its spending in one place.

```
Family/
├── AutoTrack (CarTracker)   → car service costs   → "Car - {service} - {year} - {make} {model}"
├── HomeTracker              → home maintenance    → "Home - {category} - {home}"
└── ExpenseTracker           → everyday spending   → "Expense - {category}"
```

---

## Highlights

- **One shared ledger.** Entries live in `users/{uid}/transactions` (personal) or `households/{code}/transactions` (shared) — the exact collection HomeTracker and AutoTrack write to.
- **Cross-app visibility.** Home and car entries show up in the log with their own badge and are read-only here; they are edited in the app that created them.
- **Household members.** Anyone who joins the same household code logs into the same ledger, and every entry records who paid.
- **Fast logging.** Quick-add tiles, vendor autocomplete from past entries, category chips, sensible date/time defaults.
- **Insights.** Six-month trend, category split, top vendors, and per-member totals for any month.
- **Offline capable.** Local storage mirror plus a service worker app shell; installable to a phone home screen.

## Data model

Every entry is one document in the shared `transactions` collection:

| Field             | Type      | Notes                                                        |
| ----------------- | --------- | ------------------------------------------------------------ |
| `id`              | string    | Document id (`exp-<timestamp>` for entries created here)      |
| `date`            | string    | `YYYY-MM-DD`                                                  |
| `time`            | string    | `HH:MM`                                                       |
| `amount`          | number    | Dollars                                                       |
| `vendor`          | string    | **Store, restaurant or shop**                                 |
| `notes`           | string    | Optional                                                      |
| `category`        | string    | Namespaced — `Expense - Grocery`                              |
| `paymentType`     | string    | Cash / Credit Card / Debit Card / Bank Transfer / Check / Other |
| `user`            | string    | Household member who paid                                     |
| `isTaxDeductible` | boolean   | Optional                                                      |

The `Expense - ` prefix is what lets each app pick its own rows out of a combined household ledger. Anything with a different prefix is rendered read-only.

### Categories

Grocery · Food & Dining · Travel · Transportation · Utilities · Household Supplies · Health & Medical · Shopping · Entertainment · Education · Personal Care · Kids & Childcare · Pets · Subscriptions · Insurance · Gifts & Donations · Other

## Household sharing

Settings → **Household sharing** → enter a code (e.g. `SMITH2026`).

Joining writes the member into `households/{code}/metadata/info` and switches every read and write to `households/{code}/transactions`. Leaving the household returns the app to the personal ledger. Use the **same code** as HomeTracker and AutoTrack to see all of a household's costs together.

## Getting started

```bash
npm install
npm run dev
```

The dev server runs on <http://localhost:3004> (AutoTrack uses 3000, HomeTracker 3001).

Copy `.env.example` to `.env` and fill in the **same Firebase project** the other family apps use — otherwise the shared ledger will not line up:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Without Firebase config the app runs in local demo mode: no sign-in, sample data, everything stored in `localStorage`.

## Scripts

| Command          | What it does                                             |
| ---------------- | -------------------------------------------------------- |
| `npm run dev`    | Vite dev server on port 3004                              |
| `npm run build`  | Type-check (`tsc -b`) and build to `dist/`                |
| `npm run preview`| Serve the production build                                |
| `npm run lint`   | oxlint                                                    |
| `npm run icons`  | Regenerate the PNG app icons from `scripts/generate-icons.mjs` |

## Icon

The app mark is a receipt on an indigo tile. `public/favicon.svg` is the source of truth; `scripts/generate-icons.mjs` rasterizes the same shapes into `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png` and `favicon-32x32.png` with no native image dependencies.

## Deploying

Cloudflare Pages / Workers, same as the sibling apps:

```bash
npm run build
npx wrangler deploy
```

`wrangler.toml` serves `./dist` as a single-page application.

## Tech

React 19 · TypeScript · Vite · Tailwind CSS v4 · Firebase (Auth + Firestore) · Recharts · lucide-react

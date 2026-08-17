# ExpenseTracker

<div align="center">

![ExpenseTracker Banner](public/favicon.svg)

### Everyday Household Expense Logging & Family Ledger PWA

A fast, offline-capable Progressive Web App built to log everyday household spending — groceries, dining, travel, supplies, medical, and entertainment. Built as a sibling application to **HomeTracker** and **AutoTrack**, writing directly to a unified Firestore ledger so your household sees all expenses in one place.

<br/>

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare_Pages-Deployed-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable_%26_Offline-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Linter](https://img.shields.io/badge/Linter-oxlint-FA7343?style=for-the-badge&logo=rust&logoColor=white)](https://oxc.rs/)

</div>

---

## 📑 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Key Features](#-key-features)
- [Data Model & Ledger Schema](#-data-model--ledger-schema)
- [Category Hierarchy & Taxonomy](#-category-hierarchy--taxonomy)
- [Household Sharing & Multi-User Sync](#-household-sharing--multi-user-sync)
- [Ecosystem & Sibling Apps](#-ecosystem--sibling-apps)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [PWA & Icon Pipeline](#-pwa--icon-pipeline)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)

---

## 🏛️ Overview & Architecture

**ExpenseTracker** is engineered as part of a family tracker ecosystem. Rather than maintaining isolated silos for different kinds of expenses, all three applications share the exact same Firestore collection path:

```text
Family Ledger Ecosystem
├── 🚗 AutoTrack (Port 3000)     → Vehicle maintenance & repairs → "Car - {service} - {year} - {make} {model}"
├── 🏠 HomeTracker (Port 3001)   → Home projects & utilities     → "Home - {category} - {home}"
└── 💳 ExpenseTracker (Port 3004) → Everyday household spending   → "Expense - {category} [- {subcategory}]"
```

```text
                               ┌────────────────────────────────────────────────┐
                               │             Shared Firestore DB                │
                               │  users/{uid}/transactions  (Personal Mode)     │
                               │  households/{code}/transactions (Shared Mode)  │
                               └───────────────────────┬────────────────────────┘
                                                       │
                   ┌───────────────────────────────────┼───────────────────────────────────┐
                   ▼                                   ▼                                   ▼
         ┌───────────────────┐               ┌───────────────────┐               ┌───────────────────┐
         │     AutoTrack     │               │    HomeTracker    │               │  ExpenseTracker   │
         │  (Car Maintenance)│               │  (Home & Property)│               │ (Everyday Expense)│
         └───────────────────┘               └───────────────────┘               └───────────────────┘
```

> [!NOTE]
> **Unified Read-Side, Guarded Write-Side**: Entries created by HomeTracker or AutoTrack render seamlessly in ExpenseTracker with source tags (`Home`, `Car`) and are read-only here. Expense-owned records can be edited, updated, or removed directly within ExpenseTracker.

---

## ✨ Key Features

- **⚡ Fast, Streamlined Logging**:
  - Pre-populated quick-add tiles for frequent expenses.
  - Vendor autocomplete dynamically inferred from past transactions.
  - Subcategory chip selector that expands on demand.
  - Smart default date and current time stamps.
- **👥 Household Multi-User Sync**:
  - Connect multiple household members using a simple household code (e.g., `SMITH2026`).
  - Assign who paid for each expense with audit tracking.
  - Switch between personal ledger mode (`users/{uid}`) and shared household mode (`households/{code}`).
- **📊 Real-time Analytics & Visual Insights**:
  - 6-month spending trend graphs with interactive monthly breakdowns.
  - Category and subcategory distribution charts powered by Recharts.
  - Top vendor rankings and member-by-member payment allocation.
  - Monthly navigation with instant recalculations.
- **💳 Custom Payment Method Management**:
  - Built-in system payment methods (Credit Card, Debit Card, Cash, Bank Transfer, Check, Other).
  - Add custom personal or shared household payment types (e.g., *Chase Sapphire*, *Joint Checking*).
- **📝 Tax & Notes Support**:
  - Mark entries as tax-deductible for tax season filtering and export.
  - Add structured notes to any transaction.
- **📱 Offline-First Progressive Web App (PWA)**:
  - Custom service worker (`sw.js`) for instant app shell caching and offline resilience.
  - LocalStorage mirror to guarantee data availability with or without network connection.
  - Native-like install prompt for Android, iOS, macOS, and Windows home screens.
- **🎨 Modern Responsive UI**:
  - Mobile-first layout with smooth tab navigation, sliding bottom sheets, and responsive desktop grid views.
  - Clean Tailwind CSS v4 styling with accessible contrast and micro-animations.

---

## 🗄️ Data Model & Ledger Schema

Every expense document is saved directly in the shared `transactions` subcollection:

```typescript
interface Transaction {
  id: string;               // e.g. "exp-1718000000000"
  date: string;             // ISO Date: "YYYY-MM-DD"
  time: string;             // 24hr Time: "HH:MM"
  amount: number;           // Dollar amount (e.g. 42.50)
  vendor: string;           // Store, restaurant, merchant, or service provider
  notes?: string;           // Optional notes / descriptions
  category: string;         // Namespaced category string, e.g. "Expense - Grocery - Supermarket"
  paymentType: string;      // Payment method identifier
  user: string;             // Name or display name of the household member who paid
  isTaxDeductible?: boolean;// Optional tax deductible flag
}
```

### Household Metadata Schema (`households/{code}/metadata/info`)

```typescript
interface HouseholdMetadata {
  code: string;             // Household code (e.g. "FAMILY2026")
  createdAt: string;        // Timestamp
  createdBy: UserAuditInfo; // Owner metadata
  members: UserAuditInfo[]; // List of authorized household members
}
```

---

## 🏷️ Category Hierarchy & Taxonomy

Categories are stored namespaced as `Expense - {Category} - {Subcategory}`. This format allows the shared ledger to retain strict backward and cross-app compatibility without requiring schema migrations.

| Category | Subcategories |
| :--- | :--- |
| **Grocery** | Supermarket · Warehouse Club · Produce & Market · Meat & Seafood · Bakery · Beverages |
| **Food & Dining** | Restaurant · Takeout & Delivery · Coffee & Tea · Fast Food · Bar & Drinks · Dessert & Snacks |
| **Travel** | Flights · Lodging · Car Rental · Activities & Tours · Travel Food · Fees & Baggage |
| **Transportation** | Fuel · Public Transit · Rideshare & Taxi · Parking · Tolls |
| **Household Supplies** | Cleaning · Paper Goods · Kitchen · Laundry · Storage & Organization · Tools & Hardware |
| **Health & Medical** | Doctor Visit · Dental · Vision · Pharmacy · Therapy & Mental Health · Lab & Imaging |
| **Shopping** | Clothing · Shoes & Accessories · Electronics · Home & Furniture · Books & Media · Sporting Goods |
| **Digital & Tech** | Domains & Hosting · Software & Apps · AI & Dev Tools · Cloud & Storage · Online Services · Devices & Accessories |
| **Entertainment** | Streaming · Movies & Theater · Concerts & Events · Games · Hobbies · Sports & Recreation |
| **Education** | Tuition · Books & Supplies · Courses & Training · Tutoring · School Fees · Exams & Certification |
| **Personal Care** | Haircut & Salon · Gym & Fitness · Spa & Massage · Cosmetics · Nails |
| **Kids & Childcare** | Daycare · Babysitting · School · Activities & Camps · Clothing · Toys & Gear |
| **Pets** | Food & Treats · Vet · Grooming · Supplies · Boarding & Sitting · Medication |
| **Insurance** | Health · Dental & Vision · Life · Disability · Umbrella |
| **Gifts & Donations** | Gifts · Charity · Religious · Fundraisers · Cards & Wrapping |
| **Other** | Fees & Charges · Taxes · Cash Withdrawal · Reimbursable |

> [!IMPORTANT]
> **Domain Boundaries & Exclusions:**
> - **Utilities** (Electric, Water, Gas, Internet) belong to a property and are owned by **HomeTracker** (appear as read-only `Home - Utilities` records).
> - **Auto & Property Insurance / Repairs** are managed directly in **AutoTrack** or **HomeTracker**.
> - **Subscriptions** are treated as payment cadences rather than categories — e.g., Spotify goes to `Entertainment - Streaming`, OpenAI / Cursor to `Digital & Tech - AI & Dev Tools`.

---

## 👥 Household Sharing & Multi-User Sync

1. Open **Settings** &rarr; **Household Sharing**.
2. Enter your desired Household Code (e.g. `OURHOME2026`) and click **Join Household**.
3. Once connected:
   - Your transactions switch from `users/{uid}/transactions` to `households/{code}/transactions`.
   - All household members contribute to the same live ledger.
   - You can assign individual payers to any transaction for granular cost splitting and insights.
   - Leaving the household returns the app immediately to your personal ledger.

---

## 🌐 Ecosystem & Sibling Apps

| Application | Default Port | Target Domain | Namespace Prefix |
| :--- | :--- | :--- | :--- |
| **AutoTrack** | `3000` | Vehicles, fuel logs, service history, auto insurance | `Car - ...` |
| **HomeTracker** | `3001` | Property maintenance, utilities, home appliances | `Home - ...` |
| **ExpenseTracker** | `3004` | Daily household expenses, shopping, groceries, dining | `Expense - ...` |

---

## 🛠️ Tech Stack

- **Core & Runtime**: [React 19](https://react.dev/), [TypeScript 6](https://www.typescriptlang.org/), [Node.js](https://nodejs.org/)
- **Bundler & Build Tooling**: [Vite 8](https://vitejs.dev/) with `@vitejs/plugin-react`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`, `clsx`, `tailwind-merge`
- **Database & Authentication**: [Firebase Web SDK v12](https://firebase.google.com/) (Firebase Auth, Cloud Firestore)
- **Charts & Data Visualization**: [Recharts 3](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linting & Code Quality**: [oxlint](https://oxc.rs/)
- **Deployment & Hosting**: [Cloudflare Pages & Workers](https://pages.cloudflare.com/) (`wrangler`)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher (see [.nvmrc](file:///.nvmrc))
- **npm**: `v10.x` or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ExpenseTracker.git
cd ExpenseTracker

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Visit [`http://localhost:3004`](http://localhost:3004) in your browser.

> [!TIP]
> **Zero-Config Local Demo Mode**: If no `.env` file is present or Firebase keys are omitted, ExpenseTracker automatically launches in offline demo mode using browser `localStorage` and sample test records.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory by copying [`.env.example`](file:///.env.example):

```bash
cp .env.example .env
```

Populate the configuration with your Firebase project credentials (ensure it matches the Firebase project used by AutoTrack and HomeTracker for shared ledger features):

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-family-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-family-app
VITE_FIREBASE_STORAGE_BUCKET=your-family-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456...
```

---

## 📜 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local development server on port `3004` |
| `npm run build` | `tsc -b && vite build` | Runs TypeScript type checking and generates production bundle in `dist/` |
| `npm run preview` | `vite preview` | Serves local preview of the production build |
| `npm run lint` | `oxlint` | Fast Rust-based lint check across codebase |
| `npm run icons` | `node scripts/generate-icons.mjs` | Regenerates PWA and Apple Touch icon assets from `public/favicon.svg` |

---

## 📱 PWA & Icon Pipeline

- **Vector Source**: [`public/favicon.svg`](file:///public/favicon.svg) is the canonical source of truth for the brand mark (a clean receipt icon set on an indigo tile).
- **Automated Rasterizer**: Running `npm run icons` executes [`scripts/generate-icons.mjs`](file:///scripts/generate-icons.mjs) using standard Node.js zlib/PNG generators without external binary dependencies.
- **Generated Assets**:
  - `public/favicon-32x32.png`
  - `public/apple-touch-icon.png` (180x180)
  - `public/pwa-192x192.png`
  - `public/pwa-512x512.png`
- **Service Worker**: Configured in [`public/sw.js`](file:///public/sw.js) to cache static assets and serve the app shell offline.

---

## 🚀 Deployment

The project is pre-configured for **Cloudflare Pages / Workers** via [`wrangler.toml`](file:///wrangler.toml):

```bash
# 1. Build the production application
npm run build

# 2. Deploy to Cloudflare Pages
npx wrangler deploy
```

The `./dist` directory is served with SPA fallback handling enabled via [`public/_redirects`](file:///public/_redirects) and [`public/_routes.json`](file:///public/_routes.json).

---

## 📂 Project Structure

```text
ExpenseTracker/
├── .claude/                   # Claude agent configuration
├── public/                    # Static PWA assets & service worker
│   ├── _redirects             # SPA routing rules for Cloudflare Pages
│   ├── _routes.json           # Cloudflare Workers route configurations
│   ├── favicon.svg            # Source vector icon
│   ├── manifest.json          # Web app manifest for PWA installation
│   └── sw.js                  # Service worker caching strategy
├── scripts/                   # Icon generators and migration utilities
│   ├── generate-icons.mjs     # Standalone SVG-to-PNG rasterizer script
│   └── migrate_household_*.mjs# Household ledger migration helpers
├── src/
│   ├── components/
│   │   ├── Auth/              # Authentication screens & modal
│   │   ├── Dashboard/         # Quick tiles, monthly summary, quick add
│   │   ├── Expenses/          # Expense list, entry rows, detail sheet, editor modal
│   │   ├── Insights/          # Charts, trends, category and payer breakdowns
│   │   ├── Layout/            # App header, tab navigation, responsive shell
│   │   ├── PWA/               # Install prompts and offline indicators
│   │   └── Settings/          # Household configuration & payment types modal
│   ├── constants/             # Category & subcategory taxonomy definitions
│   ├── services/
│   │   ├── firebase.ts        # Firebase Auth & Firestore data integration
│   │   └── storage.ts         # LocalStorage offline synchronization layer
│   ├── types/                 # TypeScript interfaces and data models
│   ├── utils/                 # Transaction parsers, formatters & date helpers
│   ├── App.tsx                # Main application orchestrator & tab controller
│   ├── index.css              # Tailwind CSS imports and custom design tokens
│   └── main.tsx               # React application entrypoint
├── .env.example               # Environment variable template
├── package.json               # Dependencies and build scripts
├── tsconfig.json              # TypeScript root configuration
├── vite.config.ts             # Vite bundler configuration
└── wrangler.toml              # Cloudflare deployment settings
```

---

## 📄 License

Private & proprietary — designed for personal and family household expense tracking.

# ExpenseTracker

<div align="center">

![ExpenseTracker Banner](public/favicon.svg)

### Multi-Domain Household, Travel & Business Expense Tracking PWA

A fast, offline-capable Progressive Web App built to log everyday household spending, vacation & trip costs, and business/office operations. Built as a sibling application to **HomeTracker**, **AutoTrack**, and **Statements PWA**, writing directly to a unified Firestore ledger with seamless cross-app entity linking (`trips`, `offices`, `vehicles`, `houses`).

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
- [Target Domains (Family, Travel, Business)](#-target-domains)
- [Category Taxonomies & Subcategories](#-category-taxonomies--subcategories)
- [Entity Linking (Trips & Offices)](#-entity-linking-trips--offices)
- [Key Features](#-key-features)
- [Data Model & Ledger Schema](#-data-model--ledger-schema)
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

**ExpenseTracker** is engineered as the primary expense logging hub of a family tracker ecosystem. All sibling applications share the exact same Firestore collection paths (`users/{uid}/transactions` or `households/{code}/transactions`):

```text
Family Ledger Ecosystem
├── 🚗 AutoTrack (Port 3000)     → Vehicle fleet & maintenance  → "Car - {service} - {year} - {make} {model}"
├── 🏠 HomeTracker (Port 3001)   → Home properties & utilities  → "Home - {category} - {home}"
├── 💳 ExpenseTracker (Port 3004) → Family, Travel & Business   → "Expense - {Target} - {Category} - {Subcategory}"
└── 📊 Statements PWA (Port 3000)→ Bank CSV parser & audit     → Target entities: Properties, Vehicles, Trips, Offices
```

```text
                               ┌────────────────────────────────────────────────┐
                               │             Shared Firestore DB                │
                               │  users/{uid}/transactions  (Personal Mode)     │
                               │  households/{code}/transactions (Shared Mode)  │
                               └───────────────────────┬────────────────────────┘
                                                       │
         ┌─────────────────────┬───────────────────────┼───────────────────────┬─────────────────────┐
         ▼                     ▼                       ▼                       ▼                     ▼
┌───────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│     AutoTrack     │ │   HomeTracker   │ │     ExpenseTracker      │ │   Statements    │ │ Target Entities │
│ (Car Maintenance) │ │(Home & Property)│ │(Family, Travel, Business│ │  (Bank Parsing) │ │(Trips, Offices) │
└───────────────────┘ └─────────────────┘ └─────────────────────────┘ └─────────────────┘ └─────────────────┘
```

> [!NOTE]
> **Unified Read-Side, Guarded Write-Side**: Entries created across sibling apps render seamlessly in ExpenseTracker with source tags (`Home`, `Car`, `Travel`, `Business`) and domain badges. Expense-owned records can be edited and linked directly in ExpenseTracker.

---

## 🎯 Target Domains

ExpenseTracker supports 3 primary expense domains with dedicated category taxonomies and real-world entity associations:

1. **👨‍👩‍👧‍👦 Family & Household**: Everyday groceries, living expenses, personal care, education, childcare, subscriptions, taxes, and income.
2. **✈️ Travel & Trips**: Flights, lodging, car rentals, excursions, dining while traveling, luggage, and travel services — linkable to active **Trips** (e.g., *"Summer in Tokyo"*).
3. **💼 Business & Office**: Office supplies, dev tools & AI software, marketing, professional legal/accounting services, client meals, taxes, licenses, and payroll — linkable to **Offices / Business entities** with automated tax-deductible flags.

---

## 🏷️ Category Taxonomies & Subcategories

### ✈️ Travel Taxonomy
| Category | Subcategories |
| :--- | :--- |
| **Transportation** | Flights · Trains & Buses · Rental Car · Rideshare & Taxi · Public Transit · Ferries · Cruise · Parking |
| **Lodging** | Hotel/Resort · Vacation Rental · Resort Fees |
| **Food & Dining** | Restaurants · Cafes & Coffee · Room Service · Groceries While Traveling · Snacks |
| **Activities & Entertainment** | Tours & Excursions · Attraction Tickets · Events & Shows |
| **Technology** | Travel Adapters & Chargers · Portable Wi-Fi & SIM Cards · Camera & Gear Rentals · Device Repairs · Travel Apps & Software |
| **Shopping** | Souvenirs & Gifts · Duty-Free Shopping · Local Crafts & Goods · Travel Gear & Luggage · Clothing While Traveling |
| **Travel Services & Fees** | Travel Insurance · Visa & Passport Fees · Baggage Fees · Currency Exchange · Travel Agent Fees |

### 👨‍👩‍👧‍👦 Family & Household Taxonomy
| Category | Subcategories |
| :--- | :--- |
| **Food & Groceries** | Groceries · Supermarket · Restaurants · Coffee Shops · Takeout & Delivery · Alcohol & Bars · Bakery & Snacks |
| **Health & Wellness** | Doctor Visits · Dental Care · Vision Care · Pharmacy & Prescriptions · Gym & Fitness · Therapy & Counseling |
| **Personal Care** | Haircuts & Salon · Spa & Massage · Cosmetics & Toiletries · Nails |
| **Shopping** | Clothing & Apparel · Shoes & Footwear · Accessories & Jewelry · Electronics & Gadgets · Home & Furniture · General Merchandise |
| **Digital & Tech** | Domains & Hosting · Software & Apps · AI & Dev Tools · Cloud & Storage · Online Services · Devices & Accessories |
| **Entertainment & Leisure** | Movies & Streaming · Concerts & Events · Hobbies · Books & Magazines · Video Games · Sports & Recreation |
| **Education** | Tuition · Student Loans · Books & Supplies · Courses & Certifications · School Fees · Tutoring |
| **Family & Childcare** | Childcare & Daycare · Kids Activities · School & Camps · Toys & Gear · Elder Care |
| **Pets** | Food & Treats · Vet & Healthcare · Grooming · Pet Supplies · Boarding & Sitting · Medication |
| **Household Supplies** | Cleaning · Paper Goods · Kitchen · Laundry · Storage & Organization · Tools & Hardware |
| **Subscriptions & Memberships** | Streaming & Media · Music & Audio · Cloud Storage & Software · News & Publications · Gym & Fitness Memberships · Warehouse & Retail Clubs · Meal Kits & Food Delivery · Gaming Subscriptions |
| **Personal Finance** | Bank & ATM Fees · Life Insurance · Credit Card Payment · Transfer · Investment & Savings |
| **Gifts & Donations** | Gifts · Charitable Donations · Religious Contributions · Cards & Wrapping |
| **Taxes** | Federal Income Tax · State Income Tax · Estimated Tax Payments · Tax Preparation Fees · IRS Penalties & Interest · Local & City Tax |
| **Income & Refunds** | Salary & Wages · Bonus & Commission · Freelance & Side Income · Investment & Dividends · Rental Income · Tax Refund · Reimbursement · Gifts Received |
| **Insurance** | Health · Dental & Vision · Life · Disability · Umbrella |
| **Other** | Fees & Charges · Cash Withdrawal · Reimbursable · Miscellaneous |

### 💼 Business Taxonomy
| Category | Subcategories |
| :--- | :--- |
| **Office & Supplies** | Office Supplies · Equipment & Hardware · Software & Subscriptions · Printing & Postage · Furniture & Fixtures |
| **Technology & IT** | Computers & Devices · Cloud & Hosting · SaaS & Software Licenses · IT Support & Repairs · Domain & DNS · Data & Cybersecurity |
| **Marketing & Advertising** | Online Advertising · Print Marketing · Website & Hosting · Social Media Tools · Signage & Photography · Staging & Promotional |
| **Professional Services** | Legal Fees · Accounting & Bookkeeping · Consulting Fees · Bank & Merchant Fees |
| **Travel & Meals** | Business Travel · Client Meals · Conferences & Events · Lodging & Transport |
| **Dues & Subscriptions** | MLS Dues & Fees · Realtor / Trade Association Dues · Industry Subscriptions · Professional Memberships · Board Dues |
| **Professional Development** | Continuing Education (CE) · Professional Licensing · Certifications & Exams · Seminars & Workshops · Training & Coaching |
| **Commissions & Fees** | Broker Commission Split · Broker Desk Fees · Brokerage Admin Fees · Referral & Finder Fees · Closing & Transaction Fees |
| **Taxes & Licenses** | Business Taxes · Licenses & Permits · Business Insurance |
| **Payroll & Contractors** | Employee Payroll · Contractor Payments · Employee Benefits |
| **Business Income** | Client Payments · Product Sales · Interest Income · Refunds & Reimbursements · Loans & Financing · Grants & Subsidies · Owner Contribution |
| **Other Business** | Bank Charges · Miscellaneous Expense |

---

## 🔗 Entity Linking (Trips & Offices)

- **Trips (`households/{code}/trips`)**: Logged travel costs can be attached to any active Trip entity, storing `targetEntityId` and `targetEntityLabel` directly on the transaction. You can select existing trips or create a new trip on the fly.
- **Offices & Businesses (`households/{code}/offices`)**: Business purchases and tech subscriptions can be linked to a specific Office or LLC entity. Selecting Business automatically defaults `isTaxDeductible` to `true`.
- **Vehicle & Home Associations**: Seamlessly transfer or associate entries with CarTracker vehicles (`households/{code}/vehicles`) or HomeTracker houses (`households/{code}/houses`).

---

## 🛠️ Taxonomy & Category Customization (`households/{code}/settings/taxonomy`)

ExpenseTracker includes a full-featured **Domain, Entity & Taxonomy Manager** matching Statements PWA:

- **Dynamic Category Creation**: Add custom categories under any Target (`Family`, `Travel`, `Business`) with custom subcategories.
- **In-Place Renaming**: Rename built-in or custom categories and subcategories on the fly.
- **Soft-Delete & Hide**: Hide unwanted categories or subcategories from pickers without losing historical transaction references.
- **Instant Cloud & Local Sync**: Custom taxonomy changes are saved in Firestore at `households/{code}/settings/taxonomy` and instantly mirror into LocalStorage for full offline resilience.
- **Entity CRUD Hub**: Dedicated manager for Trips, Offices, and Family Members.

---

## ✨ Key Features

- **⚡ Fast, Target-Aware Logging**:
  - Top-level Domain Switcher pills (`Family`, `Travel`, `Business`).
  - Dynamic category & subcategory chip selectors.
  - Autocomplete for frequent vendors and merchants.
  - Smart timestamps and negative amount toggle for refunds / reimbursements.
- **👥 Household Multi-User Sync**:
  - Connect household members with a code (`SMITH2026`).
  - Assign payer and audit tracking per transaction.
- **📊 Real-time Analytics & Domain Slicing**:
  - Filter entire Dashboard, Log, and Insights by Domain Target (`All`, `Family`, `Travel`, `Business`).
  - 6-month spending trends, category distributions, merchant rankings, and member breakdown via Recharts.
- **💳 Custom Payment Method Manager**:
  - Manage personal or shared cards (e.g., *Chase Sapphire*, *Venture X*, *Costco VISA*).
- **📱 Offline-First Progressive Web App (PWA)**:
  - Custom service worker (`sw.js`) and local storage mirror for zero-latency offline operation.
  - Installable on iOS, Android, macOS, and Windows.

---

## 🗄️ Data Model & Ledger Schema

```typescript
interface Transaction {
  id: string;               // e.g. "exp-1718000000000"
  date: string;             // ISO Date: "YYYY-MM-DD"
  time: string;             // 24hr Time: "HH:MM"
  amount: number;           // Dollar amount (e.g. 42.50)
  vendor: string;           // Store, restaurant, merchant, or service provider
  notes?: string;           // Optional notes / descriptions
  category: string;         // Namespaced string: "Expense - Travel - Lodging - Hotel/Resort"
  paymentType: string;      // Payment method identifier
  user: string;             // Name of household member who paid
  isTaxDeductible?: boolean;// Optional tax deductible flag
  target?: 'Family' | 'Travel' | 'Business';
  targetEntityId?: string;  // Trip ID or Office ID
  targetEntityLabel?: string;// Trip name or Office name
}
```

---

## 🛠️ Tech Stack

- **Core & Runtime**: [React 19](https://react.dev/), [TypeScript 6](https://www.typescriptlang.org/), [Node.js](https://nodejs.org/)
- **Bundler & Tooling**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Authentication**: [Firebase Web SDK v12](https://firebase.google.com/) (Auth, Firestore)
- **Charts**: [Recharts 3](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linter**: [oxlint](https://oxc.rs/)
- **Hosting**: [Cloudflare Pages & Workers](https://pages.cloudflare.com/)

---

## 🚀 Getting Started

```bash
# Clone & install dependencies
git clone https://github.com/your-username/ExpenseTracker.git
cd ExpenseTracker
npm install

# Start development server
npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000) or [`http://localhost:3004`](http://localhost:3004).

---

## 📜 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local development server |
| `npm run build` | `tsc -b && vite build` | Type-checks and builds production bundle to `dist/` |
| `npm run preview` | `vite preview` | Serves local preview of production build |
| `npm run lint` | `oxlint` | Rust-powered ultra-fast lint check |
| `npm run icons` | `node scripts/generate-icons.mjs` | Regenerates PWA icon assets from `public/favicon.svg` |

---

## 🚀 Deployment

```bash
npm run build
npx wrangler deploy
```

---

## 📂 Project Structure

```text
ExpenseTracker/
├── public/                    # Static PWA assets, manifest & service worker
│   ├── favicon.svg            # Source vector icon
│   ├── manifest.json          # Web app manifest
│   └── sw.js                  # Service worker caching strategy
├── scripts/                   # Icon generator and migration scripts
│   └── generate-icons.mjs     # Standalone SVG-to-PNG rasterizer
├── src/
│   ├── components/
│   │   ├── Auth/              # Login screen & Google Auth
│   │   ├── Dashboard/         # Quick add tiles with domain switcher & summaries
│   │   ├── Expenses/          # Multi-domain form modal, entry rows & detail sheets
│   │   ├── Insights/          # Target-filtered analytics & category distribution
│   │   ├── Layout/            # Header, tab navigation & responsive shell
│   │   ├── PWA/               # Install prompts
│   │   └── Settings/          # Household code & payment types manager
│   ├── constants/             # Travel, Family & Business category taxonomies
│   ├── services/
│   │   ├── firebase.ts        # Firestore sync for transactions, trips & offices
│   │   └── storage.ts         # LocalStorage caching for offline resilience
│   ├── types/                 # TypeScript interfaces (Transaction, Trip, Office)
│   ├── utils/                 # Namespacing, parsers & formatters
│   ├── App.tsx                # Main application controller & router
│   ├── index.css              # Tailwind CSS imports
│   └── main.tsx               # Entrypoint
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml
```

---

## 📄 License

Private & proprietary — designed for family household, travel, and business expense management.

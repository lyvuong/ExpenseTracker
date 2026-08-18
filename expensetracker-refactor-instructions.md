# Refactor ExpenseTracker's Firestore write pattern to match HomeTracker/AutoTrack

## Context

ExpenseTracker, HomeTracker, and AutoTrack are three sibling PWAs that share one Firestore
project, partitioned by `households/{code}/...`. They all write cost entries into the same
generic ledger collection at `households/{code}/transactions`, which a fourth app (Statements)
reads to build cross-app categorization suggestions. HomeTracker and AutoTrack both follow one
pattern for this; ExpenseTracker currently does something different. Bring ExpenseTracker in
line with the other two.

## The pattern HomeTracker and AutoTrack already use

Every cost entry is written as **two Firestore documents sharing one ID**:

1. **A generic ledger row** at `households/{code}/transactions/{id}` — the same shape every
   app writes, with amount **unsigned** and direction carried by a separate field:

   ```ts
   // HomeTracker's src/types/index.ts — Transaction
   export interface Transaction {
     id: string;
     date: string;   // YYYY-MM-DD
     time: string;   // HH:MM
     amount: number; // always unsigned/positive
     vendor: string;
     notes?: string;
     category: string; // namespaced human-readable string, see below
     paymentType: PaymentType;
     user: string;
     isTaxDeductible?: boolean;
     transactionType?: 'Debit' | 'Credit'; // direction lives here, not in amount's sign
   }
   ```

   AutoTrack's ledger `Transaction` is the same shape minus `transactionType` (AutoTrack has no
   credit/income concept — everything it writes is implicitly a debit).

   The `category` field on this ledger row is a **namespaced, human-readable label** built by a
   small helper, e.g. HomeTracker's `buildTransactionCategory` in `src/utils/homeRecords.ts`:

   ```ts
   // "Home - Utilities - Electricity - Main House" or "Home - Roofing - Main House"
   export const buildTransactionCategory = (
     category: MaintenanceCategory,
     home: Home,
     subcategory?: MaintenanceSubcategory,
     target?: string
   ): string =>
     [target || 'Home', category, subcategory?.trim(), home.nickname].filter(Boolean).join(' - ');
   ```

   This string exists purely so other apps' shared-ledger views can display a readable label —
   it is **not** parsed back into structured data by the owning app itself.

2. **An app-specific detail doc**, same ID, in its own collection, carrying the *structured*
   machine-readable data:
   - HomeTracker: `households/{code}/homeRecords/{id}` — `{ id, homeId, category, subcategory,
     type, ... }` where `category`/`subcategory` are the raw (non-namespaced) values.
   - AutoTrack: `households/{code}/records/{id}` (service/repair — `{ id, vehicleId, category,
     type, ... }`) or `households/{code}/refuels/{id}` (fuel fill-up — `{ id, vehicleId, ... }`,
     no category field at all).

   Example from HomeTracker's `src/App.tsx` save handler (`handleSaveRecord`):

   ```ts
   const newRecord: HomeRecord = {
     id: recordId,
     homeId: targetHomeId,
     target: recTarget,
     category,
     subcategory,
     type: recordData.type || 'Maintenance',
     ...
   };

   const newTransaction: Transaction = {
     id: recordId,
     date: recordData.date || new Date().toISOString().split('T')[0],
     time: recordData.time || new Date().toTimeString().slice(0, 5),
     amount: Number(recordData.cost) || 0, // unsigned
     vendor: recordData.provider || 'DIY',
     notes: recordData.notes || '',
     category: buildTransactionCategory(category, home, subcategory, recTarget),
     paymentType: recordData.paymentType || 'Cash',
     user: auditInfo?.displayName || 'Home Owner',
     isTaxDeductible: recordData.isTaxDeductible ?? false,
     transactionType: recordData.transactionType || 'Debit'
   };

   // both written, same id, on save:
   saveFirestoreRecord(user.uid, newRecord, familyCode);       // detail doc
   saveFirestoreTransaction(user.uid, newTransaction, familyCode); // ledger row
   ```

   Deletes remove both documents together (see HomeTracker's `handleDeleteRecord`).

## What ExpenseTracker currently does instead

It writes **one self-contained document** directly to `households/{code}/transactions/{id}` —
no paired detail doc. Everything lives on that single row (see
`src/types/index.ts` → `Transaction`, and `src/App.tsx` → `handleSaveExpense`):

```ts
export interface Transaction {
  id: string;
  date: string;
  time: string;
  amount: number; // SIGNED — positive = expense/debit, negative = refund/credit
  vendor: string;
  notes?: string;
  category: string; // namespaced: "Expense - Family - Food & Groceries - Supermarket"
  paymentType: PaymentType;
  user: string;
  isTaxDeductible?: boolean;
  target?: Target;              // 'Family' | 'Travel' | 'Business'
  targetEntityId?: string;
  targetEntityLabel?: string;
}
```

Two concrete differences from the shared pattern:
- **Amount sign**: ExpenseTracker encodes direction in the sign of `amount` (positive=expense,
  negative=refund). HomeTracker/AutoTrack keep `amount` unsigned and put direction in
  `transactionType`.
- **No paired detail doc**: `target`, `targetEntityId`, `targetEntityLabel`, and the parsed
  category/subcategory all live only on the ledger row, with the raw category/subcategory
  embedded inside the namespaced `category` string rather than in a separate structured doc.

## What to change

1. **Add a new paired detail-doc collection**, e.g. `households/{code}/expenseRecords/{id}`,
   sharing the same doc ID as the ledger row. It should carry the structured data currently
   crammed into the ledger row and the namespaced category string:
   ```ts
   interface ExpenseRecord {
     id: string;
     target: Target;             // 'Family' | 'Travel' | 'Business'
     targetEntityId?: string;
     targetEntityLabel?: string;
     category: string;           // raw leaf category, e.g. "Food & Groceries" — not namespaced
     subcategory?: string;       // raw leaf subcategory
   }
   ```
   Add `saveFirestoreExpenseRecord` / `deleteFirestoreExpenseRecord` helpers in
   `src/services/firebase.ts`, mirroring HomeTracker's `saveFirestoreRecord` /
   `deleteFirestoreRecord`.

2. **Change the ledger `Transaction.amount` to unsigned, and add `transactionType: 'Debit' |
   'Credit'`** to match HomeTracker's ledger shape exactly (do NOT introduce a third
   convention — reuse `'Debit' | 'Credit'` literally, since that's what HomeTracker and
   Statements' matcher already expect). Keep writing a namespaced human-readable `category`
   string on the ledger row too (via a `buildTransactionCategory`-style helper, same idea as
   HomeTracker's), since that's what makes the entry readable in other apps' shared-ledger
   views — just derive it, don't rely on it for anything structured.

3. **Update `handleSaveExpense` in `src/App.tsx`** (and any edit/import paths that write
   transactions — `handleUpdateEntry`/whatever the categorization-edit path is called, plus the
   backup-import path) to write **both** documents together, same ID, mirroring HomeTracker's
   `handleSaveRecord`. Deletes must remove both docs together too.

4. **Update every read site that currently trusts the ledger row's signed `amount` or parses the
   namespaced `category` for ExpenseTracker's own entries** — grep hits from a quick scan of the
   current repo:
   - `src/utils/transactions.ts` (`parseTransaction`, `toExpenseCategory`,
     `toExpenseSubcategory`, `buildTransactionCategory`)
   - `src/components/Dashboard/Dashboard.tsx`
   - `src/components/Expenses/EntryDetailSheet.tsx`
   - `src/components/Expenses/EntryRow.tsx`
   - `src/components/Expenses/ExpenseList.tsx`
   - `src/components/Expenses/ExpenseFormModal.tsx` (the refund toggle currently flips the sign
     of `amountText` — change it to set `transactionType` instead, same as how HomeTracker's
     form presumably has a Debit/Credit selector)
   - `src/components/Insights/Insights.tsx`

   These need to join the ledger row with its `expenseRecords` detail doc (same pattern as
   HomeTracker's own `homeRecords` join) to reconstruct target/category/subcategory, and use
   `transactionType`/unsigned `amount` instead of the sign of `amount`.

5. **Preserve HomeTracker/AutoTrack entries' existing read path unchanged** — ExpenseTracker's
   `parseTransaction` already handles displaying *other* apps' namespaced `"Home - ..."` /
   `"Car - ..."` ledger rows read-only; that logic only needs to change for ExpenseTracker's
   *own* entries (`"Expense - ..."` prefix), not the others.

6. **Handle existing data**: there are already-written ExpenseTracker entries in Firestore under
   the old signed-amount, no-detail-doc shape. Decide (and say which you picked) whether to:
   - migrate them in place (write a one-time script that reads every `households/{code}/
     transactions` doc with an `"Expense - "` category prefix, unsigned the amount, sets
     `transactionType`, and writes a matching `expenseRecords` doc), or
   - support reading both the old and new shape at the read sites listed in step 4 going
     forward, with all new writes using the new shape only.
   Prefer the migration if it's low-risk — it avoids permanently carrying two read paths.

## Acceptance check

After the refactor, a new expense saved in ExpenseTracker should show up in Firestore as two
docs with the same ID:
- `households/{code}/transactions/{id}` — unsigned `amount`, `transactionType: 'Debit'|'Credit'`,
  namespaced `category` string, no `target`/`targetEntityId`/`targetEntityLabel` fields.
- `households/{code}/expenseRecords/{id}` — `target`, `targetEntityId`, `targetEntityLabel`,
  raw `category`, raw `subcategory`.

And ExpenseTracker's own UI (dashboard totals, entry list, edit modal, insights) should behave
identically to before — this is a storage-shape refactor, not a feature change.

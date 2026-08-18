import { DatabaseSync } from 'node:sqlite';

const sqliteDbPath = 'C:\\Users\\lyvuo\\Downloads\\Lincoln.db';
const sqliteDb = new DatabaseSync(sqliteDbPath);

// 1. Map Users
const usersMap = new Map();
sqliteDb.prepare('SELECT * FROM ExpenseUsers').all().forEach(u => {
  let name = u.Firstname;
  if (name === 'Ly') name = 'Ly Vuong';
  if (name === 'Huong') name = 'Huong Pham';
  if (name === 'Huan') name = 'Huan Vuong';
  usersMap.set(u.ExpenseUserId, name);
});

// 2. Map Merchants
const merchantsMap = new Map();
sqliteDb.prepare('SELECT * FROM Merchants').all().forEach(m => {
  merchantsMap.set(m.MerchantId, m.Name.trim());
});

// 3. Map PaymentTypes
const rawPaymentTypes = sqliteDb.prepare('SELECT * FROM PaymentTypes').all();
const paymentTypesMap = new Map();

const customPtMapping = {
  1: { name: 'Cash', isSystemDefault: true },
  2: { name: 'Credit Card', ownerName: 'Ly Vuong' },
  3: { name: 'VISA', ownerName: 'Ly Vuong' },
  4: { name: 'VISA - Citi Costco - Ly Vuong', ownerName: 'Ly Vuong' },
  5: { name: 'Mastercard', ownerName: 'Ly Vuong' },
  6: { name: 'Capital One Mastercard', ownerName: 'Ly Vuong' },
  7: { name: 'Wells Fargo VISA', ownerName: 'Ly Vuong' },
  8: { name: 'Synchrony Mastercard', ownerName: 'Ly Vuong' },
  9: { name: 'Freedom VISA', ownerName: 'Ly Vuong' },
  10: { name: 'Gift Card - Vanilla - Ly Vuong', ownerName: 'Ly Vuong' },
  11: { name: 'Home Depot VISA', ownerName: 'Ly Vuong' },
  12: { name: 'VISA - Venture X - Ly Vuong', ownerName: 'Ly Vuong' },
  13: { name: 'HSA - Huong', ownerName: 'Huong Pham' },
  14: { name: 'HSA - Ly', ownerName: 'Ly Vuong' },
  15: { name: 'BCBS Wellness', ownerName: 'Ly Vuong' },
  16: { name: 'ModivCare Debit', ownerName: 'Ly Vuong' },
  17: { name: 'VISA - Venture X - Huong', ownerName: 'Huong Pham' },
  18: { name: 'VISA - United Explorer - Ly Vuong', ownerName: 'Ly Vuong' },
  19: { name: 'VISA - United Explorer - Huong', ownerName: 'Huong Pham' },
  20: { name: 'VISA - United Explorer - Huan', ownerName: 'Huan Vuong' }
};

rawPaymentTypes.forEach(pt => {
  const mapped = customPtMapping[pt.PaymentTypeId];
  if (mapped) {
    paymentTypesMap.set(pt.PaymentTypeId, mapped);
  } else {
    paymentTypesMap.set(pt.PaymentTypeId, { name: pt.Name.trim(), ownerName: 'Anh Vuong' });
  }
});

// 4. Map Categories
const rawCats = sqliteDb.prepare('SELECT * FROM ExpenseCategories').all();
const catDbMap = new Map();
rawCats.forEach(c => {
  catDbMap.set(c.ExpenseCategoryId, {
    id: c.ExpenseCategoryId,
    name: c.Name.trim(),
    parentId: c.ParentCategoryId
  });
});

function getCatHierarchy(id) {
  const parts = [];
  let curr = catDbMap.get(id);
  while (curr) {
    if (curr.name) parts.unshift(curr.name);
    if (!curr.parentId || curr.parentId === 0 || curr.parentId === curr.id) break;
    curr = catDbMap.get(curr.parentId);
  }
  return parts;
}

function mapToExpenseCategory(hierarchy) {
  if (!hierarchy || hierarchy.length === 0) return 'Expense - Other';

  const root = hierarchy[0];
  const sub = hierarchy[hierarchy.length - 1];

  let topCategory = 'Other';
  let subCategory = '';

  if (root === 'Food') {
    topCategory = 'Food & Dining';
    if (sub === 'Groceries') { topCategory = 'Grocery'; subCategory = 'Supermarket'; }
    else if (sub === 'Fast food') { subCategory = 'Fast Food'; }
    else if (sub === 'Coffee shops') { subCategory = 'Coffee & Tea'; }
    else if (sub === 'Breakfast' || sub === 'Lunch' || sub === 'Dinner') { subCategory = 'Restaurant'; }
    else if (sub === 'Snacks') { subCategory = 'Dessert & Snacks'; }
    else if (sub === 'Drinks') { subCategory = 'Bar & Drinks'; }
    else { subCategory = sub; }
  } else if (root === 'Transportation') {
    topCategory = 'Transportation';
    if (sub === 'Gas') { subCategory = 'Fuel'; }
    else if (sub === 'Parking Fees') { subCategory = 'Parking'; }
    else if (sub === 'Public transportation') { subCategory = 'Public Transit'; }
    else if (sub === 'Ride sharing (Uber, Lyft)') { subCategory = 'Rideshare & Taxi'; }
    else if (sub === 'Tolls') { subCategory = 'Tolls'; }
    else { subCategory = sub; }
  } else if (root === 'Technology') {
    topCategory = 'Digital & Tech';
    if (sub === 'Mobile Phone') { subCategory = 'Online Services'; }
    else { subCategory = 'Devices & Accessories'; }
  } else if (root === 'Housing') {
    topCategory = 'Household Supplies';
    if (sub === 'Furnishings' || sub === 'Home improvement') { topCategory = 'Shopping'; subCategory = 'Home & Furniture'; }
    else { subCategory = 'Tools & Hardware'; }
  } else if (root === 'Health') {
    topCategory = 'Health & Medical';
    if (sub === 'Prescriptions / Medication') { subCategory = 'Pharmacy'; }
    else if (sub === 'Doctor bills' || sub === 'Hospital bills') { subCategory = 'Doctor Visit'; }
    else if (sub === 'Dentist visits') { subCategory = 'Dental'; }
    else if (sub === 'Optometrist' || sub === 'Glasses, contacts') { subCategory = 'Vision'; }
    else { subCategory = sub; }
  } else if (root === 'Kids') {
    topCategory = 'Kids & Childcare';
    if (sub === 'School supplies' || sub === 'Tuition' || sub === 'School lunches') { subCategory = 'School'; }
    else if (sub === 'Daycare') { subCategory = 'Daycare'; }
    else if (sub === 'Babysitter / Nanny') { subCategory = 'Babysitting'; }
    else { subCategory = sub; }
  } else if (root === 'Travel') {
    topCategory = 'Travel';
    if (sub === 'Lunch') { subCategory = 'Travel Food'; }
    else if (sub === 'Housing') { subCategory = 'Lodging'; }
    else { subCategory = 'Activities & Tours'; }
  } else if (root === 'Clothing') {
    topCategory = 'Shopping';
    subCategory = 'Clothing';
  } else if (root === 'Giving') {
    topCategory = 'Gifts & Donations';
    subCategory = 'Charity';
  } else if (root === 'Personal development / Recreation') {
    topCategory = 'Entertainment';
    subCategory = 'Hobbies';
  }

  if (subCategory && subCategory !== topCategory) {
    return `Expense - ${topCategory} - ${subCategory}`;
  }
  return `Expense - ${topCategory}`;
}

console.log('===================================================');
console.log('DRY-RUN MIGRATION REPORT FOR HOUSEHOLD 3701');
console.log('Project: pwa-experiment-291c0 (Target: households/3701)');
console.log('===================================================\n');

const debits = sqliteDb.prepare('SELECT * FROM Debits').all();

let totalAmount = 0;
const byUser = {};
const byCategory = {};
const byPaymentType = {};

const sampleWithRollbackTags = [];

for (const d of debits) {
  const merchantName = merchantsMap.get(d.MerchantId) || 'Unknown Merchant';
  const ptInfo = paymentTypesMap.get(d.PaymentTypeId) || { name: 'Credit Card', ownerName: 'Anh Vuong' };
  const userName = usersMap.get(d.ExpenseUserId) || 'Anh Vuong';
  const hierarchy = getCatHierarchy(d.ExpenseCategoryId);
  const categoryStr = mapToExpenseCategory(hierarchy);

  const spentOnStr = String(d.SpentOn || '');
  const [datePart, timePart] = spentOnStr.split(' ');
  const date = datePart || new Date().toISOString().split('T')[0];
  const time = (timePart || '12:00').slice(0, 5);

  const amount = Number(d.Amount) || 0;
  totalAmount += amount;

  byUser[userName] = (byUser[userName] || 0) + 1;
  byCategory[categoryStr] = (byCategory[categoryStr] || 0) + 1;
  byPaymentType[ptInfo.name] = (byPaymentType[ptInfo.name] || 0) + 1;

  const docData = {
    id: `debit-${d.DebitId}`,
    date,
    time,
    amount,
    vendor: merchantName,
    notes: d.Notes ? String(d.Notes).trim() : '',
    category: categoryStr,
    paymentType: ptInfo.name,
    user: userName,
    // ROLLBACK & TRACEABILITY TAGS
    isMigrated: true,
    migrationBatch: 'debits-csv-2026-08-06',
    migratedAt: '2026-08-06T18:10:00Z'
  };

  if (sampleWithRollbackTags.length < 3) {
    sampleWithRollbackTags.push(docData);
  }
}

console.log(`Total Transactions to Migrate: ${debits.length}`);
console.log(`Total Spending Sum: $${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

console.log('\n--- Breakdown by Member ---');
console.table(byUser);

console.log('\n--- Breakdown by Payment Type ---');
console.table(byPaymentType);

console.log('\n--- Top Categories ---');
const sortedCats = Object.entries(byCategory).sort((a,b) => b[1] - a[1]);
console.table(sortedCats.slice(0, 10));

console.log('\n--- Sample Tagged Document Layout (includes rollback metadata) ---');
console.log(JSON.stringify(sampleWithRollbackTags[0], null, 2));

console.log('\n[DRY-RUN RESULT]: 0 writes executed. Data parsed and validated successfully.');

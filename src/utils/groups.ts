import type { LedgerEntry } from '../types';

export type GroupKind = 'Trip' | 'Office' | 'Family member' | 'Car' | 'Home';

export const GROUP_KINDS: GroupKind[] = ['Trip', 'Car', 'Home', 'Office', 'Family member'];

export interface EntryGroup {
  key: string;
  kind: GroupKind;
  name: string;
  total: number; // net: debits minus credits
  count: number;
  firstDate: string;
  lastDate: string;
  byCategory: { name: string; value: number }[];
  entries: LedgerEntry[]; // newest first
}

/** Decide which group (if any) a ledger entry belongs to. */
export const groupOf = (e: LedgerEntry): { kind: GroupKind; name: string; id: string } | null => {
  if (e.source === 'Car') {
    const name = e.detail || 'Unassigned vehicle';
    return { kind: 'Car', name, id: name };
  }
  if (e.source === 'Home') {
    const name = e.detail || 'Unassigned home';
    return { kind: 'Home', name, id: name };
  }
  if (e.source !== 'Expense') return null;
  const name = e.targetEntityLabel;
  if (!name) return null;
  const id = e.targetEntityId || name;
  if (e.target === 'Travel') return { kind: 'Trip', name, id };
  if (e.target === 'Business') return { kind: 'Office', name, id };
  if (e.target === 'Family') return { kind: 'Family member', name, id };
  return null;
};

export const buildGroups = (entries: LedgerEntry[]): EntryGroup[] => {
  const map = new Map<string, EntryGroup>();
  for (const e of entries) {
    const g = groupOf(e);
    if (!g) continue;
    const key = `${g.kind}::${g.id}`;
    let grp = map.get(key);
    if (!grp) {
      grp = { key, kind: g.kind, name: g.name, total: 0, count: 0, firstDate: e.date, lastDate: e.date, byCategory: [], entries: [] };
      map.set(key, grp);
    }
    grp.total += e.amount;
    grp.count += 1;
    if (e.date < grp.firstDate) grp.firstDate = e.date;
    if (e.date > grp.lastDate) grp.lastDate = e.date;
    grp.entries.push(e);
  }
  return Array.from(map.values()).map(g => {
    const cat = new Map<string, number>();
    g.entries.forEach(e => cat.set(e.label, (cat.get(e.label) || 0) + e.amount));
    g.byCategory = Array.from(cat.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
    g.total = Math.round(g.total * 100) / 100;
    g.entries.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
    return g;
  });
};

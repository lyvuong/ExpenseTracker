import type { LedgerEntry, Trip } from '../types';

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
  /** Date used to place the group in a year bucket: a trip's start date, else its first entry. */
  anchorDate: string;
}

/** Decide which group (if any) a ledger entry belongs to. */
export const groupOf = (
  e: LedgerEntry,
  trips: Trip[] = []
): { kind: GroupKind; name: string; id: string; anchorDate?: string } | null => {
  if (e.source === 'Car') {
    const name = e.detail || 'Unassigned vehicle';
    return { kind: 'Car', name, id: name };
  }
  if (e.source === 'Home') {
    const name = e.detail || 'Unassigned home';
    return { kind: 'Home', name, id: name };
  }
  if (e.source !== 'Expense') return null;
  if (e.target === 'Travel') {
    // Resolve against the trips list so every Travel entry lands on the right trip, matching
    // Statements: by id first, else (id-less legacy rows) by a unique trip-name match.
    const label = (e.targetEntityLabel || '').trim().toLowerCase();
    const trip = e.targetEntityId
      ? trips.find(t => t.id === e.targetEntityId)
      : label && trips.filter(t => t.name.trim().toLowerCase() === label).length === 1
        ? trips.find(t => t.name.trim().toLowerCase() === label)
        : undefined;
    if (trip) return { kind: 'Trip', name: trip.name, id: trip.id, anchorDate: trip.startDate };
  }
  const name = e.targetEntityLabel;
  if (!name) return null;
  const id = e.targetEntityId || name;
  if (e.target === 'Travel') return { kind: 'Trip', name, id };
  if (e.target === 'Business') return { kind: 'Office', name, id };
  if (e.target === 'Family') return { kind: 'Family member', name, id };
  return null;
};

export const buildGroups = (entries: LedgerEntry[], trips: Trip[] = []): EntryGroup[] => {
  const map = new Map<string, EntryGroup>();
  for (const e of entries) {
    const g = groupOf(e, trips);
    if (!g) continue;
    const key = `${g.kind}::${g.id}`;
    let grp = map.get(key);
    if (!grp) {
      grp = { key, kind: g.kind, name: g.name, total: 0, count: 0, firstDate: e.date, lastDate: e.date, byCategory: [], entries: [], anchorDate: g.anchorDate || e.date };
      map.set(key, grp);
    }
    grp.total += e.amount;
    grp.count += 1;
    if (e.date < grp.firstDate) {
      grp.firstDate = e.date;
      if (!g.anchorDate) grp.anchorDate = e.date;
    }
    if (e.date > grp.lastDate) grp.lastDate = e.date;
    grp.entries.push(e);
  }

  // Fuel rule (mirrors Statements): Car fuel purchases dated within a trip's start–end window count
  // toward that trip, unless the trip opts out. Date-matched rather than linked, so the same entry
  // also stays in its Car group, and overlapping trips each count it.
  const fuelEntries = entries.filter(e => e.source === 'Car' && e.label === 'Fuel' && !!e.date);
  for (const trip of trips) {
    if (trip.excludeFuelFromCost || !trip.startDate || !trip.endDate) continue;
    const matches = fuelEntries.filter(e => e.date >= trip.startDate! && e.date <= trip.endDate!);
    if (matches.length === 0) continue;
    const key = `Trip::${trip.id}`;
    let grp = map.get(key);
    if (!grp) {
      grp = { key, kind: 'Trip', name: trip.name, total: 0, count: 0, firstDate: matches[0].date, lastDate: matches[0].date, byCategory: [], entries: [], anchorDate: trip.startDate };
      map.set(key, grp);
    }
    for (const e of matches) {
      grp.total += e.amount;
      grp.count += 1;
      if (e.date < grp.firstDate) grp.firstDate = e.date;
      if (e.date > grp.lastDate) grp.lastDate = e.date;
      grp.entries.push(e);
    }
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

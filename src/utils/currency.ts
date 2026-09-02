export interface CurrencyOption {
  code: string;
  name: string;
}

// Common travel currencies. Frankfurter (ECB-sourced) covers all of these.
export const CURRENCIES: CurrencyOption[] = [
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'ILS', name: 'Israeli Shekel' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'USD', name: 'US Dollar' }
];

export interface ConversionResult {
  usd: number;
  rate: number; // USD per 1 unit of the source currency
}

/**
 * Converts a foreign-currency amount to USD using Frankfurter (free, no API
 * key, ECB-sourced daily rates, supports the entry's date for a historical
 * rate). Falls back to open.er-api.com (latest rate only) if Frankfurter is
 * unreachable. Returns null if both fail so callers can fall back to manual
 * entry — this app also needs to work offline.
 */
export const convertToUSD = async (
  amount: number,
  currency: string,
  isoDate: string
): Promise<ConversionResult | null> => {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (currency === 'USD') return { usd: amount, rate: 1 };

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  // Frankfurter has no data for future dates or before ~1999 — fall back to the latest rate.
  const dateSegment = isoDate && isoDate <= todayISO && isoDate >= '1999-01-01' ? isoDate : 'latest';

  try {
    const res = await fetch(
      `https://api.frankfurter.app/${dateSegment}?amount=${amount}&from=${currency}&to=USD`
    );
    if (res.ok) {
      const data = await res.json();
      const usd = data?.rates?.USD;
      if (typeof usd === 'number' && Number.isFinite(usd)) {
        return { usd, rate: usd / amount };
      }
    }
  } catch {
    // fall through to the backup provider below
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.USD;
    if (typeof rate !== 'number' || !Number.isFinite(rate)) return null;
    return { usd: Math.round(amount * rate * 100) / 100, rate };
  } catch {
    return null;
  }
};

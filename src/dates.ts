/**
 * Dates are stored as local "YYYY-MM-DD" keys. They sort correctly as strings,
 * so `a < b` means "a is an earlier day than b".
 */
export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(now: Date = new Date()): DateKey {
  return toKey(now);
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

/** 0 = Sunday … 6 = Saturday */
export function weekdayOf(key: DateKey): number {
  return fromKey(key).getDay();
}

/** Weeks start on Monday. */
export function weekStart(key: DateKey): DateKey {
  return addDays(key, -((weekdayOf(key) + 6) % 7));
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** Monday-first order used by the UI. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "Sunday, 18 October" */
export function formatLong(key: DateKey): string {
  const d = fromKey(key);
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "8:05 PM" */
export function formatTime(hour: number, minute: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${pad(minute)} ${suffix}`;
}

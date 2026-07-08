// All "which calendar day is this" logic for booking goes through the clinic's
// own timezone, never the browser's. Mixing browser-local Date methods
// (getDate/setDate) with UTC-based ISO strings for the *same* logical day is
// exactly what caused a patient's selected date to silently differ from what
// got stored (label built from local time, value built from UTC time).
export const CLINIC_TIMEZONE = "Europe/Tirane";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dayNumberFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CLINIC_TIMEZONE,
  day: "numeric",
});
const weekdayShortFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CLINIC_TIMEZONE,
  weekday: "short",
});
const monthYearFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CLINIC_TIMEZONE,
  month: "long",
  year: "numeric",
});

// "YYYY-MM-DD" in the clinic's timezone — the single source of truth for what
// calendar day an instant belongs to, matching how the backend stores dates.
export function toClinicDateKey(d: Date): string {
  return dateKeyFormatter.format(d); // en-CA gives YYYY-MM-DD directly
}

export function clinicDayNumber(d: Date): string {
  return dayNumberFormatter.format(d);
}

export function clinicWeekdayShort(d: Date): string {
  return weekdayShortFormatter.format(d);
}

export function clinicMonthYearLabel(d: Date): string {
  return monthYearFormatter.format(d);
}

// day-of-week (0=Sun..6=Sat) for a date key, computed via a UTC-midnight
// Date constructed from the key — safe because the key itself already
// encodes the clinic's calendar day, so no further timezone conversion applies.
export function dateKeyWeekday(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
}

export function addDaysToKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Pure string parsing — no Date/timezone conversion at all, since the key
// itself already IS the trusted clinic-local calendar date.
export function dateKeyDayNumber(dateKey: string): number {
  return Number(dateKey.slice(8, 10));
}

export function dateKeyWeekdayShort(dateKey: string): string {
  return WEEKDAY_SHORT[dateKeyWeekday(dateKey)];
}

export function startOfMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

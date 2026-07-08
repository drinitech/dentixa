export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export interface TimeRange {
  time: string;
  durationMinutes: number;
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  const aStart = timeToMinutes(a.time);
  const aEnd = aStart + a.durationMinutes;
  const bStart = timeToMinutes(b.time);
  const bEnd = bStart + b.durationMinutes;
  return aStart < bEnd && bStart < aEnd;
}

const clinicNowFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: process.env.CLINIC_TIMEZONE || "UTC",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// The clinic's own wall-clock "now" — the server's TZ (Render defaults to
// UTC) and the patient's browser TZ are both irrelevant to "is this slot in
// the past"; only the clinic's local time matters.
export function getClinicNow(): { dateKey: string; minutesOfDay: number } {
  const parts = clinicNowFormatter.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const dateKey = `${get("year")}-${get("month")}-${get("day")}`;
  const minutesOfDay = Number(get("hour")) * 60 + Number(get("minute"));
  return { dateKey, minutesOfDay };
}

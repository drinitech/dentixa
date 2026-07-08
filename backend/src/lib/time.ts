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

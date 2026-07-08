function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatIcsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// `date` is a UTC-midnight Date (Prisma @db.Date) and `time` is "HH:mm" —
// combine them into a real instant for DTSTART/DTEND.
function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes));
}

interface IcsEventInput {
  uid: string;
  date: Date;
  time: string;
  durationMinutes: number;
  summary: string;
  description?: string | null;
  createdAt: Date;
}

export function buildIcsEvent(input: IcsEventInput): string {
  const start = combineDateAndTime(input.date, input.time);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);

  return [
    "BEGIN:VEVENT",
    `UID:${input.uid}@dentixa`,
    `DTSTAMP:${formatIcsTimestamp(input.createdAt)}`,
    `DTSTART:${formatIcsTimestamp(start)}`,
    `DTEND:${formatIcsTimestamp(end)}`,
    `SUMMARY:${escapeIcsText(input.summary)}`,
    input.description ? `DESCRIPTION:${escapeIcsText(input.description)}` : undefined,
    "END:VEVENT",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\r\n");
}

export function buildIcsCalendar(events: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dentixa//Appointments//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

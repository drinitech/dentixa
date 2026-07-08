"use client";

import { cn } from "@/lib/utils";

function toDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DateStrip({
  value,
  onChange,
  days = 21,
}: {
  value: string | null;
  onChange: (date: string) => void;
  days?: number;
}) {
  const today = new Date();
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {dates.map((d) => {
        const iso = toDateOnly(d);
        const isSelected = value === iso;
        const isToday = isSameDay(d, today);
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onChange(iso)}
            className={cn(
              "flex shrink-0 flex-col items-center gap-0.5 rounded-lg border px-3.5 py-2.5 text-center transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-foreground hover:bg-muted",
            )}
          >
            <span className={cn("text-[11px] uppercase tracking-wide", isSelected ? "opacity-80" : "text-muted-foreground")}>
              {isToday ? "Today" : d.toLocaleDateString("en-GB", { weekday: "short" })}
            </span>
            <span className="text-sm font-semibold">{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}

function isSameDay(d: Date, today: Date) {
  return d.toDateString() === today.toDateString();
}

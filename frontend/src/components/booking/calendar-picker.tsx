"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addDaysToKey,
  clinicMonthYearLabel,
  dateKeyWeekday,
  daysInMonth,
  toClinicDateKey,
} from "@/lib/clinic-date";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dateKey: string) => void;
}) {
  const todayKey = useMemo(() => toClinicDateKey(new Date()), []);
  const [todayYear, todayMonth] = todayKey.split("-").map(Number);
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth - 1); // 0-indexed

  function goToMonth(delta: number) {
    let month = viewMonth + delta;
    let year = viewYear;
    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }
    setViewMonth(month);
    setViewYear(year);
  }

  const cells = useMemo(() => {
    const firstOfMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
    const leadingBlanks = dateKeyWeekday(firstOfMonthKey);
    const totalDays = daysInMonth(viewYear, viewMonth);

    const days: { key: string; day: number }[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const key = addDaysToKey(firstOfMonthKey, d - 1);
      days.push({ key, day: d });
    }
    return { leadingBlanks, days };
  }, [viewYear, viewMonth]);

  const monthLabel = clinicMonthYearLabel(new Date(`${cells.days[0]?.key ?? todayKey}T12:00:00.000Z`));
  const canGoPrev = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}` > todayKey.slice(0, 7);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          aria-label="Next month"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_HEADERS.map((w) => (
          <div key={w} className="py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {w}
          </div>
        ))}

        {Array.from({ length: cells.leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {cells.days.map(({ key, day }) => {
          const isPast = key < todayKey;
          const isToday = key === todayKey;
          const isSelected = key === value;

          return (
            <button
              key={key}
              type="button"
              disabled={isPast}
              onClick={() => onChange(key)}
              className={cn(
                "flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors",
                isPast && "text-muted-foreground/40 cursor-not-allowed",
                !isPast && !isSelected && "text-foreground hover:bg-muted",
                isToday && !isSelected && "ring-1 ring-primary/50",
                isSelected && "bg-primary text-primary-foreground",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

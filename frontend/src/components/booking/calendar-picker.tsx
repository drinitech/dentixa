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

const WEEKDAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
    <div className="w-full max-w-[19rem] rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors",
            "hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
            "disabled:pointer-events-none disabled:opacity-25",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-base font-semibold tracking-tight text-foreground">{monthLabel}</p>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_HEADERS.map((w, i) => (
          <div key={`${w}-${i}`} className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
            <div key={key} className="flex items-center justify-center py-0.5">
              <button
                type="button"
                disabled={isPast}
                onClick={() => onChange(key)}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-150",
                  isPast && "cursor-not-allowed text-muted-foreground/35",
                  !isPast && !isSelected && "text-foreground hover:scale-105 hover:bg-accent hover:text-accent-foreground",
                  isSelected && "scale-105 bg-primary font-semibold text-primary-foreground shadow-sm",
                )}
              >
                {day}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-primary bg-transparent" /> Today
        </span>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import { useAppointments } from "@/hooks/use-appointments";
import type { Appointment } from "@/types";

function startOfWeek(offset: number) {
  const now = new Date();
  const day = now.getDay();
  const d = new Date(now);
  d.setDate(now.getDate() - day + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function DoctorCalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => startOfWeek(weekOffset), [weekOffset]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 86400000)),
    [weekStart],
  );
  const weekEnd = weekDays[6];

  const { data, isLoading } = useAppointments({
    status: "APPROVED",
    from: toDateOnly(weekStart),
    to: toDateOnly(weekEnd),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const day of weekDays) map.set(toDateOnly(day), []);
    for (const appt of data?.appointments ?? []) {
      const key = appt.date.slice(0, 10);
      map.get(key)?.push(appt);
    }
    return map;
  }, [data, weekDays]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My calendar"
        description="Confirmed appointments for the selected week."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-foreground">
              {formatDate(weekStart)} – {formatDate(weekEnd)}
            </span>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <PageLoading />
      ) : (data?.appointments.length ?? 0) === 0 ? (
        <EmptyState icon={CalendarDays} title="No confirmed appointments this week" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {weekDays.map((day) => {
            const key = toDateOnly(day);
            const appts = byDay.get(key) ?? [];
            const isToday = key === toDateOnly(new Date());
            return (
              <Card key={key} className={cn("p-3", isToday && "ring-1 ring-primary")}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {day.toLocaleDateString("en-GB", { weekday: "short" })}
                </p>
                <p className="mb-2 text-sm font-semibold text-foreground">{day.getDate()}</p>
                <div className="space-y-1.5">
                  {appts.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
                  {appts.map((appt) => (
                    <div key={appt.id} className="rounded-md bg-status-approved/10 px-2 py-1 text-xs text-foreground">
                      <span className="font-medium">{appt.time}</span> {appt.patient.name}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CalendarDays, Copy } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";
import {
  addDaysToKey,
  dateKeyDayNumber,
  dateKeyWeekday,
  dateKeyWeekdayShort,
  toClinicDateKey,
} from "@/lib/clinic-date";
import { useAppointments } from "@/hooks/use-appointments";
import { useCalendarToken } from "@/hooks/use-calendar";
import { useAuth } from "@/lib/auth-context";
import { API_URL } from "@/lib/api-client";
import type { Appointment } from "@/types";

export default function DoctorCalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const { user } = useAuth();
  const { data: tokenData } = useCalendarToken(subscribeOpen);
  const feedUrl =
    user && tokenData ? `${API_URL}/doctors/${user.id}/calendar.ics?token=${tokenData.token}` : null;

  async function copyFeedUrl() {
    if (!feedUrl) return;
    await navigator.clipboard.writeText(feedUrl);
    toast.success("Link copied");
  }

  const todayKey = useMemo(() => toClinicDateKey(new Date()), []);
  const weekStartKey = useMemo(() => {
    const todayWeekday = dateKeyWeekday(todayKey);
    return addDaysToKey(todayKey, -todayWeekday + weekOffset * 7);
  }, [todayKey, weekOffset]);

  const weekDayKeys = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStartKey, i)),
    [weekStartKey],
  );
  const weekEndKey = weekDayKeys[6];

  const { data, isLoading } = useAppointments({
    status: "APPROVED",
    from: weekStartKey,
    to: weekEndKey,
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const key of weekDayKeys) map.set(key, []);
    for (const appt of data?.appointments ?? []) {
      const key = appt.date.slice(0, 10);
      map.get(key)?.push(appt);
    }
    return map;
  }, [data, weekDayKeys]);

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
              {formatDate(weekStartKey)} – {formatDate(weekEndKey)}
            </span>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSubscribeOpen((v) => !v)}>
              Subscribe
            </Button>
          </div>
        }
      />

      {subscribeOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Subscribe from Google Calendar / Outlook</CardTitle>
            <CardDescription>
              Add this link as a calendar subscription to see your confirmed appointments update automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={feedUrl ?? "Loading…"} onFocus={(e) => e.target.select()} />
            <Button variant="outline" onClick={copyFeedUrl} disabled={!feedUrl} className="shrink-0">
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <PageLoading />
      ) : (data?.appointments.length ?? 0) === 0 ? (
        <EmptyState icon={CalendarDays} title="No confirmed appointments this week" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {weekDayKeys.map((key) => {
            const appts = byDay.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <Card key={key} className={cn("p-3", isToday && "ring-1 ring-primary")}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {dateKeyWeekdayShort(key)}
                </p>
                <p className="mb-2 text-sm font-semibold text-foreground">{dateKeyDayNumber(key)}</p>
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

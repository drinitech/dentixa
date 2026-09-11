"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarOff, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinicHolidays, useAddClinicHoliday, useRemoveClinicHoliday } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

export default function AdminHolidaysPage() {
  const { data, isLoading } = useClinicHolidays();
  const addHoliday = useAddClinicHoliday();
  const removeHoliday = useRemoveClinicHoliday();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  async function handleAdd() {
    if (!date) return;
    try {
      await addHoliday.mutateAsync({ date, reason: reason || undefined });
      toast.success("Holiday added");
      setDate("");
      setReason("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add holiday");
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeHoliday.mutateAsync(id);
      toast.success("Holiday removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove holiday");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinic holidays"
        description="Dates the whole clinic is closed — no doctor shows any free slots on these days, regardless of their normal hours."
      />

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="holiday-date">Date</Label>
              <Input id="holiday-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="holiday-reason">Reason (optional)</Label>
              <Input
                id="holiday-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. National holiday"
                maxLength={200}
              />
            </div>
            <Button onClick={handleAdd} disabled={!date || addHoliday.isPending}>
              {addHoliday.isPending ? "Adding…" : "Add"}
            </Button>
          </div>

          {isLoading ? (
            <PageLoading />
          ) : data && data.holidays.length > 0 ? (
            <div className="divide-y divide-border">
              {data.holidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatDate(holiday.date)}</p>
                    {holiday.reason && <p className="text-xs text-muted-foreground">{holiday.reason}</p>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(holiday.id)}
                    disabled={removeHoliday.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarOff} title="No clinic holidays scheduled" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

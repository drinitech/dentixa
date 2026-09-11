"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarOff, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoading } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { ScheduleEditor } from "@/components/doctor/schedule-editor";
import {
  useSchedule,
  useReplaceSchedule,
  useScheduleExceptions,
  useAddException,
  useRemoveException,
} from "@/hooks/use-schedule";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import type { DoctorScheduleWindow } from "@/types";

export default function DoctorSchedulePage() {
  const { data, isLoading } = useSchedule();
  const replaceSchedule = useReplaceSchedule();
  const [windows, setWindows] = useState<DoctorScheduleWindow[]>([]);
  // Derives editable local state from the fetched schedule the first time it
  // arrives, adjusting during render rather than in an effect (data's object
  // identity is stable across re-renders once react-query has it cached).
  const [loadedData, setLoadedData] = useState(data);
  if (data && data !== loadedData) {
    setLoadedData(data);
    setWindows(data.schedule.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })));
  }

  const { data: exceptionsData, isLoading: exceptionsLoading } = useScheduleExceptions();
  const addException = useAddException();
  const removeException = useRemoveException();
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  async function handleSave() {
    try {
      await replaceSchedule.mutateAsync(windows);
      toast.success("Schedule updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update schedule");
    }
  }

  async function handleAddException() {
    if (!newDate) return;
    try {
      await addException.mutateAsync({ date: newDate, reason: newReason || undefined });
      toast.success("Time off added");
      setNewDate("");
      setNewReason("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add time off");
    }
  }

  async function handleRemoveException(id: string) {
    try {
      await removeException.mutateAsync(id);
      toast.success("Time off removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove time off");
    }
  }

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly schedule"
        description="Set the hours you're available each day. Patients can only request slots within these windows."
        action={
          <Button onClick={handleSave} disabled={replaceSchedule.isPending}>
            {replaceSchedule.isPending ? "Saving…" : "Save schedule"}
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-5">
          <ScheduleEditor windows={windows} onChange={setWindows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time off</CardTitle>
          <CardDescription>
            Mark specific dates as unavailable — patients won&apos;t see any free slots on these days, even within
            your normal hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="exception-date">Date</Label>
              <Input
                id="exception-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="exception-reason">Reason (optional)</Label>
              <Input
                id="exception-reason"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="e.g. Holiday"
                maxLength={200}
              />
            </div>
            <Button onClick={handleAddException} disabled={!newDate || addException.isPending}>
              {addException.isPending ? "Adding…" : "Add"}
            </Button>
          </div>

          {exceptionsLoading ? (
            <PageLoading />
          ) : exceptionsData && exceptionsData.exceptions.length > 0 ? (
            <div className="divide-y divide-border">
              {exceptionsData.exceptions.map((exception) => (
                <div key={exception.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatDate(exception.date)}</p>
                    {exception.reason && <p className="text-xs text-muted-foreground">{exception.reason}</p>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveException(exception.id)}
                    disabled={removeException.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarOff} title="No time off scheduled" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/common/loading-spinner";
import { ScheduleEditor } from "@/components/doctor/schedule-editor";
import { useSchedule, useReplaceSchedule } from "@/hooks/use-schedule";
import { ApiError } from "@/lib/api-client";
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

  async function handleSave() {
    try {
      await replaceSchedule.mutateAsync(windows);
      toast.success("Schedule updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update schedule");
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
    </div>
  );
}

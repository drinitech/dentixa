"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DAY_LABELS } from "@/lib/utils";
import type { DoctorScheduleWindow } from "@/types";

export function ScheduleEditor({
  windows,
  onChange,
}: {
  windows: DoctorScheduleWindow[];
  onChange: (windows: DoctorScheduleWindow[]) => void;
}) {
  function addWindow(dayOfWeek: number) {
    onChange([...windows, { dayOfWeek, startTime: "09:00", endTime: "17:00" }]);
  }

  function removeWindow(index: number) {
    onChange(windows.filter((_, i) => i !== index));
  }

  function updateWindow(index: number, field: "startTime" | "endTime", value: string) {
    onChange(windows.map((w, i) => (i === index ? { ...w, [field]: value } : w)));
  }

  return (
    <div className="divide-y divide-border">
      {DAY_LABELS.map((label, dayOfWeek) => {
        const dayWindows = windows
          .map((w, i) => ({ ...w, index: i }))
          .filter((w) => w.dayOfWeek === dayOfWeek);

        return (
          <div key={dayOfWeek} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
            <p className="w-28 shrink-0 pt-2 text-sm font-medium text-foreground">{label}</p>
            <div className="flex-1 space-y-2">
              {dayWindows.length === 0 && <p className="pt-2 text-sm text-muted-foreground">Closed</p>}
              {dayWindows.map((w) => (
                <div key={w.index} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={w.startTime}
                    onChange={(e) => updateWindow(w.index, "startTime", e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={w.endTime}
                    onChange={(e) => updateWindow(w.index, "endTime", e.target.value)}
                    className="w-32"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeWindow(w.index)} aria-label="Remove window">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addWindow(dayOfWeek)}>
                <Plus className="h-3.5 w-3.5" />
                Add hours
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

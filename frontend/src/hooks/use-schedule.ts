"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { DoctorScheduleWindow } from "@/types";

export function useSchedule() {
  return useQuery({
    queryKey: ["my-schedule"],
    queryFn: () => apiFetch<{ schedule: DoctorScheduleWindow[] }>("/schedule"),
  });
}

export function useReplaceSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (windows: DoctorScheduleWindow[]) =>
      apiFetch<{ schedule: DoctorScheduleWindow[] }>("/schedule", { method: "PUT", body: { windows } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-schedule"] }),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { DoctorScheduleWindow, ScheduleException } from "@/types";

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

export function useScheduleExceptions() {
  return useQuery({
    queryKey: ["schedule-exceptions"],
    queryFn: () => apiFetch<{ exceptions: ScheduleException[] }>("/schedule/exceptions"),
  });
}

export function useAddException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; reason?: string }) =>
      apiFetch<{ exception: ScheduleException }>("/schedule/exceptions", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule-exceptions"] }),
  });
}

export function useRemoveException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/schedule/exceptions/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedule-exceptions"] }),
  });
}

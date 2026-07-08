"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ClinicService, DoctorSummary } from "@/types";

export function useDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: () => apiFetch<{ doctors: DoctorSummary[] }>("/doctors"),
  });
}

export function useServices(doctorId?: string) {
  return useQuery({
    queryKey: ["services", doctorId],
    queryFn: () => apiFetch<{ services: ClinicService[] }>(`/services${doctorId ? `?doctorId=${doctorId}` : ""}`),
  });
}

export function useSlots(doctorId: string | undefined, date: string | undefined, serviceId: string | undefined) {
  return useQuery({
    queryKey: ["slots", doctorId, date, serviceId],
    queryFn: () =>
      apiFetch<{ slots: string[] }>(`/schedule/slots?doctorId=${doctorId}&date=${date}&serviceId=${serviceId}`),
    enabled: Boolean(doctorId && date && serviceId),
  });
}

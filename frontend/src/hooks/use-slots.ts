"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Location, ClinicService, DoctorSummary } from "@/types";

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => apiFetch<{ locations: Location[] }>("/locations"),
  });
}

export function useDoctors(locationId?: string) {
  return useQuery({
    queryKey: ["doctors", locationId],
    queryFn: () => apiFetch<{ doctors: DoctorSummary[] }>(`/doctors${locationId ? `?locationId=${locationId}` : ""}`),
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

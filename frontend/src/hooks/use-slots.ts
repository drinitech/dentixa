"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Clinic, ClinicService, DoctorSummary } from "@/types";

export function useClinics() {
  return useQuery({
    queryKey: ["clinics"],
    queryFn: () => apiFetch<{ clinics: Clinic[] }>("/clinics"),
  });
}

export function useDoctors(clinicId?: string) {
  return useQuery({
    queryKey: ["doctors", clinicId],
    queryFn: () => apiFetch<{ doctors: DoctorSummary[] }>(`/doctors${clinicId ? `?clinicId=${clinicId}` : ""}`),
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

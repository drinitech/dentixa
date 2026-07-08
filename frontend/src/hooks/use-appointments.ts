"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Appointment, AppointmentStatus } from "@/types";

interface ListParams {
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  doctorId?: string;
}

function toQueryString(params: ListParams) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) qs.set(key, value);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function useAppointments(params: ListParams = {}, options?: { admin?: boolean; enabled?: boolean }) {
  const path = options?.admin ? "/admin/appointments" : "/appointments";
  return useQuery({
    queryKey: [options?.admin ? "admin-appointments" : "appointments", params],
    queryFn: () => apiFetch<{ appointments: Appointment[] }>(`${path}${toQueryString(params)}`),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { doctorId: string; serviceId: string; date: string; time: string; reason?: string }) =>
      apiFetch<{ appointment: Appointment }>("/appointments", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  });
}

export function useApproveAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ appointment: Appointment; autoRejectedCount: number }>(`/appointments/${id}/approve`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
    },
  });
}

export function useRejectAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason?: string }) =>
      apiFetch<{ appointment: Appointment }>(`/appointments/${id}/reject`, {
        method: "PATCH",
        body: { rejectionReason },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useCancelAppointment(options?: { admin?: boolean }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ appointment: Appointment }>(
        options?.admin ? `/admin/appointments/${id}/cancel` : `/appointments/${id}/cancel`,
        { method: "PATCH" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
    },
  });
}

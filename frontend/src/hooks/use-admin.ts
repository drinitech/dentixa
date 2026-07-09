"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { AdminUser, Clinic, ClinicService, ClinicHoliday, Role } from "@/types";

// --- Doctors ---

export function useAdminDoctors() {
  return useQuery({
    queryKey: ["admin-doctors"],
    queryFn: () => apiFetch<{ doctors: AdminUser[] }>("/admin/doctors"),
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      specialty?: string;
      clinicId: string;
    }) => apiFetch<{ doctor: AdminUser }>("/admin/doctors", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
      specialty?: string;
      isActive?: boolean;
      clinicId?: string;
    }) => apiFetch<{ doctor: AdminUser }>(`/admin/doctors/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

// --- Clinics ---

export function useAdminClinics() {
  return useQuery({
    queryKey: ["admin-clinics"],
    queryFn: () => apiFetch<{ clinics: Clinic[] }>("/admin/clinics"),
  });
}

export function useCreateClinic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; address?: string; phone?: string }) =>
      apiFetch<{ clinic: Clinic }>("/admin/clinics", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
    },
  });
}

export function useUpdateClinic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; address?: string; phone?: string; isActive?: boolean }) =>
      apiFetch<{ clinic: Clinic }>(`/admin/clinics/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clinics"] });
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
    },
  });
}

export function useDoctorServices(doctorId: string | null) {
  return useQuery({
    queryKey: ["admin-doctor-services", doctorId],
    queryFn: () => apiFetch<{ serviceIds: string[] }>(`/admin/doctors/${doctorId}/services`),
    enabled: doctorId !== null,
  });
}

export function useSetDoctorServices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, serviceIds }: { doctorId: string; serviceIds: string[] }) =>
      apiFetch<{ serviceIds: string[] }>(`/admin/doctors/${doctorId}/services`, {
        method: "PUT",
        body: { serviceIds },
      }),
    onSuccess: (_data, { doctorId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctor-services", doctorId] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

// --- Users ---

interface ListUsersParams {
  search?: string;
  role?: Role;
  status?: "active" | "inactive";
  page?: number;
}

export function useAdminUsers(params: ListUsersParams) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.role) qs.set("role", params.role);
  if (params.status) qs.set("status", params.status);
  qs.set("page", String(params.page ?? 1));

  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () =>
      apiFetch<{ users: AdminUser[]; total: number; page: number; pageSize: number }>(`/admin/users?${qs}`),
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ban }: { id: string; ban: boolean }) =>
      apiFetch<{ user: AdminUser }>(`/admin/users/${id}/${ban ? "ban" : "unban"}`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ tempPassword: string }>(`/admin/users/${id}/reset-password`, { method: "POST" }),
  });
}

// --- Services ---

export function useAdminServices() {
  return useQuery({
    queryKey: ["admin-services"],
    queryFn: () => apiFetch<{ services: ClinicService[] }>("/admin/services"),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      durationMinutes: number;
      price?: number;
      recallIntervalMonths?: number | null;
    }) => apiFetch<{ service: ClinicService }>("/admin/services", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      durationMinutes?: number;
      price?: number;
      recallIntervalMonths?: number | null;
    }) => apiFetch<{ service: ClinicService }>(`/admin/services/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useDeactivateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ service: ClinicService }>(`/admin/services/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

// --- Clinic holidays ---

export function useClinicHolidays() {
  return useQuery({
    queryKey: ["admin-clinic-holidays"],
    queryFn: () => apiFetch<{ holidays: ClinicHoliday[] }>("/admin/clinic-holidays"),
  });
}

export function useAddClinicHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; reason?: string }) =>
      apiFetch<{ holiday: ClinicHoliday }>("/admin/clinic-holidays", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-clinic-holidays"] }),
  });
}

export function useRemoveClinicHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/admin/clinic-holidays/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-clinic-holidays"] }),
  });
}

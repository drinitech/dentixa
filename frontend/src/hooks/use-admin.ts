"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { AdminUser, ClinicService, Role } from "@/types";

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
    mutationFn: (input: { name: string; email: string; password: string; phone?: string }) =>
      apiFetch<{ doctor: AdminUser }>("/admin/doctors", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; phone?: string; isActive?: boolean }) =>
      apiFetch<{ doctor: AdminUser }>(`/admin/doctors/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
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
    mutationFn: (input: { name: string; durationMinutes: number; price?: number }) =>
      apiFetch<{ service: ClinicService }>("/admin/services", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; durationMinutes?: number; price?: number }) =>
      apiFetch<{ service: ClinicService }>(`/admin/services/${id}`, { method: "PATCH", body: input }),
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

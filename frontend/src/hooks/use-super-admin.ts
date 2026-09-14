"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { SuperAdminTenant } from "@/types";

export function useSuperAdminTenants() {
  return useQuery({
    queryKey: ["super-admin-tenants"],
    queryFn: () => apiFetch<{ tenants: SuperAdminTenant[] }>("/super-admin/tenants"),
  });
}

export function useChangeTenantPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: "FREE" | "PRO" }) =>
      apiFetch<{ tenant: SuperAdminTenant }>(`/super-admin/tenants/${id}/plan`, { method: "PATCH", body: { plan } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin-tenants"] }),
  });
}

export function useSetTenantSuspended() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, suspend }: { id: string; suspend: boolean }) =>
      apiFetch<{ tenant: SuperAdminTenant }>(`/super-admin/tenants/${id}/${suspend ? "suspend" : "activate"}`, {
        method: "PATCH",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["super-admin-tenants"] }),
  });
}

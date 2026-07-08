"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { AdminStats, DoctorStats } from "@/types";

export function useDoctorStats() {
  return useQuery({
    queryKey: ["doctor-stats"],
    queryFn: () => apiFetch<{ stats: DoctorStats }>("/doctors/me/stats"),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch<{ stats: AdminStats }>("/admin/stats"),
  });
}

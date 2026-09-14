"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ClinicService } from "@/types";

interface PublicClinic {
  name: string;
  slug: string;
  timezone: string;
}

export interface PublicDoctor {
  id: string;
  name: string;
  avatarUrl: string | null;
  specialty: string | null;
  location: { id: string; name: string } | null;
  averageRating: number | null;
  reviewCount: number;
}

// These hit /public/* — unauthenticated, relying on the ambient X-Tenant-Slug
// that TenantProvider (app/c/[slug]/layout.tsx) already sets for every page
// under this route, so no slug argument is needed here.
export function usePublicClinic() {
  return useQuery({
    queryKey: ["public-clinic"],
    queryFn: () => apiFetch<{ clinic: PublicClinic }>("/public/clinic"),
    retry: false,
  });
}

export function usePublicDoctors() {
  return useQuery({
    queryKey: ["public-doctors"],
    queryFn: () => apiFetch<{ doctors: PublicDoctor[] }>("/public/doctors"),
    retry: false,
  });
}

export function usePublicServices() {
  return useQuery({
    queryKey: ["public-services"],
    queryFn: () => apiFetch<{ services: ClinicService[] }>("/public/services"),
    retry: false,
  });
}

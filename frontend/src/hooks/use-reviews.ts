"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { DoctorReview } from "@/types";

export function useDoctorReviews(doctorId: string | undefined) {
  return useQuery({
    queryKey: ["doctor-reviews", doctorId],
    queryFn: () =>
      apiFetch<{ reviews: DoctorReview[]; averageRating: number | null; reviewCount: number }>(
        `/doctors/${doctorId}/reviews`,
      ),
    enabled: Boolean(doctorId),
  });
}

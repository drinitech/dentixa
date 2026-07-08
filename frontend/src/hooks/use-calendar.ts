"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export function useCalendarToken(enabled: boolean) {
  return useQuery({
    queryKey: ["calendar-token"],
    queryFn: () => apiFetch<{ token: string }>("/doctors/me/calendar-token"),
    enabled,
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { WaitlistEntry } from "@/types";

export function useMyWaitlist() {
  return useQuery({
    queryKey: ["my-waitlist"],
    queryFn: () => apiFetch<{ entries: WaitlistEntry[] }>("/waitlist/me"),
  });
}

export function useJoinWaitlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { doctorId: string; serviceId: string; date: string }) =>
      apiFetch<{ entry: WaitlistEntry }>("/waitlist", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-waitlist"] }),
  });
}

export function useLeaveWaitlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/waitlist/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-waitlist"] }),
  });
}

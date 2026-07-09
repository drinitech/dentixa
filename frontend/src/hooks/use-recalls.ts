"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { RecallReminder } from "@/types";

export function useMyRecalls() {
  return useQuery({
    queryKey: ["my-recalls"],
    queryFn: () => apiFetch<{ recalls: RecallReminder[] }>("/recalls/me"),
  });
}

export function useDismissRecall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ recall: RecallReminder }>(`/recalls/${id}/dismiss`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-recalls"] }),
  });
}

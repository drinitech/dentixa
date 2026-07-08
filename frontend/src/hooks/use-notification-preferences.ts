"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { NotificationPreference, NotificationChannel, NotificationEventType } from "@/types";

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => apiFetch<{ preferences: NotificationPreference[] }>("/users/me/notification-preferences"),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: { channel: NotificationChannel; eventType: NotificationEventType; enabled: boolean }[]) =>
      apiFetch<{ preferences: NotificationPreference[] }>("/users/me/notification-preferences", {
        method: "PATCH",
        body: { preferences },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-preferences"] }),
  });
}

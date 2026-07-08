"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { User } from "@/types";

export function useUpdateAvatar() {
  return useMutation({
    mutationFn: (avatarUrl: string) =>
      apiFetch<{ user: User }>("/users/me/avatar", { method: "PATCH", body: { avatarUrl } }),
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { MembershipRole } from "@/types";

interface InvitePreview {
  email: string;
  role: MembershipRole;
  clinicName: string;
  existingAccount: boolean;
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: ["invite-preview", token],
    queryFn: () => apiFetch<InvitePreview>(`/invites/${token}`),
    retry: false,
  });
}

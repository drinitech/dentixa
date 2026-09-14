"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

// Unlike useRequireRole, this doesn't live under /c/[slug] — a super admin
// isn't a Membership of any tenant, so there's no slug to redirect back to.
export function useRequireSuperAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.isSuperAdmin) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return { user, loading, ready: !loading && !!user && user.isSuperAdmin };
}

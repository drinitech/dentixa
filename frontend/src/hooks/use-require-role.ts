"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { roleHome } from "@/components/layout/nav-items";
import type { Role } from "@/types";

export function useRequireRole(role: Role) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(roleHome(slug, user.role));
    }
  }, [user, loading, role, router, slug]);

  return { user, loading, ready: !loading && !!user && user.role === role };
}

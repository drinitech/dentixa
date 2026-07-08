"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/types";

const ROLE_HOME: Record<Role, string> = {
  PATIENT: "/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin/dashboard",
};

export function useRequireRole(role: Role) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, loading, role, router]);

  return { user, loading, ready: !loading && !!user && user.role === role };
}

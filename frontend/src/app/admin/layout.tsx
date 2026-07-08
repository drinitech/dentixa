"use client";

import { AppShell } from "@/components/layout/app-shell";
import { adminNav } from "@/components/layout/nav-items";
import { useRequireRole } from "@/hooks/use-require-role";
import { PageLoading } from "@/components/common/loading-spinner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole("ADMIN");

  if (!ready) return <PageLoading />;

  return (
    <AppShell navItems={adminNav} roleLabel="Admin">
      {children}
    </AppShell>
  );
}

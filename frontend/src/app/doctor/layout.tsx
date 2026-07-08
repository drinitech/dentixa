"use client";

import { AppShell } from "@/components/layout/app-shell";
import { doctorNav } from "@/components/layout/nav-items";
import { useRequireRole } from "@/hooks/use-require-role";
import { PageLoading } from "@/components/common/loading-spinner";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole("DOCTOR");

  if (!ready) return <PageLoading />;

  return (
    <AppShell navItems={doctorNav} roleLabel="Doctor">
      {children}
    </AppShell>
  );
}

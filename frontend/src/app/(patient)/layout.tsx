"use client";

import { AppShell } from "@/components/layout/app-shell";
import { patientNav } from "@/components/layout/nav-items";
import { useRequireRole } from "@/hooks/use-require-role";
import { PageLoading } from "@/components/common/loading-spinner";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole("PATIENT");

  if (!ready) return <PageLoading />;

  return (
    <AppShell navItems={patientNav} roleLabel="Patient">
      {children}
    </AppShell>
  );
}

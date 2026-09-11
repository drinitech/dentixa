"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { adminNav } from "@/components/layout/nav-items";
import { useRequireRole } from "@/hooks/use-require-role";
import { PageLoading } from "@/components/common/loading-spinner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole("ADMIN");
  const { slug } = useParams<{ slug: string }>();

  if (!ready) return <PageLoading />;

  return (
    <AppShell navItems={adminNav(slug)} roleLabel="Admin">
      {children}
    </AppShell>
  );
}

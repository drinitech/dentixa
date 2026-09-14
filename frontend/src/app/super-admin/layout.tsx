"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Deliberately not AppShell — that component assumes a /c/[slug] route
// (roleHome/roleProfile both take a slug), but a super admin has no tenant
// Membership to be "in". Just enough chrome for the one page this area has.
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/super-admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
            D
          </div>
          <span className="text-lg font-semibold tracking-tight">Dentixa — Super Admin</span>
        </Link>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-muted-foreground">{user.name}</span>}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

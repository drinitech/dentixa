"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Users as UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useAdminUsers, useBanUser, useResetPassword } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import type { Role } from "@/types";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [status, setStatus] = useState<"active" | "inactive" | "">("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    role: role || undefined,
    status: status || undefined,
  });
  const banUser = useBanUser();
  const resetPassword = useResetPassword();

  async function handleBanToggle(id: string, isActive: boolean) {
    try {
      await banUser.mutateAsync({ id, ban: isActive });
      toast.success(isActive ? "User banned" : "User unbanned");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update user");
    }
  }

  async function handleReset(id: string) {
    try {
      const result = await resetPassword.mutateAsync(id);
      setTempPassword(result.tempPassword);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not reset password");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Search, filter, ban, or reset passwords for any account." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={role} onChange={(e) => setRole(e.target.value as Role | "")}>
          <option value="">All roles</option>
          <option value="PATIENT">Patient</option>
          <option value="DOCTOR">Doctor</option>
          <option value="ADMIN">Admin</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive" | "")}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {isLoading ? (
        <PageLoading />
      ) : data && data.users.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.users.map((u) => (
                <tr key={u.id} className="bg-card">
                  <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.isActive
                          ? "rounded-full bg-status-approved/15 px-2 py-0.5 text-xs font-medium text-status-approved"
                          : "rounded-full bg-status-cancelled px-2 py-0.5 text-xs font-medium text-status-cancelled-foreground"
                      }
                    >
                      {u.isActive ? "Active" : "Banned"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleReset(u.id)}>
                        Reset password
                      </Button>
                      {u.role !== "ADMIN" && (
                        <Button
                          variant={u.isActive ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleBanToggle(u.id, u.isActive)}
                        >
                          {u.isActive ? "Ban" : "Unban"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={UsersIcon} title="No users found" description="Try adjusting your search or filters." />
      )}

      <Dialog
        open={tempPassword !== null}
        onOpenChange={() => setTempPassword(null)}
        title="Temporary password"
        description="Share this with the user — it won't be shown again."
      >
        <div className="rounded-lg bg-muted px-4 py-3 text-center font-mono text-sm">{tempPassword}</div>
      </Dialog>
    </div>
  );
}

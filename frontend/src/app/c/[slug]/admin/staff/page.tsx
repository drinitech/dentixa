"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, UserPlus, X } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InviteForm } from "@/components/admin/invite-form";
import { useInvites, useRevokeInvite } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  RECEPTIONIST: "Receptionist",
  DOCTOR: "Doctor",
  PATIENT: "Patient",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-status-pending/15 text-status-pending",
  ACCEPTED: "bg-status-approved/15 text-status-approved",
  REVOKED: "bg-status-cancelled text-status-cancelled-foreground",
};

export default function AdminStaffPage() {
  const [formOpen, setFormOpen] = useState(false);
  const { data, isLoading } = useInvites();
  const revokeInvite = useRevokeInvite();

  async function revoke(id: string, email: string) {
    try {
      await revokeInvite.mutateAsync(id);
      toast.success(`Invite to ${email} revoked`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not revoke invite");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff invites"
        description="Invite people to join this clinic with a specific role."
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Invite staff
          </Button>
        }
      />

      {isLoading ? (
        <PageLoading />
      ) : data && data.invites.length > 0 ? (
        <div className="space-y-3">
          {data.invites.map((invite) => (
            <Card key={invite.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{invite.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_LABELS[invite.role] ?? invite.role}
                    {invite.status === "PENDING" &&
                      ` · expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[invite.status] ?? ""}`}
                  >
                    {invite.status === "PENDING" ? "Pending" : invite.status === "ACCEPTED" ? "Accepted" : "Revoked"}
                  </span>
                  {invite.status === "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revoke(invite.id, invite.email)}
                      disabled={revokeInvite.isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={UserPlus} title="No invites yet" description="Invite your first staff member." />
      )}

      <InviteForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

"use client";

import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { PageLoading } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { useAuditLog } from "@/hooks/use-admin";

const ACTION_LABELS: Record<string, string> = {
  "invite.created": "Invite sent",
  "invite.resent": "Invite resent",
  "invite.revoked": "Invite revoked",
  "invite.accepted": "Invite accepted",
  "doctor.created": "Doctor added",
  "doctor.updated": "Doctor updated",
  "user.banned": "User banned",
  "user.unbanned": "User unbanned",
  "tenant.plan_changed": "Plan changed",
  "tenant.suspended": "Clinic suspended",
  "tenant.activated": "Clinic reactivated",
};

function formatMeta(meta: Record<string, unknown> | null): string | null {
  if (!meta) return null;
  return Object.entries(meta)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

export default function AdminAuditLogPage() {
  const { data, isLoading } = useAuditLog();

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Who changed what, and when." />

      {isLoading ? (
        <PageLoading />
      ) : data && data.entries.length > 0 ? (
        <div className="space-y-2">
          {data.entries.map((entry) => {
            const metaText = formatMeta(entry.meta);
            return (
              <Card key={entry.id}>
                <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{ACTION_LABELS[entry.action] ?? entry.action}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {entry.actor.name} ({entry.actor.email}){metaText ? ` — ${metaText}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={ScrollText} title="No activity yet" />
      )}
    </div>
  );
}

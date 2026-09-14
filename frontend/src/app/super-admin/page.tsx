"use client";

import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { PageLoading } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useRequireSuperAdmin } from "@/hooks/use-require-super-admin";
import { useSuperAdminTenants, useChangeTenantPlan, useSetTenantSuspended } from "@/hooks/use-super-admin";
import { ApiError } from "@/lib/api-client";
import type { SuperAdminTenant } from "@/types";

export default function SuperAdminPage() {
  const { ready } = useRequireSuperAdmin();
  const { data, isLoading } = useSuperAdminTenants();
  const changePlan = useChangeTenantPlan();
  const setSuspended = useSetTenantSuspended();

  async function handlePlanChange(tenant: SuperAdminTenant, plan: "FREE" | "PRO") {
    try {
      await changePlan.mutateAsync({ id: tenant.id, plan });
      toast.success(`${tenant.name} moved to ${plan}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not change plan");
    }
  }

  async function handleSuspendToggle(tenant: SuperAdminTenant) {
    const suspend = tenant.status === "ACTIVE";
    try {
      await setSuspended.mutateAsync({ id: tenant.id, suspend });
      toast.success(suspend ? `${tenant.name} suspended` : `${tenant.name} reactivated`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update clinic status");
    }
  }

  if (!ready || isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader title="Clinics" description="Every clinic on the platform — plan, status, and appointment volume." />

      {data && data.tenants.length > 0 ? (
        <div className="space-y-3">
          {data.tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{tenant.name}</p>
                  <p className="text-sm text-muted-foreground">
                    /c/{tenant.slug} · {tenant.appointmentCount} appointment{tenant.appointmentCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      tenant.status === "ACTIVE"
                        ? "rounded-full bg-status-approved/15 px-2.5 py-1 text-xs font-medium text-status-approved"
                        : "rounded-full bg-status-cancelled px-2.5 py-1 text-xs font-medium text-status-cancelled-foreground"
                    }
                  >
                    {tenant.status === "ACTIVE" ? "Active" : "Suspended"}
                  </span>
                  <Select
                    className="h-9 w-28"
                    value={tenant.plan}
                    disabled={changePlan.isPending}
                    onChange={(e) => handlePlanChange(tenant, e.target.value as "FREE" | "PRO")}
                  >
                    <option value="FREE">Free</option>
                    <option value="PRO">Pro</option>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuspendToggle(tenant)}
                    disabled={setSuspended.isPending}
                  >
                    {tenant.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Building2} title="No clinics yet" />
      )}
    </div>
  );
}

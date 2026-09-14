import type { TenantPlan, TenantStatus } from "@prisma/client";
import { prismaUnscoped } from "../lib/prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { logAudit } from "./auditLog.service";

export async function listTenants() {
  const [tenants, counts] = await Promise.all([
    prismaUnscoped.tenant.findMany({ orderBy: { createdAt: "desc" } }),
    prismaUnscoped.appointment.groupBy({ by: ["tenantId"], _count: { _all: true } }),
  ]);
  const countByTenant = new Map(counts.map((c) => [c.tenantId, c._count._all]));

  return tenants.map((t) => ({ ...t, appointmentCount: countByTenant.get(t.id) ?? 0 }));
}

export async function changePlan(tenantId: string, plan: TenantPlan, actorUserId: string) {
  const tenant = await prismaUnscoped.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new NotFoundError("Clinic not found");

  const updated = await prismaUnscoped.tenant.update({ where: { id: tenantId }, data: { plan } });
  await logAudit({
    tenantId,
    actorUserId,
    action: "tenant.plan_changed",
    entity: "Tenant",
    entityId: tenantId,
    meta: { from: tenant.plan, to: plan },
  });
  return updated;
}

// Suspension takes effect on the tenant's very next request — resolveTenant.ts
// already 404s any tenant whose status isn't ACTIVE, so there's no separate
// "kick out active sessions" step needed here.
export async function setTenantStatus(tenantId: string, status: TenantStatus, actorUserId: string) {
  const tenant = await prismaUnscoped.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new NotFoundError("Clinic not found");

  const updated = await prismaUnscoped.tenant.update({ where: { id: tenantId }, data: { status } });
  await logAudit({
    tenantId,
    actorUserId,
    action: status === "SUSPENDED" ? "tenant.suspended" : "tenant.activated",
    entity: "Tenant",
    entityId: tenantId,
  });
  return updated;
}

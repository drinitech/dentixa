import type { Prisma } from "@prisma/client";
import { prismaUnscoped } from "../lib/prisma";
import { logger } from "../lib/logger";

interface LogAuditParams {
  tenantId: string;
  actorUserId: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}

// Never throws — same principle as notification.service.ts's notify(): an
// audit-trail write failing must never break the actual mutation it's
// describing. Covers staff (invites, doctor accounts) and settings-ish
// platform actions (plan changes, suspension) per the scope doc; appointment
// approve/reject/cancel/etc. aren't instrumented yet — deferred, since that's
// a much larger surface and appointments already carry an implicit history
// via status + timestamps.
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await prismaUnscoped.auditLog.create({
      data: {
        tenantId: params.tenantId,
        actorUserId: params.actorUserId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        meta: params.meta as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    logger.warn(`logAudit() failed for tenant=${params.tenantId} action=${params.action}:`, err);
  }
}

export async function listAuditLog(tenantId: string, limit = 100) {
  return prismaUnscoped.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { id: true, name: true, email: true } } },
  });
}

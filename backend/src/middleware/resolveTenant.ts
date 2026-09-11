import type { NextFunction, Request, Response } from "express";
import { prismaUnscoped } from "../lib/prisma";
import { runWithTenant } from "../lib/tenantContext";
import { NotFoundError } from "../errors/NotFoundError";
import { asyncHandler } from "../lib/asyncHandler";

// Resolves which tenant this request operates in, verifies the caller
// actually belongs to it, and establishes the AsyncLocalStorage context the
// tenant-scoped `prisma` client reads from for the rest of the request.
//
// A user with no active Membership in the tenant gets 404, never 403 — a
// caller with no access to a tenant shouldn't be able to tell it exists.
// A missing X-Tenant-Slug header gets the same 404, rather than a fallback
// tenant — every route that reaches this middleware requires one, and the
// frontend always sends it (see components/providers/tenant-provider.tsx).
// Must run after `authenticate` (needs req.user).
export const resolveTenant = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const slug = req.header("X-Tenant-Slug");

  const tenantId = await (async () => {
    if (!slug) throw new NotFoundError("Clinic not found");
    const tenant = await prismaUnscoped.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.status !== "ACTIVE") throw new NotFoundError("Clinic not found");
    return tenant.id;
  })();

  const membership = await prismaUnscoped.membership.findUnique({
    where: { userId_tenantId: { userId: req.user!.id, tenantId } },
  });
  if (!membership || membership.status !== "ACTIVE") throw new NotFoundError("Clinic not found");

  req.tenantId = tenantId;
  req.membership = { role: membership.role, status: membership.status };

  runWithTenant(tenantId, next);
});

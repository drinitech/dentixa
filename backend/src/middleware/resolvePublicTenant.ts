import type { NextFunction, Request, Response } from "express";
import { prismaUnscoped } from "../lib/prisma";
import { runWithTenant } from "../lib/tenantContext";
import { NotFoundError } from "../errors/NotFoundError";
import { asyncHandler } from "../lib/asyncHandler";

// Like resolveTenant.ts, but for anonymous requests — there's no req.user
// yet, so there's no Membership to check against. Only for read-only public
// routes (routes/public.routes.ts) that a prospective patient browses before
// creating an account; everything else still goes through resolveTenant.
export const resolvePublicTenant = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const slug = req.header("X-Tenant-Slug");
  if (!slug) throw new NotFoundError("Clinic not found");

  const tenant = await prismaUnscoped.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.status !== "ACTIVE") throw new NotFoundError("Clinic not found");

  req.tenantId = tenant.id;
  runWithTenant(tenant.id, next);
});

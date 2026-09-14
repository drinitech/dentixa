import type { NextFunction, Request, Response } from "express";
import { prismaUnscoped } from "../lib/prisma";
import { ForbiddenError } from "../errors/ForbiddenError";
import { asyncHandler } from "../lib/asyncHandler";

// Checked via a DB lookup, not the JWT payload — unlike an ordinary role
// check (which reads MembershipRole off one already-resolved tenant), this
// grants access to every tenant's data at once, so a stale "isSuperAdmin"
// claim cached in a 15-minute access token is a much bigger deal than a
// stale ordinary role would be. Must run after authenticate. No resolveTenant
// here — super-admin routes act across every tenant, not one resolved one.
export const requireSuperAdmin = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const user = await prismaUnscoped.user.findUnique({
    where: { id: req.user!.id },
    select: { isSuperAdmin: true },
  });
  if (!user?.isSuperAdmin) throw new ForbiddenError("Super admin access required");
  next();
});

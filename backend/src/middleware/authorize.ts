import type { NextFunction, Request, Response } from "express";
import type { MembershipRole } from "@prisma/client";
import { ForbiddenError } from "../errors/ForbiddenError";

// Reads role from the caller's Membership in the resolved tenant, never from
// req.user — a role is tenant-scoped, and the same User can hold a different
// role in a different tenant. Must run after resolveTenant.
export function authorize(...roles: MembershipRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.membership || !roles.includes(req.membership.role)) {
      throw new ForbiddenError("You do not have permission to perform this action");
    }
    next();
  };
}

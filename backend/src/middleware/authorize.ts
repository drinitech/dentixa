import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { ForbiddenError } from "../errors/ForbiddenError";

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError("You do not have permission to perform this action");
    }
    next();
  };
}

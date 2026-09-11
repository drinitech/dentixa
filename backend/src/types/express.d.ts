import type { Role, MembershipRole, MembershipStatus } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        name: string;
      };
      // Set by middleware/resolveTenant.ts for every tenant-scoped route.
      tenantId?: string;
      membership?: {
        role: MembershipRole;
        status: MembershipStatus;
      };
    }
  }
}

export {};

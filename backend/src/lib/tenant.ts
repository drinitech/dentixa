// Milestone-1 stopgap. There is exactly one tenant right now — the demo
// tenant every existing row was backfilled into — and no request-scoped
// tenant resolution exists yet (that's Milestone 2: path-based /c/[slug] +
// a Prisma Client Extension that injects tenantId and rejects any
// tenant-scoped query made without it). Every write that needs a tenantId
// uses this constant until then. Safe today because only one tenant exists,
// so every write already belongs to it.
export const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || "demo-clinic";

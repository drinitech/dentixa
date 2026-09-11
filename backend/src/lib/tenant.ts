// The tenant every pre-existing row was backfilled into (Milestone 1), and
// the one public registration assigns new patients to — there's no
// multi-clinic picker at signup yet (see auth.service.ts register()).
// resolveTenant.ts no longer falls back to this: every tenant-scoped route
// requires a real X-Tenant-Slug header, which the frontend now always sends.
export const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || "demo-clinic";

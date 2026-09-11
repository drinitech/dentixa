// The tenant every pre-existing row was backfilled into (Milestone 1), and
// the fallback middleware/resolveTenant.ts uses when a request doesn't send
// an X-Tenant-Slug header — i.e. every request from the current frontend,
// which doesn't do path-based tenant routing yet. Once the frontend sends
// the header on every request (Milestone 2's frontend step), this fallback
// stops being exercised in practice; it's not removed outright since it's
// what keeps the live single-clinic app working during the transition.
export const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || "demo-clinic";

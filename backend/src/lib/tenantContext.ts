import { AsyncLocalStorage } from "node:async_hooks";

interface TenantStore {
  tenantId: string;
}

const storage = new AsyncLocalStorage<TenantStore>();

// Establishes the tenant context for the duration of fn. The
// resolveTenant middleware calls this once per request; every query the
// request makes through the tenant-scoped `prisma` client (see lib/prisma.ts)
// reads the tenantId back via getTenantId().
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return storage.run({ tenantId }, fn);
}

// Throws rather than falling back to anything — a tenant-scoped query with
// no established context is a bug (a route that skipped resolveTenant, or a
// background job that should be using prismaUnscoped instead) and must fail
// loudly rather than silently touching every tenant's rows.
export function getTenantId(): string {
  const store = storage.getStore();
  if (!store) {
    throw new Error(
      "No tenant context established for this operation — did the request skip the resolveTenant middleware, or should this code be using prismaUnscoped?",
    );
  }
  return store.tenantId;
}

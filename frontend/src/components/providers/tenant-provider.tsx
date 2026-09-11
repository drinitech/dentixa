"use client";

import { setTenantSlug } from "@/lib/api-client";

// Syncs the current route's clinic slug into api-client's module state so
// every request sends X-Tenant-Slug — synchronously during render, not in a
// useEffect. React renders parent-first, so this always runs before any
// child page's data-fetching hooks mount and fire their own effects; doing
// this in an effect instead would race, since child effects fire before a
// parent's. Idempotent (always sets the same value for a given render), so
// StrictMode's double-invoke in dev is harmless.
export function TenantProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  setTenantSlug(slug);
  return <>{children}</>;
}

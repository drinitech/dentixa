import { PrismaClient } from "@prisma/client";
import { getTenantId } from "./tenantContext";

// Standard singleton pattern to avoid exhausting connections on hot-reload.
const globalForPrisma = globalThis as unknown as { prismaUnscoped?: PrismaClient };

// The raw client, with no tenant scoping applied. Only two kinds of code
// should import this directly: system-level cron sweeps that intentionally
// operate across every tenant at once (reminder.job.ts, recall.job.ts), and
// the tenant-resolution middleware itself, which has to look up Tenant and
// Membership rows *before* any tenant context exists to inject. Everything
// else should import `prisma` below.
export const prismaUnscoped =
  globalForPrisma.prismaUnscoped ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaUnscoped = prismaUnscoped;
}

// Every model that belongs to a tenant. Membership and Tenant themselves are
// deliberately excluded — Membership is how tenant context gets established
// in the first place (see middleware/resolveTenant.ts), so it can't require
// that context to already exist.
const TENANT_SCOPED_MODELS = new Set([
  "Location",
  "ClinicService",
  "DoctorSchedule",
  "ScheduleException",
  "ClinicHoliday",
  "Waitlist",
  "Appointment",
  "RecallReminder",
  "Review",
]);

const WHERE_INJECTED_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

// The client every request-driven controller/service should use. Wraps the
// raw client so any query against a tenant-scoped model automatically gets
// tenantId merged into its where/data, sourced from the AsyncLocalStorage
// context resolveTenant establishes per request — and throws if no such
// context is active, rather than silently touching every tenant's rows.
export const prisma = prismaUnscoped.$extends({
  name: "tenant-scoping",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_SCOPED_MODELS.has(model)) {
          return query(args);
        }

        const tenantId = getTenantId();
        const a = args as Record<string, unknown>;

        if (operation === "create") {
          a.data = { ...(a.data as object), tenantId };
        } else if (operation === "createMany" || operation === "createManyAndReturn") {
          const data = a.data;
          a.data = Array.isArray(data) ? data.map((d) => ({ ...d, tenantId })) : { ...(data as object), tenantId };
        } else if (operation === "upsert") {
          a.where = { ...(a.where as object), tenantId };
          a.create = { ...(a.create as object), tenantId };
        } else if (WHERE_INJECTED_OPERATIONS.has(operation)) {
          a.where = { ...((a.where as object) ?? {}), tenantId };
        }

        return query(args);
      },
    },
  },
});

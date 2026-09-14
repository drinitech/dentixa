import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../../app";
import { prismaUnscoped as prisma } from "../../lib/prisma";

// Milestone 6: the Super Admin panel (list every clinic, change plan,
// suspend/activate) and the audit log it and staff actions write to.
const app = createApp();
const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const PASSWORD = "IntegrationTest123!";

let slug: string;
let tenantId: string;
let ownerToken: string;
let superAdminToken: string;

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: `it-superadmin-${RUN_ID}@test.local`,
      passwordHash,
      role: "ADMIN",
      isSuperAdmin: true,
    },
  });
  const superAdminLogin = await request(app).post("/api/auth/login").send({ email: superAdmin.email, password: PASSWORD });
  superAdminToken = superAdminLogin.body.accessToken;

  slug = `it-superadmin-${RUN_ID}`;
  const registerRes = await request(app).post("/api/auth/register-clinic").send({
    clinicName: "Super Admin Test Clinic",
    slug,
    ownerName: "Clinic Owner",
    ownerEmail: `it-sa-owner-${RUN_ID}@test.local`,
    ownerPassword: PASSWORD,
  });
  ownerToken = registerRes.body.accessToken;
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug } });
  tenantId = tenant.id;
}, 30000);

afterAll(async () => {
  await prisma.tenant.deleteMany({ where: { slug: { endsWith: `-${RUN_ID}` } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `${RUN_ID}@test.local` } } });
});

describe("super admin panel", () => {
  it("a regular clinic owner cannot access super-admin routes", async () => {
    const res = await request(app).get("/api/super-admin/tenants").set("Authorization", `Bearer ${ownerToken}`);
    expect(res.status).toBe(403);
  });

  it("lists every tenant with an appointment count", async () => {
    const res = await request(app).get("/api/super-admin/tenants").set("Authorization", `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    const entry = res.body.tenants.find((t: { id: string }) => t.id === tenantId);
    expect(entry).toMatchObject({ slug, plan: "FREE", status: "ACTIVE", appointmentCount: 0 });
  });

  it("changes a tenant's plan", async () => {
    const res = await request(app)
      .patch(`/api/super-admin/tenants/${tenantId}/plan`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ plan: "PRO" });
    expect(res.status).toBe(200);
    expect(res.body.tenant.plan).toBe("PRO");
  });

  it("suspending a tenant 404s its tenant-scoped routes, and activating restores them", async () => {
    const suspend = await request(app)
      .patch(`/api/super-admin/tenants/${tenantId}/suspend`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(suspend.status).toBe(200);
    expect(suspend.body.tenant.status).toBe("SUSPENDED");

    const blocked = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug);
    expect(blocked.status).toBe(404);

    const activate = await request(app)
      .patch(`/api/super-admin/tenants/${tenantId}/activate`)
      .set("Authorization", `Bearer ${superAdminToken}`);
    expect(activate.status).toBe(200);
    expect(activate.body.tenant.status).toBe("ACTIVE");

    const restored = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug);
    expect(restored.status).toBe(200);
  });
});

describe("audit log", () => {
  it("records staff and platform actions against the tenant, visible to its owner", async () => {
    await request(app)
      .post("/api/admin/invites")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ email: `it-sa-invitee-${RUN_ID}@test.local`, role: "DOCTOR" });

    const res = await request(app)
      .get("/api/admin/audit-log")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug);

    expect(res.status).toBe(200);
    const actions = res.body.entries.map((e: { action: string }) => e.action);
    expect(actions).toEqual(
      expect.arrayContaining(["invite.created", "tenant.plan_changed", "tenant.suspended", "tenant.activated"]),
    );
  });
});

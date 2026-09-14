import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../../app";
import { prismaUnscoped as prisma } from "../../lib/prisma";

// Milestone 7: Free plan is capped at 1 doctor and 100 appointments/month,
// enforced server-side (planLimits.service.ts) so a direct API call can't
// bypass a UI-only restriction. Pro removes both caps.
const app = createApp();
const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const PASSWORD = "IntegrationTest123!";

let slug: string;
let tenantId: string;
let ownerToken: string;
let superAdminToken: string;
let locationId: string;

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const superAdmin = await prisma.user.create({
    data: { name: "Super Admin", email: `it-planlimit-sa-${RUN_ID}@test.local`, passwordHash, role: "ADMIN", isSuperAdmin: true },
  });
  const saLogin = await request(app).post("/api/auth/login").send({ email: superAdmin.email, password: PASSWORD });
  superAdminToken = saLogin.body.accessToken;

  slug = `it-planlimit-${RUN_ID}`;
  const registerRes = await request(app).post("/api/auth/register-clinic").send({
    clinicName: "Plan Limit Test Clinic",
    slug,
    ownerName: "Clinic Owner",
    ownerEmail: `it-pl-owner-${RUN_ID}@test.local`,
    ownerPassword: PASSWORD,
  });
  ownerToken = registerRes.body.accessToken;
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug } });
  tenantId = tenant.id;

  const location = await prisma.location.create({ data: { tenantId, name: "Main" } });
  locationId = location.id;
}, 30000);

afterAll(async () => {
  await prisma.tenant.deleteMany({ where: { slug: { endsWith: `-${RUN_ID}` } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `${RUN_ID}@test.local` } } });
});

describe("plan limits — doctors", () => {
  it("Free plan allows exactly 1 doctor, then blocks the second", async () => {
    const first = await request(app)
      .post("/api/admin/doctors")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ name: "Doctor One", email: `it-pl-doc1-${RUN_ID}@test.local`, password: PASSWORD, locationId });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/admin/doctors")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ name: "Doctor Two", email: `it-pl-doc2-${RUN_ID}@test.local`, password: PASSWORD, locationId });
    expect(second.status).toBe(400);
    expect(second.body.error).toMatch(/free plan/i);
  });

  it("upgrading to Pro lifts the doctor limit", async () => {
    await request(app)
      .patch(`/api/super-admin/tenants/${tenantId}/plan`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ plan: "PRO" });

    const res = await request(app)
      .post("/api/admin/doctors")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ name: "Doctor Two", email: `it-pl-doc2-${RUN_ID}@test.local`, password: PASSWORD, locationId });
    expect(res.status).toBe(201);

    // Back to Free for the appointment-limit tests below.
    await request(app)
      .patch(`/api/super-admin/tenants/${tenantId}/plan`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ plan: "FREE" });
  });
});

describe("plan limits — appointments", () => {
  it("Free plan blocks a 101st appointment this month, Pro lifts it", async () => {
    const doctor = await prisma.user.create({
      data: {
        name: "Volume Doctor",
        email: `it-pl-voldoc-${RUN_ID}@test.local`,
        passwordHash: await bcrypt.hash(PASSWORD, 4),
        role: "DOCTOR",
        locationId,
      },
    });
    await prisma.membership.create({ data: { userId: doctor.id, tenantId, role: "DOCTOR" } });
    await prisma.doctorSchedule.create({
      data: { tenantId, doctorId: doctor.id, dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
    });
    const service = await prisma.clinicService.create({ data: { tenantId, name: "Checkup", durationMinutes: 30 } });

    const patientLogin = await request(app)
      .post("/api/auth/register")
      .set("X-Tenant-Slug", slug)
      .send({ name: "Volume Patient", email: `it-pl-patient-${RUN_ID}@test.local`, password: PASSWORD });
    const patientToken = patientLogin.body.accessToken;

    // Seed 100 appointments directly (fast) rather than through the booking
    // flow — this test is about the volume cap, not slot-conflict logic.
    await prisma.appointment.createMany({
      data: Array.from({ length: 100 }, (_, i) => ({
        tenantId,
        patientId: patientLogin.body.user.id,
        doctorId: doctor.id,
        serviceId: service.id,
        date: new Date("2099-01-05T00:00:00.000Z"),
        time: `${String(9 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
        durationMinutes: 30,
        status: "APPROVED",
      })),
    });

    const blocked = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${patientToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ doctorId: doctor.id, serviceId: service.id, date: "2099-01-12", time: "09:00" });
    expect(blocked.status).toBe(400);
    expect(blocked.body.error).toMatch(/free plan/i);

    await request(app)
      .patch(`/api/super-admin/tenants/${tenantId}/plan`)
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({ plan: "PRO" });

    const allowed = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${patientToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ doctorId: doctor.id, serviceId: service.id, date: "2099-01-12", time: "09:00" });
    expect(allowed.status).toBe(201);
  });
});

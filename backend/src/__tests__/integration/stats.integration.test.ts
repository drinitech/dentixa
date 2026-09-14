import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../../app";
import { prismaUnscoped as prisma } from "../../lib/prisma";

// Milestone 5 dashboard additions (todayCount/thisWeekCount/noShowRate/
// topServices/estimatedRevenue) computed from a controlled fixture, since
// the shared A/B fixture in isolation.integration.test.ts has no DONE/
// NO_SHOW appointments or priced services to do this math against.
const app = createApp();
const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const PASSWORD = "IntegrationTest123!";

function utcDate(daysFromToday: number): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d;
}

let tenantId: string;
let slug: string;
let ownerToken: string;

beforeAll(async () => {
  slug = `it-stats-${RUN_ID}`;
  const passwordHash = await bcrypt.hash(PASSWORD, 4);

  const tenant = await prisma.tenant.create({ data: { name: "Stats Test Clinic", slug } });
  tenantId = tenant.id;

  const owner = await prisma.user.create({
    data: { name: "Stats Owner", email: `it-stats-owner-${RUN_ID}@test.local`, passwordHash, role: "ADMIN" },
  });
  await prisma.membership.create({ data: { userId: owner.id, tenantId, role: "OWNER" } });

  const doctor = await prisma.user.create({
    data: { name: "Stats Doctor", email: `it-stats-doctor-${RUN_ID}@test.local`, passwordHash, role: "DOCTOR" },
  });
  await prisma.membership.create({ data: { userId: doctor.id, tenantId, role: "DOCTOR" } });

  const patient = await prisma.user.create({
    data: { name: "Stats Patient", email: `it-stats-patient-${RUN_ID}@test.local`, passwordHash, role: "PATIENT" },
  });
  await prisma.membership.create({ data: { userId: patient.id, tenantId, role: "PATIENT" } });

  const cleaning = await prisma.clinicService.create({
    data: { tenantId, name: "Cleaning", durationMinutes: 30, price: 50 },
  });
  const whitening = await prisma.clinicService.create({
    data: { tenantId, name: "Whitening", durationMinutes: 60, price: 100 },
  });

  const loginRes = await request(app).post("/api/auth/login").send({ email: owner.email, password: PASSWORD });
  ownerToken = loginRes.body.accessToken;

  async function makeAppointment(opts: {
    date: Date;
    time: string;
    status: "PENDING" | "DONE" | "NO_SHOW";
    serviceId?: string;
  }) {
    await prisma.appointment.create({
      data: {
        tenantId,
        patientId: patient.id,
        doctorId: doctor.id,
        serviceId: opts.serviceId,
        date: opts.date,
        time: opts.time,
        durationMinutes: 30,
        status: opts.status,
      },
    });
  }

  await Promise.all([
    // Today: one DONE (cleaning, $50) and one NO_SHOW.
    makeAppointment({ date: utcDate(0), time: "09:00", status: "DONE", serviceId: cleaning.id }),
    makeAppointment({ date: utcDate(0), time: "10:00", status: "NO_SHOW" }),
    // Earlier this week (but not today): one DONE (whitening, $100).
    makeAppointment({ date: utcDate(-1), time: "09:00", status: "DONE", serviceId: whitening.id }),
    // Two more DONE cleanings so it outranks whitening as the top service.
    makeAppointment({ date: utcDate(-2), time: "09:00", status: "DONE", serviceId: cleaning.id }),
    makeAppointment({ date: utcDate(-3), time: "09:00", status: "DONE", serviceId: cleaning.id }),
    // Far in the future — shouldn't count toward today/this-week/revenue.
    makeAppointment({ date: utcDate(60), time: "09:00", status: "PENDING" }),
  ]);
}, 30000);

afterAll(async () => {
  await prisma.tenant.deleteMany({ where: { slug: { endsWith: `-${RUN_ID}` } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `${RUN_ID}@test.local` } } });
});

describe("admin dashboard stats", () => {
  it("computes today/week counts, no-show rate, top services, and estimated revenue", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug);

    expect(res.status).toBe(200);
    const { stats } = res.body;

    // Today: 1 DONE + 1 NO_SHOW.
    expect(stats.todayCount).toBe(2);
    // This week: today's 2 + yesterday's 1 + the day-before's 1 = 4 (the
    // future appointment and anything before this week's start don't count).
    expect(stats.thisWeekCount).toBe(4);

    // 4 DONE total (3 cleaning + 1 whitening) + 1 NO_SHOW => 1/5 = 20%.
    expect(stats.noShowRate).toBeCloseTo(20, 5);

    expect(stats.topServices[0]).toMatchObject({ serviceName: "Cleaning", count: 3 });

    // Revenue: 3 * $50 (cleaning) + 1 * $100 (whitening) = $250. The
    // PENDING/NO_SHOW appointments contribute nothing.
    expect(stats.estimatedRevenue).toBe(250);

    // Plan info (Milestone 7): fresh tenant is Free, 1 doctor seeded in
    // beforeAll, 6 appointments created this month (all but the far-future one).
    expect(stats).toMatchObject({
      plan: "FREE",
      doctorCount: 1,
      doctorLimit: 1,
      appointmentsThisMonth: 6,
      appointmentMonthlyLimit: 100,
    });
  });

  it("a fresh tenant with no appointments gets zeroed stats, not errors", async () => {
    const emptySlug = `it-stats-empty-${RUN_ID}`;
    const registerRes = await request(app).post("/api/auth/register-clinic").send({
      clinicName: "Empty Stats Clinic",
      slug: emptySlug,
      ownerName: "Empty Owner",
      ownerEmail: `it-stats-empty-owner-${RUN_ID}@test.local`,
      ownerPassword: PASSWORD,
    });

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${registerRes.body.accessToken}`)
      .set("X-Tenant-Slug", emptySlug);

    expect(res.status).toBe(200);
    expect(res.body.stats).toMatchObject({
      todayCount: 0,
      thisWeekCount: 0,
      noShowRate: 0,
      topServices: [],
      estimatedRevenue: 0,
    });
  });
});

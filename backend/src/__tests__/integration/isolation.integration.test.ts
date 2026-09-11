import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../../app";
import { prismaUnscoped as prisma } from "../../lib/prisma";

// Proves the core Milestone 2 guarantee end-to-end, through real HTTP
// requests against the real Express app and a real Postgres database (the
// Prisma extension in lib/prisma.ts can't be meaningfully tested against a
// mock — mocking it would only prove the mock behaves, not that isolation
// actually holds): a user correctly authenticated into their own tenant can
// never reach another tenant's row, even by guessing its id.
//
// Runs against the dev database (see vitest.integration.config.ts / `npm run
// test:integration`) using fully disposable, uniquely-prefixed fixtures
// cleaned up in afterAll — never the fast mocked unit suite (`npm test`).

const app = createApp();
const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const PASSWORD = "IntegrationTest123!";

interface TenantFixture {
  tenantId: string;
  slug: string;
  owner: { id: string; token: string };
  doctor: { id: string; token: string };
  patient: { id: string; token: string };
  spare: { id: string; token: string }; // untouched by any earlier case, for the one test allowed to attempt a real mutation
  locationId: string;
  serviceId: string;
  appointmentId: string;
  exceptionId: string;
  waitlistEntryId: string;
  recallId: string;
  holidayId: string;
}

async function login(email: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${JSON.stringify(res.body)}`);
  return res.body.accessToken as string;
}

async function createTenantFixture(label: "a" | "b"): Promise<TenantFixture> {
  const slug = `it-tenant-${label}-${RUN_ID}`;
  const tenant = await prisma.tenant.create({ data: { name: `Integration Tenant ${label.toUpperCase()}`, slug } });
  // Low cost factor — this hash is only ever compared in-process during these tests, never persisted long-term.
  const passwordHash = await bcrypt.hash(PASSWORD, 4);

  async function makeUser(role: "ADMIN" | "DOCTOR" | "PATIENT", membershipRole: "OWNER" | "DOCTOR" | "PATIENT", tag: string) {
    const user = await prisma.user.create({
      data: { name: `${tag} ${label}`, email: `it-${tag}-${label}-${RUN_ID}@test.local`, passwordHash, role },
    });
    await prisma.membership.create({ data: { userId: user.id, tenantId: tenant.id, role: membershipRole } });
    return user;
  }

  const [ownerUser, doctorUser, patientUser, spareUser] = await Promise.all([
    makeUser("ADMIN", "OWNER", "owner"),
    makeUser("DOCTOR", "DOCTOR", "doctor"),
    makeUser("PATIENT", "PATIENT", "patient"),
    makeUser("PATIENT", "PATIENT", "spare"),
  ]);

  const location = await prisma.location.create({ data: { tenantId: tenant.id, name: `Location ${label}` } });
  const service = await prisma.clinicService.create({
    data: { tenantId: tenant.id, name: `Service ${label}`, durationMinutes: 30 },
  });
  await prisma.doctorSchedule.create({
    data: { tenantId: tenant.id, doctorId: doctorUser.id, dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
  });

  const appointment = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      patientId: patientUser.id,
      doctorId: doctorUser.id,
      serviceId: service.id,
      date: new Date("2099-01-05T00:00:00.000Z"),
      time: "09:00",
      durationMinutes: 30,
      status: "PENDING",
    },
  });

  const exception = await prisma.scheduleException.create({
    data: { tenantId: tenant.id, doctorId: doctorUser.id, date: new Date("2099-06-01T00:00:00.000Z") },
  });

  const holiday = await prisma.clinicHoliday.create({
    data: { tenantId: tenant.id, date: new Date("2099-12-25T00:00:00.000Z"), locationId: location.id },
  });

  const waitlistEntry = await prisma.waitlist.create({
    data: {
      tenantId: tenant.id,
      patientId: patientUser.id,
      doctorId: doctorUser.id,
      serviceId: service.id,
      date: new Date("2099-07-01T00:00:00.000Z"),
    },
  });

  const recall = await prisma.recallReminder.create({
    data: {
      tenantId: tenant.id,
      patientId: patientUser.id,
      doctorId: doctorUser.id,
      serviceId: service.id,
      sourceAppointmentId: appointment.id,
      dueDate: new Date("2099-08-01T00:00:00.000Z"),
    },
  });

  const [ownerToken, doctorToken, patientToken, spareToken] = await Promise.all([
    login(ownerUser.email),
    login(doctorUser.email),
    login(patientUser.email),
    login(spareUser.email),
  ]);

  return {
    tenantId: tenant.id,
    slug,
    owner: { id: ownerUser.id, token: ownerToken },
    doctor: { id: doctorUser.id, token: doctorToken },
    patient: { id: patientUser.id, token: patientToken },
    spare: { id: spareUser.id, token: spareToken },
    locationId: location.id,
    serviceId: service.id,
    appointmentId: appointment.id,
    exceptionId: exception.id,
    waitlistEntryId: waitlistEntry.id,
    recallId: recall.id,
    holidayId: holiday.id,
  };
}

let a: TenantFixture;
let b: TenantFixture;

beforeAll(async () => {
  [a, b] = await Promise.all([createTenantFixture("a"), createTenantFixture("b")]);
}, 30000);

afterAll(async () => {
  // Matched by RUN_ID pattern rather than referencing `a`/`b` directly —
  // if beforeAll throws partway through creating one tenant's fixture, the
  // other tenant's rows (and any of this one's rows created before the
  // failure) must still get cleaned up, not orphaned in the dev database.
  // Cascades (schema-level onDelete: Cascade from every tenant-scoped model
  // back to Tenant) clean up Membership, Location, ClinicService,
  // DoctorSchedule, ScheduleException, ClinicHoliday, Waitlist, Appointment,
  // and RecallReminder automatically — only the User rows need an explicit delete.
  await prisma.tenant.deleteMany({ where: { slug: { endsWith: `-${RUN_ID}` } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `${RUN_ID}@test.local` } } });
});

describe("cross-tenant isolation", () => {
  interface Case {
    name: string;
    method: "get" | "post" | "patch" | "put" | "delete";
    path: (target: TenantFixture) => string;
    actorToken: (actor: TenantFixture) => string;
    body?: object;
  }

  // Every case: the actor is genuinely, validly authenticated into their OWN
  // tenant (b) — the interesting failure mode isn't "no membership at all"
  // (already covered by the "no membership in the addressed tenant" case
  // below) but a legitimately-authorized member of tenant B reaching
  // tenant A's row by id. Every one of these must 404, not 403 — the
  // Prisma extension's tenantId filter should make the row invisible before
  // any ownership/role check even runs.
  const cases: Case[] = [
    { name: "approve appointment", method: "patch", path: (t) => `/api/appointments/${t.appointmentId}/approve`, actorToken: (x) => x.doctor.token },
    { name: "reject appointment", method: "patch", path: (t) => `/api/appointments/${t.appointmentId}/reject`, actorToken: (x) => x.doctor.token },
    { name: "cancel appointment", method: "patch", path: (t) => `/api/appointments/${t.appointmentId}/cancel`, actorToken: (x) => x.patient.token },
    { name: "complete appointment", method: "patch", path: (t) => `/api/appointments/${t.appointmentId}/complete`, actorToken: (x) => x.doctor.token },
    { name: "mark appointment no-show", method: "patch", path: (t) => `/api/appointments/${t.appointmentId}/no-show`, actorToken: (x) => x.doctor.token },
    { name: "update appointment visit notes", method: "patch", path: (t) => `/api/appointments/${t.appointmentId}/notes`, actorToken: (x) => x.doctor.token, body: { visitNotes: "hacked" } },
    { name: "review appointment", method: "post", path: (t) => `/api/appointments/${t.appointmentId}/review`, actorToken: (x) => x.patient.token, body: { rating: 5 } },
    { name: "admin override-cancel appointment", method: "patch", path: (t) => `/api/admin/appointments/${t.appointmentId}/cancel`, actorToken: (x) => x.owner.token },
    { name: "delete schedule exception", method: "delete", path: (t) => `/api/schedule/exceptions/${t.exceptionId}`, actorToken: (x) => x.doctor.token },
    { name: "leave waitlist", method: "delete", path: (t) => `/api/waitlist/${t.waitlistEntryId}`, actorToken: (x) => x.patient.token },
    { name: "dismiss recall", method: "patch", path: (t) => `/api/recalls/${t.recallId}/dismiss`, actorToken: (x) => x.patient.token },
    { name: "delete clinic holiday", method: "delete", path: (t) => `/api/admin/clinic-holidays/${t.holidayId}`, actorToken: (x) => x.owner.token },
    { name: "update location", method: "patch", path: (t) => `/api/admin/locations/${t.locationId}`, actorToken: (x) => x.owner.token, body: { name: "hacked" } },
    { name: "update service", method: "patch", path: (t) => `/api/admin/services/${t.serviceId}`, actorToken: (x) => x.owner.token, body: { name: "hacked" } },
    { name: "update doctor", method: "patch", path: (t) => `/api/admin/doctors/${t.doctor.id}`, actorToken: (x) => x.owner.token, body: { name: "hacked" } },
    { name: "get doctor's offered services", method: "get", path: (t) => `/api/admin/doctors/${t.doctor.id}/services`, actorToken: (x) => x.owner.token },
    { name: "set doctor's offered services", method: "put", path: (t) => `/api/admin/doctors/${t.doctor.id}/services`, actorToken: (x) => x.owner.token, body: { serviceIds: [] } },
    { name: "ban user", method: "patch", path: (t) => `/api/admin/users/${t.patient.id}/ban`, actorToken: (x) => x.owner.token },
    { name: "unban user", method: "patch", path: (t) => `/api/admin/users/${t.patient.id}/unban`, actorToken: (x) => x.owner.token },
    { name: "reset user password", method: "post", path: (t) => `/api/admin/users/${t.patient.id}/reset-password`, actorToken: (x) => x.owner.token },
  ];

  for (const c of cases) {
    it(`${c.name}: tenant B cannot act on tenant A's resource by id (404)`, async () => {
      const req = request(app)
        [c.method](c.path(a))
        .set("Authorization", `Bearer ${c.actorToken(b)}`)
        .set("X-Tenant-Slug", b.slug);
      const res = c.body ? await req.send(c.body) : await req;
      expect(res.status).toBe(404);
    });
  }

  // Run last, and against the spare user nothing else touches — a false
  // negative here (a bug that lets it through) must not corrupt any other
  // case's fixtures.
  it("delete user: tenant B cannot delete tenant A's user by id (404)", async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${a.spare.id}`)
      .set("Authorization", `Bearer ${b.owner.token}`)
      .set("X-Tenant-Slug", b.slug);
    expect(res.status).toBe(404);
  });

  it("a user with no membership at all in the addressed tenant gets 404", async () => {
    const res = await request(app)
      .get("/api/admin/doctors")
      .set("Authorization", `Bearer ${b.owner.token}`)
      .set("X-Tenant-Slug", a.slug);
    expect(res.status).toBe(404);
  });

  describe("listing endpoints don't leak the other tenant's rows", () => {
    it("GET /doctors as tenant B never includes tenant A's doctor", async () => {
      const res = await request(app)
        .get("/api/doctors")
        .set("Authorization", `Bearer ${b.patient.token}`)
        .set("X-Tenant-Slug", b.slug);
      expect(res.status).toBe(200);
      expect(res.body.doctors.map((d: { id: string }) => d.id)).not.toContain(a.doctor.id);
    });

    it("GET /locations as tenant B never includes tenant A's location", async () => {
      const res = await request(app)
        .get("/api/locations")
        .set("Authorization", `Bearer ${b.patient.token}`)
        .set("X-Tenant-Slug", b.slug);
      expect(res.status).toBe(200);
      expect(res.body.locations.map((l: { id: string }) => l.id)).not.toContain(a.locationId);
    });

    it("GET /services as tenant B never includes tenant A's service", async () => {
      const res = await request(app)
        .get("/api/services")
        .set("Authorization", `Bearer ${b.patient.token}`)
        .set("X-Tenant-Slug", b.slug);
      expect(res.status).toBe(200);
      expect(res.body.services.map((s: { id: string }) => s.id)).not.toContain(a.serviceId);
    });

    it("GET /admin/appointments as tenant B owner never includes tenant A's appointment", async () => {
      const res = await request(app)
        .get("/api/admin/appointments")
        .set("Authorization", `Bearer ${b.owner.token}`)
        .set("X-Tenant-Slug", b.slug);
      expect(res.status).toBe(200);
      expect(res.body.appointments.map((appt: { id: string }) => appt.id)).not.toContain(a.appointmentId);
    });

    it("GET /admin/users as tenant B owner never includes tenant A's patient", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${b.owner.token}`)
        .set("X-Tenant-Slug", b.slug);
      expect(res.status).toBe(200);
      expect(res.body.users.map((u: { id: string }) => u.id)).not.toContain(a.patient.id);
    });
  });

  describe("the concurrent-booking guarantee still holds within a tenant", () => {
    it("two simultaneous bookings for the same slot: only one succeeds", async () => {
      // Fresh doctor+schedule (not the shared fixture's) so this can't
      // collide with the tenant A appointment fixture already occupying 09:00.
      const doctor = await prisma.user.create({
        data: { name: "Race Doctor", email: `it-race-doctor-${RUN_ID}@test.local`, passwordHash: await bcrypt.hash(PASSWORD, 4), role: "DOCTOR" },
      });
      await prisma.membership.create({ data: { userId: doctor.id, tenantId: a.tenantId, role: "DOCTOR" } });
      await prisma.doctorSchedule.create({
        data: { tenantId: a.tenantId, doctorId: doctor.id, dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      });

      const body = { doctorId: doctor.id, serviceId: a.serviceId, date: "2099-01-12", time: "10:00" };
      const [r1, r2] = await Promise.all([
        request(app).post("/api/appointments").set("Authorization", `Bearer ${a.patient.token}`).set("X-Tenant-Slug", a.slug).send(body),
        request(app).post("/api/appointments").set("Authorization", `Bearer ${a.spare.token}`).set("X-Tenant-Slug", a.slug).send(body),
      ]);

      const statuses = [r1.status, r2.status].sort();
      expect(statuses).toEqual([201, 409]);

      await prisma.membership.deleteMany({ where: { userId: doctor.id } });
      await prisma.user.delete({ where: { id: doctor.id } });
    });
  });
});

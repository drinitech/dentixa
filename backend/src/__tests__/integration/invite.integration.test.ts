import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { prismaUnscoped as prisma } from "../../lib/prisma";

// sendEmail is mocked (kept real otherwise) so tests can pull the raw
// invite token out of the mailed link — the DB only ever stores its hash
// (see invite.service.ts), matching how a real invitee would get it. Vitest
// hoists vi.mock calls above every import in this file (including the
// static imports above), so createApp already resolves against the mocked
// module — no dynamic import() needed, which also avoids top-level await
// (unsupported by this project's CommonJS build target, see tsconfig.json).
// vi.mock is hoisted above every import in this file, so the mock fn it
// references must be too — plain `const sendEmailMock = vi.fn()` would
// throw "Cannot access before initialization" once hoisted.
const { sendEmailMock } = vi.hoisted(() => ({ sendEmailMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../services/notification.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/notification.service")>();
  return { ...actual, sendEmail: sendEmailMock };
});

// Real HTTP requests against the real app and real Postgres, mirroring
// isolation.integration.test.ts — the invite flow spans public (no tenant
// context) and OWNER-only (resolved tenant) routes, which isn't meaningfully
// testable with a mocked Prisma client.
const app = createApp();
const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const PASSWORD = "IntegrationTest123!";

function tokenFromLastEmail(): string {
  const html = sendEmailMock.mock.calls.at(-1)?.[2] as string;
  const match = html.match(/\/invite\/([^"<\s]+)/);
  if (!match) throw new Error(`no invite link found in mailed body: ${html}`);
  return match[1];
}

afterAll(async () => {
  await prisma.tenant.deleteMany({ where: { slug: { endsWith: `-${RUN_ID}` } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `${RUN_ID}@test.local` } } });
});

describe("clinic registration + staff invites", () => {
  const slug = `it-invite-${RUN_ID}`;
  let ownerToken: string;

  it("registers a new clinic and its owner", async () => {
    const res = await request(app).post("/api/auth/register-clinic").send({
      clinicName: `Invite Test Clinic ${RUN_ID}`,
      slug,
      ownerName: "Owner Person",
      ownerEmail: `it-owner-${RUN_ID}@test.local`,
      ownerPassword: PASSWORD,
    });

    expect(res.status).toBe(201);
    expect(res.body.tenantSlug).toBe(slug);
    expect(res.body.accessToken).toBeTruthy();
    ownerToken = res.body.accessToken;

    const membership = await prisma.membership.findFirst({ where: { user: { email: `it-owner-${RUN_ID}@test.local` } } });
    expect(membership?.role).toBe("OWNER");
  });

  it("self-registration with X-Tenant-Slug joins that clinic, not the demo tenant", async () => {
    const email = `it-patient-${RUN_ID}@test.local`;
    const res = await request(app)
      .post("/api/auth/register")
      .set("X-Tenant-Slug", slug)
      .send({ name: "Real Patient", email, password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.tenantSlug).toBe(slug);

    const user = await prisma.user.findUnique({ where: { email } });
    const memberships = await prisma.membership.findMany({ where: { userId: user!.id } });
    expect(memberships).toHaveLength(1);
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: memberships[0].tenantId } });
    expect(tenant.slug).toBe(slug);
    expect(tenant.slug).not.toBe("demo-clinic");
  });

  it("self-registration with no X-Tenant-Slug still falls back to the demo tenant", async () => {
    const email = `it-patient-nohdr-${RUN_ID}@test.local`;
    const res = await request(app).post("/api/auth/register").send({ name: "No Header Patient", email, password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.tenantSlug).toBe("demo-clinic");
  });

  it("rejects a duplicate slug", async () => {
    const res = await request(app).post("/api/auth/register-clinic").send({
      clinicName: "Another Clinic",
      slug,
      ownerName: "Someone Else",
      ownerEmail: `it-owner2-${RUN_ID}@test.local`,
      ownerPassword: PASSWORD,
    });
    expect(res.status).toBe(400);
  });

  it("invites a brand-new doctor by email, who accepts and gets a Membership", async () => {
    const email = `it-doctor-${RUN_ID}@test.local`;

    const inviteRes = await request(app)
      .post("/api/admin/invites")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ email, role: "DOCTOR" });
    expect(inviteRes.status).toBe(201);
    expect(sendEmailMock).toHaveBeenCalled();

    const token = tokenFromLastEmail();

    const preview = await request(app).get(`/api/invites/${token}`);
    expect(preview.status).toBe(200);
    expect(preview.body).toMatchObject({ email, role: "DOCTOR", existingAccount: false });

    const accept = await request(app)
      .post(`/api/invites/${token}/accept`)
      .send({ name: "New Doctor", password: PASSWORD });
    expect(accept.status).toBe(200);
    expect(accept.body.tenantSlug).toBe(slug);

    const user = await prisma.user.findUnique({ where: { email } });
    const membership = await prisma.membership.findFirst({ where: { userId: user!.id } });
    expect(membership?.role).toBe("DOCTOR");
    expect(membership?.status).toBe("ACTIVE");
  });

  it("invites an already-registered person, who accepts with their existing password", async () => {
    // A user who already has an account (e.g. a patient at another clinic)
    // registered independently via the normal /auth/register flow.
    const email = `it-existing-${RUN_ID}@test.local`;
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Existing Person",
      email,
      password: PASSWORD,
    });
    expect(registerRes.status).toBe(201);

    await request(app)
      .post("/api/admin/invites")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ email, role: "RECEPTIONIST" });
    const token = tokenFromLastEmail();

    const preview = await request(app).get(`/api/invites/${token}`);
    expect(preview.body.existingAccount).toBe(true);

    const wrongPassword = await request(app).post(`/api/invites/${token}/accept`).send({ password: "WrongPass123!" });
    expect(wrongPassword.status).toBe(401);

    const accept = await request(app).post(`/api/invites/${token}/accept`).send({ password: PASSWORD });
    expect(accept.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { email } });
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug } });
    const membership = await prisma.membership.findFirst({ where: { userId: user!.id, tenantId: tenant.id } });
    expect(membership?.role).toBe("RECEPTIONIST");
  });

  it("resending an invite replaces the previous token", async () => {
    const email = `it-resend-${RUN_ID}@test.local`;
    await request(app)
      .post("/api/admin/invites")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ email, role: "DOCTOR" });
    const oldToken = tokenFromLastEmail();

    await request(app)
      .post("/api/admin/invites")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ email, role: "DOCTOR" });
    const newToken = tokenFromLastEmail();

    expect(newToken).not.toBe(oldToken);
    expect((await request(app).get(`/api/invites/${oldToken}`)).status).toBe(400);
    expect((await request(app).get(`/api/invites/${newToken}`)).status).toBe(200);
  });

  it("a revoked invite can no longer be accepted", async () => {
    const email = `it-revoke-${RUN_ID}@test.local`;
    const inviteRes = await request(app)
      .post("/api/admin/invites")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ email, role: "DOCTOR" });
    const token = tokenFromLastEmail();
    const inviteId = inviteRes.body.invite.id as string;

    const revoke = await request(app)
      .delete(`/api/admin/invites/${inviteId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("X-Tenant-Slug", slug);
    expect(revoke.status).toBe(204);

    const accept = await request(app).post(`/api/invites/${token}/accept`).send({ name: "Nope", password: PASSWORD });
    expect(accept.status).toBe(400);
  });

  it("a non-owner cannot create invites", async () => {
    const doctorLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: `it-doctor-${RUN_ID}@test.local`, password: PASSWORD });
    const doctorToken = doctorLogin.body.accessToken;

    const res = await request(app)
      .post("/api/admin/invites")
      .set("Authorization", `Bearer ${doctorToken}`)
      .set("X-Tenant-Slug", slug)
      .send({ email: "someone@test.local", role: "DOCTOR" });
    expect(res.status).toBe(403);
  });
});

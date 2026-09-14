import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function seedNotificationPreferences(userId: string) {
  const channels = ["EMAIL", "SMS"] as const;
  const eventTypes = ["APPOINTMENT_CREATED", "APPOINTMENT_APPROVED", "APPOINTMENT_REJECTED", "REMINDER"] as const;
  await prisma.notificationPreference.createMany({
    data: channels.flatMap((channel) =>
      eventTypes.map((eventType) => ({ userId, channel, eventType, enabled: channel === "EMAIL" })),
    ),
    skipDuplicates: true,
  });
}

async function upsertMembership(userId: string, tenantId: string, role: "OWNER" | "DOCTOR" | "PATIENT") {
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId, tenantId } },
    update: { role },
    create: { userId, tenantId, role },
  });
}

// Mondays through Fridays, counting back from today, skipping weekends —
// used to spread seeded appointments across real past/near-future weekdays
// instead of hardcoding dates that go stale.
function weekday(offsetWeekdaysFromToday: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  let remaining = offsetWeekdaysFromToday;
  const step = remaining < 0 ? -1 : 1;
  while (remaining !== 0) {
    date.setUTCDate(date.getUTCDate() + step);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= step;
  }
  return date;
}

interface ClinicSeed {
  tenantId: string;
  tenantName: string;
  slug: string;
  timezone: string;
  plan: "FREE" | "PRO";
  locationId: string;
  locationName: string;
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
  doctors: { email: string; name: string; specialty: string; password: string }[];
  patients: { email: string; name: string; password: string }[];
  services: { name: string; durationMinutes: number; price: number }[];
}

async function seedClinic(seed: ClinicSeed) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: seed.slug },
    update: {},
    create: { id: seed.tenantId, name: seed.tenantName, slug: seed.slug, timezone: seed.timezone, plan: seed.plan },
  });

  const location = await prisma.location.upsert({
    where: { id: seed.locationId },
    update: {},
    create: { id: seed.locationId, name: seed.locationName, tenantId: tenant.id },
  });

  const ownerPasswordHash = await bcrypt.hash(seed.ownerPassword, SALT_ROUNDS);
  const owner = await prisma.user.upsert({
    where: { email: seed.ownerEmail },
    update: {},
    create: { name: seed.ownerName, email: seed.ownerEmail, passwordHash: ownerPasswordHash, role: "ADMIN" },
  });
  await seedNotificationPreferences(owner.id);
  await upsertMembership(owner.id, tenant.id, "OWNER");

  const doctors = await Promise.all(
    seed.doctors.map(async (d) => {
      const passwordHash = await bcrypt.hash(d.password, SALT_ROUNDS);
      return prisma.user.upsert({
        where: { email: d.email },
        update: {},
        create: {
          name: d.name,
          email: d.email,
          passwordHash,
          role: "DOCTOR",
          specialty: d.specialty,
          phone: "+355600000000",
          locationId: location.id,
        },
      });
    }),
  );
  for (const doctor of doctors) {
    await seedNotificationPreferences(doctor.id);
    await upsertMembership(doctor.id, tenant.id, "DOCTOR");
    await prisma.doctorSchedule.deleteMany({ where: { tenantId: tenant.id, doctorId: doctor.id } });
    await prisma.doctorSchedule.createMany({
      data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        tenantId: tenant.id,
        doctorId: doctor.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
      })),
    });
  }

  const patients = await Promise.all(
    seed.patients.map(async (p) => {
      const passwordHash = await bcrypt.hash(p.password, SALT_ROUNDS);
      const patient = await prisma.user.upsert({
        where: { email: p.email },
        update: {},
        create: { name: p.name, email: p.email, passwordHash, role: "PATIENT", phone: "+355699999999" },
      });
      await seedNotificationPreferences(patient.id);
      await upsertMembership(patient.id, tenant.id, "PATIENT");
      return patient;
    }),
  );

  const services = await Promise.all(
    seed.services.map(async (s) => {
      const existing = await prisma.clinicService.findFirst({ where: { tenantId: tenant.id, name: s.name } });
      if (existing) return existing;
      return prisma.clinicService.create({ data: { ...s, tenantId: tenant.id } });
    }),
  );

  return { tenant, location, owner, doctors, patients, services };
}

// Deterministically distributes appointments across weekdays/doctors/services
// so a freshly seeded clinic's dashboard (monthly trend, per-doctor chart, top
// services, revenue) isn't empty — statuses and dates are picked to look like
// real usage: mostly DONE in the past, a few APPROVED/PENDING soon, one
// REJECTED and one NO_SHOW for realism. Skips entirely if the clinic already
// has appointments, so this only runs once per environment.
async function seedAppointmentHistory(
  tenantId: string,
  doctors: { id: string }[],
  patients: { id: string }[],
  services: { id: string; durationMinutes: number }[],
) {
  const existingCount = await prisma.appointment.count({ where: { tenantId } });
  if (existingCount > 0) return;

  const plan: { weekdaysAgo: number; time: string; status: "DONE" | "APPROVED" | "PENDING" | "REJECTED" | "NO_SHOW" }[] = [
    { weekdaysAgo: -45, time: "09:00", status: "DONE" },
    { weekdaysAgo: -42, time: "10:00", status: "DONE" },
    { weekdaysAgo: -38, time: "11:30", status: "DONE" },
    { weekdaysAgo: -35, time: "14:00", status: "DONE" },
    { weekdaysAgo: -30, time: "09:30", status: "NO_SHOW" },
    { weekdaysAgo: -25, time: "15:00", status: "DONE" },
    { weekdaysAgo: -20, time: "10:30", status: "DONE" },
    { weekdaysAgo: -18, time: "13:00", status: "DONE" },
    { weekdaysAgo: -14, time: "09:00", status: "DONE" },
    { weekdaysAgo: -12, time: "11:00", status: "REJECTED" },
    { weekdaysAgo: -8, time: "14:30", status: "DONE" },
    { weekdaysAgo: -5, time: "10:00", status: "DONE" },
    { weekdaysAgo: -2, time: "16:00", status: "DONE" },
    { weekdaysAgo: 0, time: "09:30", status: "APPROVED" },
    { weekdaysAgo: 3, time: "11:00", status: "APPROVED" },
    { weekdaysAgo: 6, time: "14:00", status: "PENDING" },
  ];

  const reviewComments = [
    "Very professional and gentle, would recommend.",
    "Quick appointment, no waiting around.",
    "Explained everything clearly before starting.",
    "Friendly staff, clean clinic.",
  ];

  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    const doctor = doctors[i % doctors.length];
    const patient = patients[i % patients.length];
    const service = services[i % services.length];

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        patientId: patient.id,
        doctorId: doctor.id,
        serviceId: service.id,
        date: weekday(p.weekdaysAgo),
        time: p.time,
        durationMinutes: service.durationMinutes,
        status: p.status,
        rejectionReason: p.status === "REJECTED" ? "Doctor unavailable at short notice" : undefined,
      },
    });

    if (p.status === "DONE" && i % 2 === 0) {
      await prisma.review.create({
        data: {
          tenantId,
          appointmentId: appointment.id,
          patientId: patient.id,
          doctorId: doctor.id,
          rating: 4 + (i % 2),
          comment: reviewComments[i % reviewComments.length],
        },
      });
    }
  }
}

async function main() {
  const superAdminPasswordHash = await bcrypt.hash("superadmin123", SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: "superadmin@dentixa.com" },
    update: { isSuperAdmin: true },
    create: {
      name: "Platform Super Admin",
      email: "superadmin@dentixa.com",
      passwordHash: superAdminPasswordHash,
      role: "ADMIN",
      isSuperAdmin: true,
    },
  });

  // Demo tenant #1 — Free plan, the clinic every pre-Milestone-3 seed
  // account and any real historical usage already belongs to.
  await seedClinic({
    tenantId: "demo-clinic",
    tenantName: "Dentixa Demo Clinic",
    slug: "demo-clinic",
    timezone: "Europe/Belgrade",
    plan: "FREE",
    locationId: "default-clinic",
    locationName: "Klinika Kryesore",
    ownerEmail: "admin@dentixa.com",
    ownerName: "Clinic Admin",
    ownerPassword: "admin123",
    doctors: [
      { email: "elira@dentixa.com", name: "Dr. Elira Krasniqi", specialty: "Orthodentist", password: "doctor123" },
      { email: "arben@dentixa.com", name: "Dr. Arben Hoxha", specialty: "Stomatolog", password: "doctor123" },
    ],
    patients: [{ email: "patient@dentixa.com", name: "Test Patient", password: "patient123" }],
    services: [
      { name: "Checkup", durationMinutes: 30, price: 20 },
      { name: "Cleaning", durationMinutes: 45, price: 35 },
      { name: "Extraction", durationMinutes: 60, price: 60 },
      { name: "Whitening", durationMinutes: 60, price: 80 },
    ],
  });

  // Demo tenant #2 — a second, fully independent clinic on the Pro plan, so
  // the two seeded tenants together demonstrate both plan tiers and prove
  // data isolation with two genuinely different-looking clinics rather than
  // two copies of the same one.
  const brightSmile = await seedClinic({
    tenantId: "brightsmile-dental",
    tenantName: "BrightSmile Dental",
    slug: "brightsmile-dental",
    timezone: "Europe/Belgrade",
    plan: "PRO",
    locationId: "brightsmile-prizren",
    locationName: "BrightSmile Prizren",
    ownerEmail: "owner@brightsmile.dental",
    ownerName: "Blerta Gashi",
    ownerPassword: "owner123",
    doctors: [
      { email: "fatmir@brightsmile.dental", name: "Dr. Fatmir Berisha", specialty: "Oral Surgeon", password: "doctor123" },
      { email: "vjollca@brightsmile.dental", name: "Dr. Vjollca Rama", specialty: "Orthodontist", password: "doctor123" },
    ],
    patients: [
      { email: "endrit@brightsmile.dental", name: "Endrit Krasniqi", password: "patient123" },
      { email: "arta@brightsmile.dental", name: "Arta Meta", password: "patient123" },
    ],
    services: [
      { name: "Checkup", durationMinutes: 30, price: 25 },
      { name: "Cleaning", durationMinutes: 45, price: 40 },
      { name: "Whitening", durationMinutes: 60, price: 90 },
      { name: "Root Canal", durationMinutes: 90, price: 120 },
      { name: "Braces Consultation", durationMinutes: 30, price: 30 },
    ],
  });
  await seedAppointmentHistory(brightSmile.tenant.id, brightSmile.doctors, brightSmile.patients, brightSmile.services);

  console.log("Seed complete:");
  console.log("  Super Admin:        superadmin@dentixa.com / superadmin123");
  console.log("  demo-clinic (Free): admin@dentixa.com / admin123");
  console.log("                      elira@dentixa.com, arben@dentixa.com / doctor123");
  console.log("                      patient@dentixa.com / patient123");
  console.log("  brightsmile-dental (Pro): owner@brightsmile.dental / owner123");
  console.log("                      fatmir@brightsmile.dental, vjollca@brightsmile.dental / doctor123");
  console.log("                      endrit@brightsmile.dental, arta@brightsmile.dental / patient123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

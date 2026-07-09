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

async function main() {
  const mainClinic = await prisma.clinic.upsert({
    where: { id: "default-clinic" },
    update: {},
    create: { id: "default-clinic", name: "Klinika Kryesore" },
  });

  const adminPasswordHash = await bcrypt.hash("admin123", SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dentixa.com" },
    update: {},
    create: { name: "Clinic Admin", email: "admin@dentixa.com", passwordHash: adminPasswordHash, role: "ADMIN" },
  });
  await seedNotificationPreferences(admin.id);

  const doctorPasswordHash = await bcrypt.hash("doctor123", SALT_ROUNDS);
  const doctors = await Promise.all(
    [
      { name: "Dr. Elira Krasniqi", email: "elira@dentixa.com" },
      { name: "Dr. Arben Hoxha", email: "arben@dentixa.com" },
    ].map((d) =>
      prisma.user.upsert({
        where: { email: d.email },
        update: {},
        create: {
          ...d,
          passwordHash: doctorPasswordHash,
          role: "DOCTOR",
          phone: "+355600000000",
          clinicId: mainClinic.id,
        },
      }),
    ),
  );
  for (const doctor of doctors) await seedNotificationPreferences(doctor.id);

  for (const doctor of doctors) {
    await prisma.doctorSchedule.deleteMany({ where: { doctorId: doctor.id } });
    // Monday(1) - Friday(5), 09:00-17:00
    await prisma.doctorSchedule.createMany({
      data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        doctorId: doctor.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
      })),
    });
  }

  const patientPasswordHash = await bcrypt.hash("patient123", SALT_ROUNDS);
  const patient = await prisma.user.upsert({
    where: { email: "patient@dentixa.com" },
    update: {},
    create: {
      name: "Test Patient",
      email: "patient@dentixa.com",
      passwordHash: patientPasswordHash,
      role: "PATIENT",
      phone: "+355699999999",
    },
  });
  await seedNotificationPreferences(patient.id);

  const services = [
    { name: "Checkup", durationMinutes: 30, price: 20 },
    { name: "Cleaning", durationMinutes: 45, price: 35 },
    { name: "Extraction", durationMinutes: 60, price: 60 },
    { name: "Whitening", durationMinutes: 60, price: 80 },
  ];
  for (const service of services) {
    const existing = await prisma.clinicService.findFirst({ where: { name: service.name } });
    if (!existing) await prisma.clinicService.create({ data: service });
  }

  console.log("Seed complete:");
  console.log("  Admin:   admin@dentixa.com / admin123");
  console.log("  Doctors: elira@dentixa.com, arben@dentixa.com / doctor123");
  console.log("  Patient: patient@dentixa.com / patient123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

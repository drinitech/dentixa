import { prisma } from "../lib/prisma";
import { BadRequestError } from "../errors/BadRequestError";
import type { UpdateNotificationPreferencesInput, UpdateProfileInput } from "../validations/user.schema";

export async function updateAvatar(userId: string, avatarUrl: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, specialty: true },
  });
}

export async function updateSpecialty(userId: string, specialty: string | null) {
  return prisma.user.update({
    where: { id: userId },
    data: { specialty },
    select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, specialty: true },
  });
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  if (input.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.id !== userId) {
      throw new BadRequestError("An account with this email already exists");
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, specialty: true },
  });
}

export async function getNotificationPreferences(userId: string) {
  return prisma.notificationPreference.findMany({ where: { userId } });
}

export async function updateNotificationPreferences(userId: string, input: UpdateNotificationPreferencesInput) {
  await prisma.$transaction(
    input.preferences.map((p) =>
      prisma.notificationPreference.upsert({
        where: { userId_channel_eventType: { userId, channel: p.channel, eventType: p.eventType } },
        create: { userId, channel: p.channel, eventType: p.eventType, enabled: p.enabled },
        update: { enabled: p.enabled },
      }),
    ),
  );
  return getNotificationPreferences(userId);
}

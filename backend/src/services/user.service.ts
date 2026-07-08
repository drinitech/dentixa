import { prisma } from "../lib/prisma";
import type { UpdateNotificationPreferencesInput } from "../validations/user.schema";

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

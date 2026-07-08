import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import twilio from "twilio";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import type { NotificationChannel, NotificationEventType } from "@prisma/client";

const EVENT_TYPES: NotificationEventType[] = [
  "APPOINTMENT_CREATED",
  "APPOINTMENT_APPROVED",
  "APPOINTMENT_REJECTED",
  "REMINDER",
];
const CHANNELS: NotificationChannel[] = ["EMAIL", "SMS"];

// Every user gets a preference row per channel/event-type combo so the profile
// page always has something to render and `notify()` never has to guess a default.
export async function seedDefaultNotificationPreferences(userId: string) {
  const rows = CHANNELS.flatMap((channel) =>
    EVENT_TYPES.map((eventType) => ({
      userId,
      channel,
      eventType,
      // SMS starts disabled by default (it's the optional channel per the spec);
      // email starts enabled.
      enabled: channel === "EMAIL",
    })),
  );
  await prisma.notificationPreference.createMany({ data: rows, skipDuplicates: true });
}

let cachedTransporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn("SMTP env vars not set — emails will be logged instead of sent");
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransporter;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    logger.info(`[email stub] to=${to} subject="${subject}"\n${body}`);
    return;
  }
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html: body });
}

let cachedTwilioClient: ReturnType<typeof twilio> | null | undefined;

function getTwilioClient() {
  if (cachedTwilioClient !== undefined) return cachedTwilioClient;

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    cachedTwilioClient = null;
    return cachedTwilioClient;
  }
  cachedTwilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return cachedTwilioClient;
}

export async function sendSms(to: string, body: string): Promise<void> {
  const client = getTwilioClient();
  if (!client) {
    logger.info(`[sms stub] to=${to}: ${body}`);
    return;
  }
  await client.messages.create({ to, from: process.env.TWILIO_FROM_NUMBER, body });
}

interface NotifyPayload {
  subject: string;
  emailBody: string;
  smsBody: string;
}

// Looks up the user's preference for this event type per channel and sends
// only through channels the user has enabled. Never throws — a notification
// failure (bad SMTP creds, Twilio down) must never fail the underlying mutation.
export async function notify(userId: string, eventType: NotificationEventType, payload: NotifyPayload) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const prefs = await prisma.notificationPreference.findMany({
      where: { userId, eventType },
    });

    const emailEnabled = prefs.find((p) => p.channel === "EMAIL")?.enabled ?? true;
    const smsEnabled = prefs.find((p) => p.channel === "SMS")?.enabled ?? false;

    if (emailEnabled) {
      await sendEmail(user.email, payload.subject, payload.emailBody);
    }
    if (smsEnabled && user.phone) {
      await sendSms(user.phone, payload.smsBody);
    }
  } catch (err) {
    logger.warn(`notify() failed for user=${userId} event=${eventType}:`, err);
  }
}

"use client";

import { toast } from "sonner";
import { History } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PageLoading } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { useAuth } from "@/lib/auth-context";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/use-notification-preferences";
import { useAppointments } from "@/hooks/use-appointments";
import type { NotificationChannel, NotificationEventType } from "@/types";

const EVENT_LABELS: Partial<Record<NotificationEventType, string>> = {
  APPOINTMENT_APPROVED: "Appointment approved",
  APPOINTMENT_REJECTED: "Appointment rejected",
  REMINDER: "24h reminder",
};
const RELEVANT_EVENTS: NotificationEventType[] = ["APPOINTMENT_APPROVED", "APPOINTMENT_REJECTED", "REMINDER"];
const CHANNELS: NotificationChannel[] = ["EMAIL", "SMS"];

export default function ProfilePage() {
  const { user } = useAuth();
  const { data, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const { data: historyData, isLoading: historyLoading } = useAppointments({ to: new Date().toISOString().slice(0, 10) });

  function isEnabled(channel: NotificationChannel, eventType: NotificationEventType) {
    return data?.preferences.find((p) => p.channel === channel && p.eventType === eventType)?.enabled ?? true;
  }

  async function toggle(channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) {
    try {
      await update.mutateAsync([{ channel, eventType, enabled }]);
    } catch {
      toast.error("Could not update preference");
    }
  }

  const pastAppointments = historyData?.appointments.filter((a) => a.status !== "PENDING") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description={`Signed in as ${user?.email}`} />

      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Choose how you want to hear about your appointments.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoading />
          ) : (
            <div className="divide-y divide-border">
              {RELEVANT_EVENTS.map((eventType) => (
                <div key={eventType} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm font-medium text-foreground">{EVENT_LABELS[eventType]}</span>
                  <div className="flex items-center gap-6">
                    {CHANNELS.map((channel) => (
                      <div key={channel} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{channel === "EMAIL" ? "Email" : "SMS"}</span>
                        <Switch
                          checked={isEnabled(channel, eventType)}
                          onCheckedChange={(enabled) => toggle(channel, eventType, enabled)}
                          label={`${channel} notifications for ${EVENT_LABELS[eventType]}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visit history</CardTitle>
          <CardDescription>Your past appointments.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <PageLoading />
          ) : pastAppointments.length > 0 ? (
            <div className="space-y-3">
              {pastAppointments.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} />
              ))}
            </div>
          ) : (
            <EmptyState icon={History} title="No visit history yet" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

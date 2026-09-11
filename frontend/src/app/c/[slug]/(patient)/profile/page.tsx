"use client";

import { useState } from "react";
import { toast } from "sonner";
import { History } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { AvatarUpload } from "@/components/common/avatar-upload";
import { ChangePasswordCard } from "@/components/common/change-password-card";
import { useAuth } from "@/lib/auth-context";
import { useUpdateProfile } from "@/hooks/use-avatar";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/use-notification-preferences";
import { useAppointments } from "@/hooks/use-appointments";
import { ApiError } from "@/lib/api-client";
import type { NotificationChannel, NotificationEventType } from "@/types";

const EVENT_LABELS: Partial<Record<NotificationEventType, string>> = {
  APPOINTMENT_APPROVED: "Appointment approved",
  APPOINTMENT_REJECTED: "Appointment rejected",
  REMINDER: "24h reminder",
};
const RELEVANT_EVENTS: NotificationEventType[] = ["APPOINTMENT_APPROVED", "APPOINTMENT_REJECTED", "REMINDER"];
const CHANNELS: NotificationChannel[] = ["EMAIL", "SMS"];

export default function ProfilePage() {
  const { user, patchUser } = useAuth();
  const { data, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const { data: historyData, isLoading: historyLoading } = useAppointments({ to: new Date().toISOString().slice(0, 10) });

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const updateProfile = useUpdateProfile();

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

  async function handleSaveProfile() {
    try {
      const { user: updated } = await updateProfile.mutateAsync({ name, phone, email });
      patchUser({ name: updated.name, phone: updated.phone, email: updated.email });
      toast.success("Contact details updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update contact details");
    }
  }

  const pastAppointments = historyData?.appointments.filter((a) => a.status !== "PENDING") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description={`Signed in as ${user?.email}`} />

      {user && (
        <Card>
          <CardContent className="flex items-center gap-5 pt-5">
            <AvatarUpload src={user.avatarUrl} name={user.name} onUploaded={(avatarUrl) => patchUser({ avatarUrl })} />
            <div>
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
          <CardDescription>Your name, phone, and email — used for login and appointment reminders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="patient-name">Full name</Label>
              <Input id="patient-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="patient-phone">Phone</Label>
              <Input id="patient-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="patient-email">Email</Label>
              <Input
                id="patient-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>

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

      <ChangePasswordCard />
    </div>
  );
}

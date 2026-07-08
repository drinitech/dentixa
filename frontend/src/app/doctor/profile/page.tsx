"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AvatarUpload } from "@/components/common/avatar-upload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageLoading } from "@/components/common/loading-spinner";
import { useAuth } from "@/lib/auth-context";
import { useUpdateSpecialty } from "@/hooks/use-avatar";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/hooks/use-notification-preferences";
import { ApiError } from "@/lib/api-client";
import type { NotificationChannel, NotificationEventType } from "@/types";

// Doctors only ever receive APPOINTMENT_CREATED notifications (new request) —
// approvals/rejections/reminders are patient-only events.
const RELEVANT_EVENTS: NotificationEventType[] = ["APPOINTMENT_CREATED"];
const EVENT_LABELS: Partial<Record<NotificationEventType, string>> = {
  APPOINTMENT_CREATED: "New appointment request",
};
const CHANNELS: NotificationChannel[] = ["EMAIL", "SMS"];

export default function DoctorProfilePage() {
  const { user, patchUser } = useAuth();
  const [specialty, setSpecialty] = useState(user?.specialty ?? "");
  const updateSpecialty = useUpdateSpecialty();
  const { data: prefsData, isLoading: prefsLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  if (!user) return null;

  async function handleSaveSpecialty() {
    try {
      const { user: updated } = await updateSpecialty.mutateAsync(specialty);
      patchUser({ specialty: updated.specialty });
      toast.success("Specialty updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update specialty");
    }
  }

  function isEnabled(channel: NotificationChannel, eventType: NotificationEventType) {
    return prefsData?.preferences.find((p) => p.channel === channel && p.eventType === eventType)?.enabled ?? true;
  }

  async function togglePref(channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) {
    try {
      await updatePrefs.mutateAsync([{ channel, eventType, enabled }]);
    } catch {
      toast.error("Could not update preference");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your public details, shown to patients when they book with you." />

      <Card>
        <CardHeader>
          <CardTitle>Profile picture</CardTitle>
          <CardDescription>Patients see this photo when choosing a doctor to book with.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-5">
          <AvatarUpload
            src={user.avatarUrl}
            name={user.name}
            onUploaded={(avatarUrl) => patchUser({ avatarUrl })}
          />
          <div>
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specialty</CardTitle>
          <CardDescription>Shown on your booking card so patients know what you focus on.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full space-y-1.5 sm:max-w-xs">
            <Label htmlFor="specialty">Specialty</Label>
            <Input
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Orthodontist"
              maxLength={100}
            />
          </div>
          <Button onClick={handleSaveSpecialty} disabled={updateSpecialty.isPending}>
            {updateSpecialty.isPending ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Choose how you want to hear about new appointment requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {prefsLoading ? (
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
                          onCheckedChange={(enabled) => togglePref(channel, eventType, enabled)}
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
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarX2, Clock3, X } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { useAppointments, useCancelAppointment } from "@/hooks/use-appointments";
import { useMyWaitlist, useLeaveWaitlist } from "@/hooks/use-waitlist";
import { ApiError } from "@/lib/api-client";
import type { AppointmentStatus } from "@/types";

const TABS: { label: string; value: AppointmentStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Done", value: "DONE" },
  { label: "No-show", value: "NO_SHOW" },
];

export default function PatientAppointmentsPage() {
  const [tab, setTab] = useState<AppointmentStatus | "ALL">("ALL");
  const { data, isLoading } = useAppointments(tab === "ALL" ? {} : { status: tab });
  const cancelAppointment = useCancelAppointment();
  const { data: waitlistData } = useMyWaitlist();
  const leaveWaitlist = useLeaveWaitlist();

  async function handleCancel(id: string) {
    try {
      await cancelAppointment.mutateAsync(id);
      toast.success("Appointment cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not cancel appointment");
    }
  }

  async function handleLeaveWaitlist(id: string) {
    try {
      await leaveWaitlist.mutateAsync(id);
      toast.success("Removed from waitlist");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not leave the waitlist");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My appointments" description="Track the status of your appointment requests." />

      {waitlistData && waitlistData.entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Waitlist</CardTitle>
            <CardDescription>We&apos;ll email you if a slot opens up on these dates.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {waitlistData.entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                  Dr. {entry.doctor.name} — {entry.service.name} — {formatDate(entry.date)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLeaveWaitlist(entry.id)}
                  disabled={leaveWaitlist.isPending}
                >
                  <X className="h-3.5 w-3.5" />
                  Leave
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoading />
      ) : data && data.appointments.length > 0 ? (
        <div className="space-y-3">
          {data.appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onCancel={handleCancel}
              cancelling={cancelAppointment.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarX2}
          title="No appointments yet"
          description="Once you request an appointment, it'll show up here with its status."
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarX2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { cn } from "@/lib/utils";
import { useAppointments, useCancelAppointment } from "@/hooks/use-appointments";
import { ApiError } from "@/lib/api-client";
import type { AppointmentStatus } from "@/types";

const TABS: { label: string; value: AppointmentStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Done", value: "DONE" },
];

export default function PatientAppointmentsPage() {
  const [tab, setTab] = useState<AppointmentStatus | "ALL">("ALL");
  const { data, isLoading } = useAppointments(tab === "ALL" ? {} : { status: tab });
  const cancelAppointment = useCancelAppointment();

  async function handleCancel(id: string) {
    try {
      await cancelAppointment.mutateAsync(id);
      toast.success("Appointment cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not cancel appointment");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My appointments" description="Track the status of your appointment requests." />

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

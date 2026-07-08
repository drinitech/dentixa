"use client";

import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { PendingRequestCard } from "@/components/doctor/pending-request-card";
import { useAppointments } from "@/hooks/use-appointments";

export default function DoctorDashboardPage() {
  const { data, isLoading } = useAppointments({ status: "PENDING" });

  return (
    <div className="space-y-6">
      <PageHeader title="Pending requests" description="Review and respond to new appointment requests." />

      {isLoading ? (
        <PageLoading />
      ) : data && data.appointments.length > 0 ? (
        <div className="space-y-3">
          {data.appointments.map((appt) => (
            <PendingRequestCard key={appt.id} appointment={appt} />
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardCheck} title="No pending requests" description="You're all caught up." />
      )}
    </div>
  );
}

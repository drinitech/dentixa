"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarCheck2, CalendarX2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { PageLoading } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { StatTile } from "@/components/common/stat-tile";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { useDoctorStats } from "@/hooks/use-stats";
import { useAppointments, useCancelAppointment, useCompleteAppointment } from "@/hooks/use-appointments";
import { ApiError } from "@/lib/api-client";
import type { AppointmentStatus } from "@/types";

type Filter = AppointmentStatus | "ALL";

export default function DoctorStatsPage() {
  const { data, isLoading } = useDoctorStats();
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments(
    filter === "ALL" ? {} : { status: filter },
  );
  const cancelAppointment = useCancelAppointment();
  const completeAppointment = useCompleteAppointment();

  function toggleFilter(next: Filter) {
    setFilter((current) => (current === next ? "ALL" : next));
  }

  async function handleCancel(id: string) {
    try {
      await cancelAppointment.mutateAsync(id);
      toast.success("Appointment cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not cancel appointment");
    }
  }

  async function handleComplete(id: string) {
    try {
      await completeAppointment.mutateAsync(id);
      toast.success("Appointment marked as done");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not mark appointment as done");
    }
  }

  if (isLoading || !data) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your stats"
        description="Click a stat to filter the appointment table below, and manage appointments directly from it."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={CalendarCheck2}
          label="Confirmed this week"
          value={data.stats.appointmentsThisWeek}
          onClick={() => toggleFilter("APPROVED")}
          active={filter === "APPROVED"}
        />
        <StatTile
          icon={Clock}
          label="Pending requests"
          value={data.stats.pendingCount}
          onClick={() => toggleFilter("PENDING")}
          active={filter === "PENDING"}
        />
        <StatTile
          icon={XCircle}
          label="Total declined"
          value={data.stats.rejectionsCount}
          onClick={() => toggleFilter("REJECTED")}
          active={filter === "REJECTED"}
        />
        <StatTile
          icon={CheckCircle2}
          label="Total done"
          value={data.stats.doneCount}
          onClick={() => toggleFilter("DONE")}
          active={filter === "DONE"}
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-foreground">
          {filter === "ALL" ? "All appointments" : `${filter.charAt(0)}${filter.slice(1).toLowerCase()} appointments`}
        </p>
        {appointmentsLoading ? (
          <PageLoading />
        ) : appointmentsData && appointmentsData.appointments.length > 0 ? (
          <div className="space-y-3">
            {appointmentsData.appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onCancel={handleCancel}
                cancelling={cancelAppointment.isPending}
                onComplete={handleComplete}
                completing={completeAppointment.isPending}
                showPatient
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarX2} title="No appointments match this filter" />
        )}
      </div>
    </div>
  );
}

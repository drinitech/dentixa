"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock, Stethoscope, XCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { PageLoading } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { StatTile } from "@/components/common/stat-tile";
import { MonthlyTrendChart, PerDoctorChart } from "@/components/admin/stats-chart";
import { AppointmentsTable } from "@/components/admin/appointments-table";
import { DoctorsTable } from "@/components/admin/doctors-table";
import { useAdminStats } from "@/hooks/use-stats";
import { useAdminDoctors } from "@/hooks/use-admin";
import { useAppointments, useCancelAppointment } from "@/hooks/use-appointments";
import { ApiError } from "@/lib/api-client";
import type { AppointmentStatus } from "@/types";

type Filter = "TOTAL" | AppointmentStatus | "DOCTORS";

const FILTER_LABEL: Record<Filter, string> = {
  TOTAL: "All appointments",
  PENDING: "Pending appointments",
  APPROVED: "Approved appointments",
  REJECTED: "Rejected appointments",
  CANCELLED: "Cancelled appointments",
  DONE: "Done appointments",
  DOCTORS: "Doctors",
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminStats();
  const { data: doctorsData } = useAdminDoctors();
  const [filter, setFilter] = useState<Filter | null>(null);

  const isAppointmentFilter = filter === "TOTAL" || filter === "PENDING" || filter === "REJECTED";
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments(
    { status: filter && filter !== "TOTAL" ? (filter as AppointmentStatus) : undefined },
    { admin: true, enabled: isAppointmentFilter },
  );
  const cancelAppointment = useCancelAppointment({ admin: true });

  function toggleFilter(next: Filter) {
    setFilter((current) => (current === next ? null : next));
  }

  async function handleCancel(id: string) {
    try {
      await cancelAppointment.mutateAsync(id);
      toast.success("Appointment cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not cancel appointment");
    }
  }

  if (isLoading || !data) return <PageLoading />;

  const { stats } = data;
  const activeDoctors = doctorsData?.doctors.filter((d) => d.isActive) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinic overview"
        description="Aggregate stats across the whole clinic — click a stat to see its table."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={CalendarDays}
          label="Total appointments"
          value={stats.totalAppointments}
          onClick={() => toggleFilter("TOTAL")}
          active={filter === "TOTAL"}
        />
        <StatTile
          icon={Clock}
          label="Pending"
          value={stats.byStatus.PENDING ?? 0}
          onClick={() => toggleFilter("PENDING")}
          active={filter === "PENDING"}
        />
        <StatTile
          icon={XCircle}
          label="Rejected"
          value={stats.byStatus.REJECTED ?? 0}
          onClick={() => toggleFilter("REJECTED")}
          active={filter === "REJECTED"}
        />
        <StatTile
          icon={Stethoscope}
          label="Active doctors"
          value={activeDoctors.length}
          onClick={() => toggleFilter("DOCTORS")}
          active={filter === "DOCTORS"}
        />
      </div>

      {filter && (
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">{FILTER_LABEL[filter]}</p>
          {filter === "DOCTORS" ? (
            activeDoctors.length > 0 ? (
              <DoctorsTable doctors={activeDoctors} />
            ) : (
              <EmptyState icon={Stethoscope} title="No active doctors" />
            )
          ) : appointmentsLoading ? (
            <PageLoading />
          ) : appointmentsData && appointmentsData.appointments.length > 0 ? (
            <AppointmentsTable
              appointments={appointmentsData.appointments}
              onCancel={handleCancel}
              cancelling={cancelAppointment.isPending}
            />
          ) : (
            <EmptyState icon={CalendarDays} title="No appointments in this category" />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthlyTrendChart data={stats.monthlyTrend} />
        <PerDoctorChart data={stats.perDoctor} />
      </div>
    </div>
  );
}

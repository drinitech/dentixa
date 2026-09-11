"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarCheck2, CalendarX2, CheckCircle2, Clock, FileSpreadsheet, UserX, XCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { PageLoading } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { StatTile } from "@/components/common/stat-tile";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { useDoctorStats } from "@/hooks/use-stats";
import {
  useAppointments,
  useCancelAppointment,
  useCompleteAppointment,
  useMarkNoShow,
  useExportAppointments,
} from "@/hooks/use-appointments";
import { ApiError } from "@/lib/api-client";
import { STATUS_LABELS } from "@/lib/utils";
import type { AppointmentStatus } from "@/types";

type Filter = AppointmentStatus | "ALL";
const PAGE_SIZE = 10;

export default function DoctorStatsPage() {
  const { data, isLoading } = useDoctorStats();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(1);
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments(
    filter === "ALL" ? { page, pageSize: PAGE_SIZE } : { status: filter, page, pageSize: PAGE_SIZE },
  );
  const cancelAppointment = useCancelAppointment();
  const completeAppointment = useCompleteAppointment();
  const markNoShow = useMarkNoShow();
  const exportAppointments = useExportAppointments();

  function toggleFilter(next: Filter) {
    setFilter((current) => (current === next ? "ALL" : next));
    setPage(1);
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

  async function handleNoShow(id: string) {
    try {
      await markNoShow.mutateAsync(id);
      toast.success("Appointment marked as no-show");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not mark appointment as no-show");
    }
  }

  async function handleExport() {
    try {
      await exportAppointments.mutateAsync(filter === "ALL" ? {} : { status: filter });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not export appointments");
    }
  }

  if (isLoading || !data) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your stats"
        description="Click a stat to filter the appointment table below, and manage appointments directly from it."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
        <StatTile
          icon={UserX}
          label="No-shows"
          value={data.stats.noShowCount}
          onClick={() => toggleFilter("NO_SHOW")}
          active={filter === "NO_SHOW"}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            {filter === "ALL" ? "All appointments" : `${STATUS_LABELS[filter]} appointments`}
          </p>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exportAppointments.isPending}>
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export to Excel
          </Button>
        </div>
        {appointmentsLoading ? (
          <PageLoading />
        ) : appointmentsData && appointmentsData.appointments.length > 0 ? (
          <>
            <div className="space-y-3">
              {appointmentsData.appointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onCancel={handleCancel}
                  cancelling={cancelAppointment.isPending}
                  onComplete={handleComplete}
                  completing={completeAppointment.isPending}
                  onNoShow={handleNoShow}
                  markingNoShow={markNoShow.isPending}
                  showPatient
                />
              ))}
            </div>
            <Pagination
              page={appointmentsData.page}
              pageSize={appointmentsData.pageSize}
              total={appointmentsData.total}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState icon={CalendarX2} title="No appointments match this filter" />
        )}
      </div>
    </div>
  );
}

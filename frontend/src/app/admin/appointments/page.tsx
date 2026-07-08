"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarX2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { AppointmentsTable } from "@/components/admin/appointments-table";
import { Pagination } from "@/components/common/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAppointments, useCancelAppointment } from "@/hooks/use-appointments";
import { useDoctors } from "@/hooks/use-slots";
import { ApiError } from "@/lib/api-client";
import type { AppointmentStatus } from "@/types";

const PAGE_SIZE = 20;

export default function AdminAppointmentsPage() {
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [doctorId, setDoctorId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const { data: doctorsData } = useDoctors();
  const { data, isLoading } = useAppointments(
    {
      status: status || undefined,
      doctorId: doctorId || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      pageSize: PAGE_SIZE,
    },
    { admin: true },
  );
  const cancelAppointment = useCancelAppointment({ admin: true });

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setter(value);
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

  return (
    <div className="space-y-6">
      <PageHeader title="All appointments" description="Clinic-wide view, with override cancel for emergencies." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select value={doctorId} onChange={(e) => updateFilter(setDoctorId, e.target.value)}>
          <option value="">All doctors</option>
          {doctorsData?.doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => updateFilter(setStatus, e.target.value as AppointmentStatus | "")}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="DONE">Done</option>
          <option value="NO_SHOW">No-show</option>
        </Select>
        <Input type="date" value={from} onChange={(e) => updateFilter(setFrom, e.target.value)} />
        <Input type="date" value={to} onChange={(e) => updateFilter(setTo, e.target.value)} />
      </div>

      {isLoading ? (
        <PageLoading />
      ) : data && data.appointments.length > 0 ? (
        <>
          <AppointmentsTable
            appointments={data.appointments}
            onCancel={handleCancel}
            cancelling={cancelAppointment.isPending}
          />
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState icon={CalendarX2} title="No appointments match these filters" />
      )}
    </div>
  );
}

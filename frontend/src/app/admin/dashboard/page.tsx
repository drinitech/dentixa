"use client";

import { CalendarDays, Clock, Stethoscope, XCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { PageLoading } from "@/components/common/loading-spinner";
import { StatTile } from "@/components/common/stat-tile";
import { MonthlyTrendChart, PerDoctorChart } from "@/components/admin/stats-chart";
import { useAdminStats } from "@/hooks/use-stats";
import { useAdminDoctors } from "@/hooks/use-admin";

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminStats();
  const { data: doctorsData } = useAdminDoctors();

  if (isLoading || !data) return <PageLoading />;

  const { stats } = data;
  const activeDoctors = doctorsData?.doctors.filter((d) => d.isActive).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Clinic overview" description="Aggregate stats across the whole clinic." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={CalendarDays} label="Total appointments" value={stats.totalAppointments} />
        <StatTile icon={Clock} label="Pending" value={stats.byStatus.PENDING ?? 0} />
        <StatTile icon={XCircle} label="Rejected" value={stats.byStatus.REJECTED ?? 0} />
        <StatTile icon={Stethoscope} label="Active doctors" value={activeDoctors} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthlyTrendChart data={stats.monthlyTrend} />
        <PerDoctorChart data={stats.perDoctor} />
      </div>
    </div>
  );
}

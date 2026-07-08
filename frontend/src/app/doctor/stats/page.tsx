"use client";

import { CalendarCheck2, Clock, XCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { PageLoading } from "@/components/common/loading-spinner";
import { StatTile } from "@/components/common/stat-tile";
import { useDoctorStats } from "@/hooks/use-stats";

export default function DoctorStatsPage() {
  const { data, isLoading } = useDoctorStats();

  if (isLoading || !data) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader title="Your stats" description="A quick look at your appointment activity." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={CalendarCheck2} label="Confirmed this week" value={data.stats.appointmentsThisWeek} />
        <StatTile icon={Clock} label="Pending requests" value={data.stats.pendingCount} />
        <StatTile icon={XCircle} label="Total declined" value={data.stats.rejectionsCount} />
      </div>
    </div>
  );
}

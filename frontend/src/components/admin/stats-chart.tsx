"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminStats } from "@/types";

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  background: "var(--color-popover)",
  color: "var(--color-popover-foreground)",
  fontSize: 12,
};

export function MonthlyTrendChart({ data }: { data: AdminStats["monthlyTrend"] }) {
  const chartData = [...data].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments per month</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap={6}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
              axisLine={{ stroke: "var(--chart-grid)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-muted)" }} />
            <Bar dataKey="count" name="Appointments" fill="var(--chart-approved)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PerDoctorChart({ data }: { data: AdminStats["perDoctor"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by doctor</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="doctorName"
              tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
              axisLine={{ stroke: "var(--chart-grid)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-muted)" }} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }} />
            <Bar dataKey="approved" name="Approved" fill="var(--chart-approved)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="rejected" name="Rejected" fill="var(--chart-rejected)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

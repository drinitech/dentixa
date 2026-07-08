import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/appointments/status-badge";
import { formatDate } from "@/lib/utils";
import type { Appointment } from "@/types";

export function AppointmentsTable({
  appointments,
  onCancel,
  cancelling,
}: {
  appointments: Appointment[];
  onCancel?: (id: string) => void;
  cancelling?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Patient</th>
            <th className="px-4 py-3 font-medium">Doctor</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Time</th>
            <th className="px-4 py-3 font-medium">Service</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {appointments.map((appt) => {
            const canCancel = appt.status === "PENDING" || appt.status === "APPROVED";
            return (
              <tr key={appt.id} className="bg-card">
                <td className="px-4 py-3 font-medium text-foreground">{appt.patient.name}</td>
                <td className="px-4 py-3 text-muted-foreground">Dr. {appt.doctor.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(appt.date)}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{appt.time}</td>
                <td className="px-4 py-3 text-muted-foreground">{appt.service?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={appt.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {canCancel && onCancel && (
                    <Button variant="destructive" size="sm" onClick={() => onCancel(appt.id)} disabled={cancelling}>
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

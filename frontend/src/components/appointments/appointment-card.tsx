import { CalendarDays, Clock, Stethoscope, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Appointment } from "@/types";

export function AppointmentCard({
  appointment,
  onCancel,
  cancelling,
  showPatient,
}: {
  appointment: Appointment;
  onCancel?: (id: string) => void;
  cancelling?: boolean;
  showPatient?: boolean;
}) {
  const canCancel = appointment.status === "PENDING" || appointment.status === "APPROVED";

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={appointment.status} />
            {showPatient && <span className="text-sm font-medium text-foreground">{appointment.patient.name}</span>}
            {!showPatient && <span className="text-sm font-medium text-foreground">Dr. {appointment.doctor.name}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(appointment.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {appointment.time}
            </span>
            {appointment.service && (
              <span className="flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5" />
                {appointment.service.name}
              </span>
            )}
          </div>
          {appointment.reason && <p className="text-sm text-muted-foreground">&ldquo;{appointment.reason}&rdquo;</p>}
          {appointment.status === "REJECTED" && appointment.rejectionReason && (
            <p className="text-sm text-status-rejected-foreground">Reason: {appointment.rejectionReason}</p>
          )}
        </div>
        {canCancel && onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(appointment.id)}
            disabled={cancelling}
            className="shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

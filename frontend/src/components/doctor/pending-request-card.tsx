"use client";

import { useState } from "react";
import { CalendarDays, Clock, Stethoscope, Check, X, Phone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { useApproveAppointment, useRejectAppointment } from "@/hooks/use-appointments";
import { ApiError } from "@/lib/api-client";
import type { Appointment } from "@/types";

export function PendingRequestCard({ appointment }: { appointment: Appointment }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const approve = useApproveAppointment();
  const reject = useRejectAppointment();

  async function handleApprove() {
    try {
      const result = await approve.mutateAsync(appointment.id);
      if (result.autoRejectedCount > 0) {
        toast.success(
          `Approved. ${result.autoRejectedCount} other conflicting request${result.autoRejectedCount > 1 ? "s were" : " was"} automatically declined.`,
        );
      } else {
        toast.success("Appointment approved");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not approve appointment");
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync({ id: appointment.id, rejectionReason: rejectionReason || undefined });
      toast.success("Appointment declined");
      setRejectOpen(false);
      setRejectionReason("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not decline appointment");
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">{appointment.patient.name}</p>
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
            {appointment.patient.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {appointment.patient.phone}
              </span>
            )}
          </div>
          {appointment.reason && <p className="text-sm text-muted-foreground">&ldquo;{appointment.reason}&rdquo;</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => setRejectOpen(true)} disabled={reject.isPending}>
            <X className="h-3.5 w-3.5" />
            Decline
          </Button>
          <Button size="sm" onClick={handleApprove} disabled={approve.isPending}>
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Decline appointment"
        description="You can optionally let the patient know why."
      >
        <div className="space-y-4">
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason (optional)"
            maxLength={500}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleReject} disabled={reject.isPending}>
              {reject.isPending ? "Declining…" : "Decline appointment"}
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}

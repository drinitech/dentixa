"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Clock, NotebookPen, Star, Stethoscope, UserX, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { StarRating } from "./star-rating";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { useCreateReview, useUpdateVisitNotes } from "@/hooks/use-appointments";
import { ApiError } from "@/lib/api-client";
import type { Appointment } from "@/types";

export function AppointmentCard({
  appointment,
  onCancel,
  cancelling,
  onComplete,
  completing,
  onNoShow,
  markingNoShow,
  showPatient,
}: {
  appointment: Appointment;
  onCancel?: (id: string) => void;
  cancelling?: boolean;
  onComplete?: (id: string) => void;
  completing?: boolean;
  onNoShow?: (id: string) => void;
  markingNoShow?: boolean;
  showPatient?: boolean;
}) {
  const canCancel = appointment.status === "PENDING" || appointment.status === "APPROVED";
  const canComplete = appointment.status === "APPROVED";
  const canMarkNoShow = appointment.status === "APPROVED";
  // Only the patient reviews their own visit — showPatient is true for the doctor/admin view.
  const canReview = !showPatient && appointment.status === "DONE" && !appointment.review;
  // Only the treating doctor writes visit notes — showPatient is true for that view.
  const canEditNotes = showPatient && (appointment.status === "APPROVED" || appointment.status === "DONE");

  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(appointment.visitNotes ?? "");
  const updateVisitNotes = useUpdateVisitNotes();

  async function submitReview() {
    try {
      await createReview.mutateAsync({ id: appointment.id, rating, comment });
      toast.success("Thanks for your feedback");
      setReviewOpen(false);
      setRating(5);
      setComment("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit review");
    }
  }

  async function submitNotes() {
    try {
      await updateVisitNotes.mutateAsync({ id: appointment.id, visitNotes: notesDraft });
      toast.success("Notes saved");
      setNotesOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save notes");
    }
  }

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
          {!showPatient && appointment.review && (
            <div className="flex items-center gap-1.5">
              <StarRating value={appointment.review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">Your review</span>
            </div>
          )}
          {!showPatient && appointment.visitNotes && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Visit notes: </span>
              {appointment.visitNotes}
            </p>
          )}
        </div>
        {(canComplete && onComplete) ||
        (canMarkNoShow && onNoShow) ||
        (canCancel && onCancel) ||
        canReview ||
        canEditNotes ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canEditNotes && (
              <Button variant="outline" size="sm" onClick={() => setNotesOpen(true)}>
                <NotebookPen className="h-3.5 w-3.5" />
                {appointment.visitNotes ? "Edit notes" : "Add notes"}
              </Button>
            )}
            {canComplete && onComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onComplete(appointment.id)}
                disabled={completing}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark done
              </Button>
            )}
            {canMarkNoShow && onNoShow && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNoShow(appointment.id)}
                disabled={markingNoShow}
              >
                <UserX className="h-3.5 w-3.5" />
                No-show
              </Button>
            )}
            {canReview && (
              <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)}>
                <Star className="h-3.5 w-3.5" />
                Leave a review
              </Button>
            )}
            {canCancel && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(appointment.id)}
                disabled={cancelling}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>

      <Dialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title="Leave a review"
        description={`How was your visit with Dr. ${appointment.doctor.name}?`}
      >
        <div className="space-y-4">
          <StarRating value={rating} onChange={setRating} />
          <Textarea
            placeholder="Optional comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
          <Button className="w-full" onClick={submitReview} disabled={createReview.isPending}>
            {createReview.isPending ? "Submitting…" : "Submit review"}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={notesOpen}
        onOpenChange={setNotesOpen}
        title="Visit notes"
        description={`Only you and ${appointment.patient.name} can see these.`}
      >
        <div className="space-y-4">
          <Textarea
            placeholder="Diagnosis, treatment given, follow-up plan…"
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            maxLength={2000}
            rows={6}
          />
          <Button className="w-full" onClick={submitNotes} disabled={updateVisitNotes.isPending}>
            {updateVisitNotes.isPending ? "Saving…" : "Save notes"}
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, X } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DoctorPicker } from "@/components/booking/doctor-picker";
import { ServicePicker } from "@/components/booking/service-picker";
import { CalendarPicker } from "@/components/booking/calendar-picker";
import { SlotGrid } from "@/components/booking/slot-grid";
import { useClinics, useDoctors, useServices, useSlots } from "@/hooks/use-slots";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { useJoinWaitlist, useMyWaitlist } from "@/hooks/use-waitlist";
import { useMyRecalls, useDismissRecall } from "@/hooks/use-recalls";
import { ApiError } from "@/lib/api-client";
import { PageLoading } from "@/components/common/loading-spinner";
import { formatDate, formatDayLabel } from "@/lib/utils";

export default function PatientDashboardPage() {
  const { data: clinicsData } = useClinics();
  const { data: recallsData } = useMyRecalls();
  const dismissRecall = useDismissRecall();

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  // A single-clinic clinic never needs the patient to make a choice.
  useEffect(() => {
    if (clinicId === null && clinicsData?.clinics.length === 1) {
      setClinicId(clinicsData.clinics[0].id);
    }
  }, [clinicId, clinicsData]);

  const { data: doctorsData, isLoading: doctorsLoading } = useDoctors(clinicId ?? undefined);
  const { data: servicesData, isLoading: servicesLoading } = useServices(doctorId ?? undefined);

  function handleClinicChange(id: string) {
    setClinicId(id);
    setDoctorId(null);
    setServiceId(null);
    setTime(null);
  }

  function handleDoctorChange(id: string) {
    setDoctorId(id);
    setServiceId(null);
    setTime(null);
  }

  async function handleBookFromRecall(recallDoctorId: string, recallServiceId: string) {
    // Jump straight to the doctor+service the recall is for, unfiltered by
    // clinic so the doctor is guaranteed to show up regardless of which
    // clinic (if any) is currently selected.
    setClinicId(null);
    setDoctorId(recallDoctorId);
    setServiceId(recallServiceId);
    setTime(null);
  }

  const { data: slotsData, isLoading: slotsLoading } = useSlots(
    doctorId ?? undefined,
    date ?? undefined,
    serviceId ?? undefined,
  );
  const createAppointment = useCreateAppointment();
  const { data: waitlistData } = useMyWaitlist();
  const joinWaitlist = useJoinWaitlist();

  if (doctorsLoading || servicesLoading) return <PageLoading />;

  const doctors = doctorsData?.doctors ?? [];
  const services = servicesData?.services ?? [];

  const noSlotsThisDay = Boolean(doctorId && serviceId && date && !slotsLoading && slotsData?.slots.length === 0);
  const alreadyWaitlisted = Boolean(
    doctorId &&
      serviceId &&
      date &&
      waitlistData?.entries.some(
        (e) => e.doctor.id === doctorId && e.service.id === serviceId && e.date.slice(0, 10) === date,
      ),
  );

  async function handleSubmit() {
    if (!doctorId || !serviceId || !date || !time) return;
    try {
      await createAppointment.mutateAsync({ doctorId, serviceId, date, time, reason: reason || undefined });
      toast.success("Appointment requested — you'll be notified once the doctor responds.");
      setTime(null);
      setReason("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create appointment");
    }
  }

  async function handleJoinWaitlist() {
    if (!doctorId || !serviceId || !date) return;
    try {
      await joinWaitlist.mutateAsync({ doctorId, serviceId, date });
      toast.success("Added to the waitlist — we'll email you if a slot opens up.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not join the waitlist");
    }
  }

  const canSubmit = doctorId && serviceId && date && time && !createAppointment.isPending;
  const showClinicStep = (clinicsData?.clinics.length ?? 0) > 1;
  const recalls = recallsData?.recalls ?? [];
  const step = (n: number) => (showClinicStep ? n : n - 1);

  return (
    <div className="space-y-6">
      <PageHeader title="Book an appointment" description="Choose a doctor, service, and a free time slot." />

      {recalls.length > 0 && (
        <div className="space-y-3">
          {recalls.map((recall) => (
            <Card key={recall.id} className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Time for your {recall.service.name.toLowerCase()} checkup
                    </p>
                    <p className="text-sm text-muted-foreground">
                      With Dr. {recall.doctor.name} · due {formatDate(recall.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleBookFromRecall(recall.doctor.id, recall.service.id)}>
                    Book now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dismissRecall.mutate(recall.id)}
                    disabled={dismissRecall.isPending}
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showClinicStep && (
        <Card>
          <CardHeader>
            <CardTitle>1. Choose a clinic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {clinicsData?.clinics.map((clinic) => (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() => handleClinicChange(clinic.id)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    clinicId === clinic.id
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border text-foreground hover:border-primary/30 hover:bg-muted",
                  )}
                >
                  {clinic.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{step(2)}. Choose a doctor</CardTitle>
        </CardHeader>
        <CardContent>
          <DoctorPicker doctors={doctors} value={doctorId} onChange={handleDoctorChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{step(3)}. Choose a service</CardTitle>
        </CardHeader>
        <CardContent>
          <ServicePicker services={services} value={serviceId} onChange={setServiceId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{step(4)}. Choose a date &amp; time</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
          <CalendarPicker
            value={date}
            onChange={(d) => {
              setDate(d);
              setTime(null);
            }}
          />
          <div className="w-full flex-1 lg:border-l lg:border-border lg:pl-8">
            {doctorId && serviceId && date ? (
              <>
                <p className="mb-3 text-sm font-medium text-foreground">
                  Available times — {formatDayLabel(date)}, {formatDate(date)}
                </p>
                <SlotGrid slots={slotsData?.slots} value={time} onChange={setTime} isLoading={slotsLoading} />
                {noSlotsThisDay && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleJoinWaitlist}
                    disabled={joinWaitlist.isPending || alreadyWaitlisted}
                  >
                    {alreadyWaitlisted ? "Already on the waitlist" : "Notify me if a slot opens up"}
                  </Button>
                )}
              </>
            ) : (
              <div className="flex h-full min-h-[12rem] items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Pick a doctor, service, and date on the left to see available times.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{step(5)}. Reason for visit (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reason">Anything the doctor should know?</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. tooth sensitivity on the lower left side"
              maxLength={500}
            />
          </div>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createAppointment.isPending ? "Requesting…" : "Request appointment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

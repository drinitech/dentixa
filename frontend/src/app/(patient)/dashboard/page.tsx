"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DoctorPicker } from "@/components/booking/doctor-picker";
import { ServicePicker } from "@/components/booking/service-picker";
import { DateStrip } from "@/components/booking/date-strip";
import { SlotGrid } from "@/components/booking/slot-grid";
import { useDoctors, useServices, useSlots } from "@/hooks/use-slots";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { ApiError } from "@/lib/api-client";
import { PageLoading } from "@/components/common/loading-spinner";

export default function PatientDashboardPage() {
  const { data: doctorsData, isLoading: doctorsLoading } = useDoctors();
  const { data: servicesData, isLoading: servicesLoading } = useServices();

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data: slotsData, isLoading: slotsLoading } = useSlots(
    doctorId ?? undefined,
    date ?? undefined,
    serviceId ?? undefined,
  );
  const createAppointment = useCreateAppointment();

  if (doctorsLoading || servicesLoading) return <PageLoading />;

  const doctors = doctorsData?.doctors ?? [];
  const services = servicesData?.services ?? [];

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

  const canSubmit = doctorId && serviceId && date && time && !createAppointment.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Book an appointment" description="Choose a doctor, service, and a free time slot." />

      <Card>
        <CardHeader>
          <CardTitle>1. Choose a doctor</CardTitle>
        </CardHeader>
        <CardContent>
          <DoctorPicker doctors={doctors} value={doctorId} onChange={setDoctorId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Choose a service</CardTitle>
        </CardHeader>
        <CardContent>
          <ServicePicker services={services} value={serviceId} onChange={setServiceId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Choose a date &amp; time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DateStrip value={date} onChange={(d) => { setDate(d); setTime(null); }} />
          {doctorId && serviceId && date ? (
            <SlotGrid slots={slotsData?.slots} value={time} onChange={setTime} isLoading={slotsLoading} />
          ) : (
            <p className="text-sm text-muted-foreground">Pick a doctor, service, and date to see free slots.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Reason for visit (optional)</CardTitle>
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

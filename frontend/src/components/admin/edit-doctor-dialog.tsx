"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { editDoctorSchema, type EditDoctorFormInput } from "@/lib/validations";
import { useUpdateDoctor } from "@/hooks/use-admin";
import { useClinics } from "@/hooks/use-slots";
import { ApiError } from "@/lib/api-client";
import type { AdminUser } from "@/types";

export function EditDoctorDialog({
  doctor,
  onOpenChange,
}: {
  doctor: AdminUser | null;
  onOpenChange: (open: boolean) => void;
}) {
  const updateDoctor = useUpdateDoctor();
  const { data: clinicsData } = useClinics();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditDoctorFormInput>({ resolver: zodResolver(editDoctorSchema) });

  useEffect(() => {
    if (doctor) {
      reset({
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone ?? "",
        specialty: doctor.specialty ?? "",
        clinicId: doctor.clinicId ?? "",
      });
    }
  }, [doctor, reset]);

  async function onSubmit(data: EditDoctorFormInput) {
    if (!doctor) return;
    try {
      await updateDoctor.mutateAsync({
        id: doctor.id,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        specialty: data.specialty || undefined,
        clinicId: data.clinicId,
      });
      toast.success("Doctor details updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update doctor");
    }
  }

  return (
    <Dialog
      open={doctor !== null}
      onOpenChange={onOpenChange}
      title="Edit doctor"
      description={doctor ? `Update ${doctor.name}'s account details.` : undefined}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="edit-doctor-name">Full name</Label>
          <Input id="edit-doctor-name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-doctor-email">Email</Label>
          <Input id="edit-doctor-email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-doctor-phone">Phone (optional)</Label>
          <Input id="edit-doctor-phone" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-doctor-specialty">Specialty (optional)</Label>
          <Input id="edit-doctor-specialty" placeholder="e.g. Orthodontist" {...register("specialty")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-doctor-clinic">Clinic</Label>
          <Select id="edit-doctor-clinic" {...register("clinicId")}>
            <option value="">Select a clinic…</option>
            {clinicsData?.clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </Select>
          {errors.clinicId && <p className="text-xs text-destructive">{errors.clinicId.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={updateDoctor.isPending}>
          {updateDoctor.isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Dialog>
  );
}

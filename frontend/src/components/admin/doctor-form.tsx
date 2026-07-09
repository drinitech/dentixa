"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createDoctorSchema, type CreateDoctorFormInput } from "@/lib/validations";
import { useCreateDoctor } from "@/hooks/use-admin";
import { useClinics } from "@/hooks/use-slots";
import { ApiError } from "@/lib/api-client";

export function DoctorForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createDoctor = useCreateDoctor();
  const { data: clinicsData } = useClinics();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDoctorFormInput>({ resolver: zodResolver(createDoctorSchema) });

  async function onSubmit(data: CreateDoctorFormInput) {
    try {
      await createDoctor.mutateAsync({ ...data, phone: data.phone || undefined, specialty: data.specialty || undefined });
      toast.success("Doctor account created");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create doctor");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Add doctor" description="Creates a new doctor account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="doctor-name">Full name</Label>
          <Input id="doctor-name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doctor-email">Email</Label>
          <Input id="doctor-email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doctor-phone">Phone (optional)</Label>
          <Input id="doctor-phone" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doctor-specialty">Specialty (optional)</Label>
          <Input id="doctor-specialty" placeholder="e.g. Orthodontist" {...register("specialty")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doctor-clinic">Clinic</Label>
          <Select id="doctor-clinic" {...register("clinicId")}>
            <option value="">Select a clinic…</option>
            {clinicsData?.clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </Select>
          {errors.clinicId && <p className="text-xs text-destructive">{errors.clinicId.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doctor-password">Temporary password</Label>
          <Input id="doctor-password" type="password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={createDoctor.isPending}>
          {createDoctor.isPending ? "Creating…" : "Create doctor"}
        </Button>
      </form>
    </Dialog>
  );
}

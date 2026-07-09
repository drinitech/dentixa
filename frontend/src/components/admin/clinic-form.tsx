"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { clinicSchema, type ClinicFormInput } from "@/lib/validations";
import { useCreateClinic, useUpdateClinic } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";
import type { Clinic } from "@/types";

export function ClinicForm({
  open,
  onOpenChange,
  clinic,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic?: Clinic | null;
}) {
  const createClinic = useCreateClinic();
  const updateClinic = useUpdateClinic();
  const isEditing = Boolean(clinic);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClinicFormInput>({ resolver: zodResolver(clinicSchema) });

  useEffect(() => {
    if (open) {
      reset({
        name: clinic?.name ?? "",
        address: clinic?.address ?? "",
        phone: clinic?.phone ?? "",
      });
    }
  }, [open, clinic, reset]);

  async function onSubmit(data: ClinicFormInput) {
    try {
      const payload = { name: data.name, address: data.address || undefined, phone: data.phone || undefined };
      if (isEditing && clinic) {
        await updateClinic.mutateAsync({ id: clinic.id, ...payload });
        toast.success("Clinic updated");
      } else {
        await createClinic.mutateAsync(payload);
        toast.success("Clinic created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save clinic");
    }
  }

  const pending = createClinic.isPending || updateClinic.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit clinic" : "Add clinic"}
      description="A clinic location doctors can be assigned to."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="clinic-name">Name</Label>
          <Input id="clinic-name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clinic-address">Address (optional)</Label>
          <Input id="clinic-address" {...register("address")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clinic-phone">Phone (optional)</Label>
          <Input id="clinic-phone" {...register("phone")} />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : isEditing ? "Save changes" : "Create clinic"}
        </Button>
      </form>
    </Dialog>
  );
}

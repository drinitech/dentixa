"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { clinicServiceSchema, type ClinicServiceFormInput } from "@/lib/validations";
import { useCreateService, useUpdateService } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";
import type { ClinicService } from "@/types";

export function ServiceForm({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: ClinicService | null;
}) {
  const createService = useCreateService();
  const updateService = useUpdateService();
  const isEditing = Boolean(service);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClinicServiceFormInput>({ resolver: zodResolver(clinicServiceSchema) });

  useEffect(() => {
    if (open) {
      reset({
        name: service?.name ?? "",
        durationMinutes: String(service?.durationMinutes ?? 30),
        price: service?.price != null ? String(service.price) : "",
      });
    }
  }, [open, service, reset]);

  async function onSubmit(data: ClinicServiceFormInput) {
    try {
      const payload = {
        name: data.name,
        durationMinutes: Number(data.durationMinutes),
        price: data.price ? Number(data.price) : undefined,
      };
      if (isEditing && service) {
        await updateService.mutateAsync({ id: service.id, ...payload });
        toast.success("Service updated");
      } else {
        await createService.mutateAsync(payload);
        toast.success("Service created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save service");
    }
  }

  const pending = createService.isPending || updateService.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit service" : "Add service"}
      description="Services patients can request an appointment for."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="service-name">Name</Label>
          <Input id="service-name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="service-duration">Duration (minutes)</Label>
          <Input id="service-duration" type="number" min={5} max={480} {...register("durationMinutes")} />
          {errors.durationMinutes && <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="service-price">Price (optional)</Label>
          <Input id="service-price" type="number" step="0.01" min={0} {...register("price")} />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : isEditing ? "Save changes" : "Create service"}
        </Button>
      </form>
    </Dialog>
  );
}

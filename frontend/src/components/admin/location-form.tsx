"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { locationSchema, type LocationFormInput } from "@/lib/validations";
import { useCreateLocation, useUpdateLocation } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";
import type { Location } from "@/types";

export function LocationForm({
  open,
  onOpenChange,
  location,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location | null;
}) {
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const isEditing = Boolean(location);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationFormInput>({ resolver: zodResolver(locationSchema) });

  useEffect(() => {
    if (open) {
      reset({
        name: location?.name ?? "",
        address: location?.address ?? "",
        phone: location?.phone ?? "",
      });
    }
  }, [open, location, reset]);

  async function onSubmit(data: LocationFormInput) {
    try {
      const payload = { name: data.name, address: data.address || undefined, phone: data.phone || undefined };
      if (isEditing && location) {
        await updateLocation.mutateAsync({ id: location.id, ...payload });
        toast.success("Location updated");
      } else {
        await createLocation.mutateAsync(payload);
        toast.success("Location created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save location");
    }
  }

  const pending = createLocation.isPending || updateLocation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit location" : "Add location"}
      description="A clinic location doctors can be assigned to."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="location-name">Name</Label>
          <Input id="location-name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location-address">Address (optional)</Label>
          <Input id="location-address" {...register("address")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location-phone">Phone (optional)</Label>
          <Input id="location-phone" {...register("phone")} />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : isEditing ? "Save changes" : "Create location"}
        </Button>
      </form>
    </Dialog>
  );
}

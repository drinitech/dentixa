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
import { inviteStaffSchema, type InviteStaffFormInput } from "@/lib/validations";
import { useCreateInvite } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";

export function InviteForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createInvite = useCreateInvite();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteStaffFormInput>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: { role: "DOCTOR" },
  });

  useEffect(() => {
    if (open) reset({ email: "", role: "DOCTOR" });
  }, [open, reset]);

  async function onSubmit(data: InviteStaffFormInput) {
    try {
      await createInvite.mutateAsync(data);
      toast.success(`Invite sent to ${data.email}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send invite");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Invite staff"
      description="Send an email invite to join this clinic. Expires in 72 hours."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-role">Role</Label>
          <Select id="invite-role" {...register("role")}>
            <option value="OWNER">Owner</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="DOCTOR">Doctor</option>
            <option value="PATIENT">Patient</option>
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={createInvite.isPending}>
          {createInvite.isPending ? "Sending…" : "Send invite"}
        </Button>
      </form>
    </Dialog>
  );
}

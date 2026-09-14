"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { registerClinicSchema, type RegisterClinicInput } from "@/lib/validations";
import { ApiError } from "@/lib/api-client";
import { roleHome } from "@/components/layout/nav-items";

export default function RegisterClinicPage() {
  const { registerClinic } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterClinicInput>({ resolver: zodResolver(registerClinicSchema) });

  const slug = watch("slug");

  async function onSubmit(data: RegisterClinicInput) {
    setSubmitting(true);
    try {
      const { user, tenantSlug } = await registerClinic(data);
      if (!tenantSlug) {
        toast.error("Clinic created but couldn't determine its URL. Contact support.");
        return;
      }
      toast.success("Clinic created");
      router.push(roleHome(tenantSlug, user.role));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create clinic");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register your clinic</CardTitle>
        <CardDescription>Set up your own Dentixa workspace as the clinic owner.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="clinicName">Clinic name</Label>
            <Input id="clinicName" {...register("clinicName")} />
            {errors.clinicName && <p className="text-xs text-destructive">{errors.clinicName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Clinic URL</Label>
            <Input id="slug" placeholder="my-clinic" {...register("slug")} />
            {slug && !errors.slug && (
              <p className="text-xs text-muted-foreground">dentixa.app/c/{slug.toLowerCase()}</p>
            )}
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ownerName">Your name</Label>
            <Input id="ownerName" autoComplete="name" {...register("ownerName")} />
            {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ownerEmail">Your email</Label>
            <Input id="ownerEmail" type="email" autoComplete="email" {...register("ownerEmail")} />
            {errors.ownerEmail && <p className="text-xs text-destructive">{errors.ownerEmail.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ownerPassword">Password</Label>
            <Input id="ownerPassword" type="password" autoComplete="new-password" {...register("ownerPassword")} />
            {errors.ownerPassword && <p className="text-xs text-destructive">{errors.ownerPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating clinic…" : "Create clinic"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

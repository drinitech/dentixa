"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AvatarUpload } from "@/components/common/avatar-upload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useUpdateSpecialty } from "@/hooks/use-avatar";
import { ApiError } from "@/lib/api-client";

export default function DoctorProfilePage() {
  const { user, patchUser } = useAuth();
  const [specialty, setSpecialty] = useState(user?.specialty ?? "");
  const updateSpecialty = useUpdateSpecialty();

  if (!user) return null;

  async function handleSaveSpecialty() {
    try {
      const { user: updated } = await updateSpecialty.mutateAsync(specialty);
      patchUser({ specialty: updated.specialty });
      toast.success("Specialty updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update specialty");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your public details, shown to patients when they book with you." />

      <Card>
        <CardHeader>
          <CardTitle>Profile picture</CardTitle>
          <CardDescription>Patients see this photo when choosing a doctor to book with.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-5">
          <AvatarUpload
            src={user.avatarUrl}
            name={user.name}
            onUploaded={(avatarUrl) => patchUser({ avatarUrl })}
          />
          <div>
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specialty</CardTitle>
          <CardDescription>Shown on your booking card so patients know what you focus on.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full space-y-1.5 sm:max-w-xs">
            <Label htmlFor="specialty">Specialty</Label>
            <Input
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Orthodontist"
              maxLength={100}
            />
          </div>
          <Button onClick={handleSaveSpecialty} disabled={updateSpecialty.isPending}>
            {updateSpecialty.isPending ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

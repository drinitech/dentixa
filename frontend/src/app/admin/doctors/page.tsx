"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DoctorForm } from "@/components/admin/doctor-form";
import { EditDoctorDialog } from "@/components/admin/edit-doctor-dialog";
import { Avatar } from "@/components/common/avatar";
import { useAdminDoctors, useUpdateDoctor } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";
import type { AdminUser } from "@/types";

export default function AdminDoctorsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<AdminUser | null>(null);
  const { data, isLoading } = useAdminDoctors();
  const updateDoctor = useUpdateDoctor();

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await updateDoctor.mutateAsync({ id, isActive: !isActive });
      toast.success(!isActive ? "Doctor reactivated" : "Doctor deactivated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update doctor");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        description="Manage doctor accounts."
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add doctor
          </Button>
        }
      />

      {isLoading ? (
        <PageLoading />
      ) : data && data.doctors.length > 0 ? (
        <div className="space-y-3">
          {data.doctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={doctor.avatarUrl} name={doctor.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{doctor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doctor.email}
                      {doctor.specialty ? ` · ${doctor.specialty}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      doctor.isActive
                        ? "rounded-full bg-status-approved/15 px-2.5 py-1 text-xs font-medium text-status-approved"
                        : "rounded-full bg-status-cancelled px-2.5 py-1 text-xs font-medium text-status-cancelled-foreground"
                    }
                  >
                    {doctor.isActive ? "Active" : "Deactivated"}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setEditingDoctor(doctor)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(doctor.id, doctor.isActive)}>
                    {doctor.isActive ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Stethoscope} title="No doctors yet" description="Add your first doctor to get started." />
      )}

      <DoctorForm open={formOpen} onOpenChange={setFormOpen} />
      <EditDoctorDialog doctor={editingDoctor} onOpenChange={(open) => !open && setEditingDoctor(null)} />
    </div>
  );
}

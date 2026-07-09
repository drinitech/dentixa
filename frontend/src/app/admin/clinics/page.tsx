"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Building2, Pencil, Ban, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClinicForm } from "@/components/admin/clinic-form";
import { useAdminClinics, useUpdateClinic } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";
import type { Clinic } from "@/types";

export default function AdminClinicsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const { data, isLoading } = useAdminClinics();
  const updateClinic = useUpdateClinic();

  function openCreate() {
    setEditingClinic(null);
    setFormOpen(true);
  }

  function openEdit(clinic: Clinic) {
    setEditingClinic(clinic);
    setFormOpen(true);
  }

  async function toggleActive(clinic: Clinic) {
    try {
      await updateClinic.mutateAsync({ id: clinic.id, isActive: !clinic.isActive });
      toast.success(clinic.isActive ? "Clinic deactivated" : "Clinic reactivated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update clinic");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinics"
        description="Locations doctors can be assigned to — patients filter by clinic when booking."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add clinic
          </Button>
        }
      />

      {isLoading ? (
        <PageLoading />
      ) : data && data.clinics.length > 0 ? (
        <div className="space-y-3">
          {data.clinics.map((clinic) => (
            <Card key={clinic.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{clinic.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[clinic.address, clinic.phone].filter(Boolean).join(" · ") || "No address or phone set"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      clinic.isActive
                        ? "rounded-full bg-status-approved/15 px-2.5 py-1 text-xs font-medium text-status-approved"
                        : "rounded-full bg-status-cancelled px-2.5 py-1 text-xs font-medium text-status-cancelled-foreground"
                    }
                  >
                    {clinic.isActive ? "Active" : "Deactivated"}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openEdit(clinic)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(clinic)}>
                    {clinic.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {clinic.isActive ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Building2} title="No clinics yet" description="Add your first clinic location." />
      )}

      <ClinicForm open={formOpen} onOpenChange={setFormOpen} clinic={editingClinic} />
    </div>
  );
}

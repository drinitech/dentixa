"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Settings, Pencil, Ban, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceForm } from "@/components/admin/service-form";
import { useAdminServices, useDeactivateService, useUpdateService } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";
import type { ClinicService } from "@/types";

export default function AdminServicesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ClinicService | null>(null);
  const { data, isLoading } = useAdminServices();
  const deactivateService = useDeactivateService();
  const updateService = useUpdateService();

  function openCreate() {
    setEditingService(null);
    setFormOpen(true);
  }

  function openEdit(service: ClinicService) {
    setEditingService(service);
    setFormOpen(true);
  }

  async function handleToggleActive(service: ClinicService) {
    try {
      if (service.isActive) {
        await deactivateService.mutateAsync(service.id);
        toast.success("Service deactivated");
      } else {
        await updateService.mutateAsync({ id: service.id, name: service.name, durationMinutes: service.durationMinutes });
        toast.success("Service reactivated");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update service");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinic services"
        description="Services patients can request, with their duration and price."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add service
          </Button>
        }
      />

      {isLoading ? (
        <PageLoading />
      ) : data && data.services.length > 0 ? (
        <div className="space-y-3">
          {data.services.map((service) => (
            <Card key={service.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {service.durationMinutes} min{service.price != null && ` · $${Number(service.price).toFixed(2)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(service)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant={service.isActive ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleToggleActive(service)}
                  >
                    {service.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {service.isActive ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Settings} title="No services yet" description="Add the treatments your clinic offers." />
      )}

      <ServiceForm open={formOpen} onOpenChange={setFormOpen} service={editingService} />
    </div>
  );
}

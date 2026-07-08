"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAdminServices, useDoctorServices, useSetDoctorServices } from "@/hooks/use-admin";
import { PageLoading } from "@/components/common/loading-spinner";
import { ApiError } from "@/lib/api-client";
import type { AdminUser } from "@/types";

export function ManageDoctorServicesDialog({
  doctor,
  onOpenChange,
}: {
  doctor: AdminUser | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: servicesData, isLoading: servicesLoading } = useAdminServices();
  const { data: assignedData, isLoading: assignedLoading } = useDoctorServices(doctor?.id ?? null);
  const setDoctorServices = useSetDoctorServices();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (assignedData) setSelected(new Set(assignedData.serviceIds));
  }, [assignedData]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!doctor) return;
    try {
      await setDoctorServices.mutateAsync({ doctorId: doctor.id, serviceIds: Array.from(selected) });
      toast.success("Services updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update services");
    }
  }

  const activeServices = servicesData?.services.filter((s) => s.isActive) ?? [];
  const isLoading = servicesLoading || assignedLoading;

  return (
    <Dialog
      open={doctor !== null}
      onOpenChange={onOpenChange}
      title="Manage services"
      description={
        doctor
          ? `Leave everything unchecked for ${doctor.name} to be bookable for any service. Check specific services to restrict them to only those.`
          : undefined
      }
    >
      {isLoading ? (
        <PageLoading />
      ) : (
        <div className="space-y-4">
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {activeServices.map((service) => (
              <label key={service.id} className="flex items-center gap-2.5 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={selected.has(service.id)}
                  onChange={() => toggle(service.id)}
                  className="h-4 w-4 rounded border-input"
                />
                {service.name}
              </label>
            ))}
          </div>
          <Button className="w-full" onClick={handleSave} disabled={setDoctorServices.isPending}>
            {setDoctorServices.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </Dialog>
  );
}

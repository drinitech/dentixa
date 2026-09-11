"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Building2, Pencil, Ban, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageLoading } from "@/components/common/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocationForm } from "@/components/admin/location-form";
import { useAdminLocations, useUpdateLocation } from "@/hooks/use-admin";
import { ApiError } from "@/lib/api-client";
import type { Location } from "@/types";

export default function AdminLocationsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const { data, isLoading } = useAdminLocations();
  const updateLocation = useUpdateLocation();

  function openCreate() {
    setEditingLocation(null);
    setFormOpen(true);
  }

  function openEdit(location: Location) {
    setEditingLocation(location);
    setFormOpen(true);
  }

  async function toggleActive(location: Location) {
    try {
      await updateLocation.mutateAsync({ id: location.id, isActive: !location.isActive });
      toast.success(location.isActive ? "Location deactivated" : "Location reactivated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update location");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Locations doctors can be assigned to — patients filter by location when booking."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add location
          </Button>
        }
      />

      {isLoading ? (
        <PageLoading />
      ) : data && data.locations.length > 0 ? (
        <div className="space-y-3">
          {data.locations.map((location) => (
            <Card key={location.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{location.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[location.address, location.phone].filter(Boolean).join(" · ") || "No address or phone set"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      location.isActive
                        ? "rounded-full bg-status-approved/15 px-2.5 py-1 text-xs font-medium text-status-approved"
                        : "rounded-full bg-status-cancelled px-2.5 py-1 text-xs font-medium text-status-cancelled-foreground"
                    }
                  >
                    {location.isActive ? "Active" : "Deactivated"}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openEdit(location)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive(location)}>
                    {location.isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {location.isActive ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Building2} title="No locations yet" description="Add your first clinic location." />
      )}

      <LocationForm open={formOpen} onOpenChange={setFormOpen} location={editingLocation} />
    </div>
  );
}

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/common/avatar";
import { StarRating } from "@/components/appointments/star-rating";
import type { DoctorSummary } from "@/types";

export function DoctorPicker({
  doctors,
  value,
  onChange,
}: {
  doctors: DoctorSummary[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {doctors.map((doctor) => {
        const isSelected = value === doctor.id;
        return (
          <button
            key={doctor.id}
            type="button"
            onClick={() => onChange(doctor.id)}
            className={cn(
              "relative flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition-all",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                : "border-border hover:border-primary/30 hover:bg-muted",
            )}
          >
            {isSelected && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
            <Avatar src={doctor.avatarUrl} name={doctor.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{doctor.name}</p>
              {doctor.specialty ? (
                <p className="truncate text-xs text-muted-foreground">{doctor.specialty}</p>
              ) : (
                <p className="truncate text-xs text-muted-foreground">{doctor.email}</p>
              )}
              {doctor.averageRating != null && (
                <div className="mt-1 flex items-center justify-center gap-1">
                  <StarRating value={doctor.averageRating} size="sm" />
                  <span className="text-xs text-muted-foreground">({doctor.reviewCount})</span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

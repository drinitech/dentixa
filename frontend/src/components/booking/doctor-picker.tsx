import { cn } from "@/lib/utils";
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
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {doctors.map((doctor) => (
        <button
          key={doctor.id}
          type="button"
          onClick={() => onChange(doctor.id)}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
            value === doctor.id
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border hover:bg-muted",
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {doctor.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{doctor.name}</p>
            <p className="truncate text-xs text-muted-foreground">{doctor.email}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

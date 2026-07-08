import { cn } from "@/lib/utils";
import type { ClinicService } from "@/types";

export function ServicePicker({
  services,
  value,
  onChange,
}: {
  services: ClinicService[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {services.map((service) => (
        <button
          key={service.id}
          type="button"
          onClick={() => onChange(service.id)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === service.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-foreground hover:bg-muted",
          )}
        >
          {service.name}
          <span className={cn("ml-1.5 text-xs", value === service.id ? "opacity-80" : "text-muted-foreground")}>
            {service.durationMinutes}min
          </span>
        </button>
      ))}
    </div>
  );
}

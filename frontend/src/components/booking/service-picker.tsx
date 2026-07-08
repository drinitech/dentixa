import { cn } from "@/lib/utils";
import type { ClinicService } from "@/types";

function formatPrice(price: ClinicService["price"]): string | null {
  if (price === null || price === undefined) return null;
  return `$${Number(price).toFixed(2)}`;
}

export function ServicePicker({
  services,
  value,
  onChange,
}: {
  services: ClinicService[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  const selected = services.find((s) => s.id === value);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {services.map((service) => {
          const price = formatPrice(service.price);
          const isSelected = value === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onChange(service.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-muted",
              )}
            >
              {service.name}
              <span className={cn("ml-1.5 text-xs", isSelected ? "opacity-80" : "text-muted-foreground")}>
                {service.durationMinutes}min{price ? ` · ${price}` : ""}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="flex items-center justify-between rounded-lg bg-accent px-3.5 py-2.5 text-sm">
          <span className="text-accent-foreground">
            <span className="font-medium">{selected.name}</span>
            <span className="text-accent-foreground/70"> · {selected.durationMinutes} min</span>
          </span>
          <span className="font-semibold text-accent-foreground">
            {formatPrice(selected.price) ?? "Price on request"}
          </span>
        </div>
      )}
    </div>
  );
}

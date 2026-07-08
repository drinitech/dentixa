import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarX2 } from "lucide-react";

export function SlotGrid({
  slots,
  value,
  onChange,
  isLoading,
}: {
  slots: string[] | undefined;
  value: string | null;
  onChange: (time: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        <CalendarX2 className="h-4 w-4 shrink-0" />
        No free slots on this day — try another date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((time) => (
        <button
          key={time}
          type="button"
          onClick={() => onChange(time)}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition-colors",
            value === time
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-status-approved/10 text-foreground hover:bg-status-approved/20",
          )}
        >
          {time}
        </button>
      ))}
    </div>
  );
}

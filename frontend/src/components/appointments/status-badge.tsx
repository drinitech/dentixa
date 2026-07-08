import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/utils";
import type { AppointmentStatus } from "@/types";

const STATUS_CLASSES: Record<AppointmentStatus, string> = {
  PENDING: "bg-status-pending text-status-pending-foreground",
  APPROVED: "bg-status-approved text-status-approved-foreground",
  REJECTED: "bg-status-rejected text-status-rejected-foreground",
  CANCELLED: "bg-status-cancelled text-status-cancelled-foreground",
  DONE: "bg-status-done text-status-done-foreground",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

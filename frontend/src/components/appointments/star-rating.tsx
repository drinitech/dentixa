"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md";
}) {
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-6 w-6";
  const interactive = Boolean(onChange);

  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className={cn(interactive && "cursor-pointer", !interactive && "cursor-default")}
        >
          <Star
            className={cn(
              iconClass,
              star <= Math.round(value) ? "fill-status-pending text-status-pending" : "text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

// Native <dialog> gives us focus trapping, ESC-to-close, and backdrop for free.
export function Dialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === ref.current) onOpenChange(false);
      }}
      className={cn(
        "m-auto w-full max-w-md rounded-xl border border-border bg-card p-0 text-card-foreground shadow-xl",
        "backdrop:bg-foreground/20 backdrop:backdrop-blur-[1px]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 p-5 pb-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </dialog>
  );
}

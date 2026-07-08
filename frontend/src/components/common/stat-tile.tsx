import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  onClick?: () => void;
  active?: boolean;
}

export function StatTile({ icon: Icon, label, value, onClick, active }: StatTileProps) {
  const iconBox = (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground",
        active && "bg-primary text-primary-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
  const text = (
    <div>
      <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );

  if (onClick) {
    return (
      <Card className={cn("p-0", active && "ring-1 ring-primary")}>
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-muted"
        >
          {iconBox}
          {text}
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex items-center gap-3 p-4">
      {iconBox}
      {text}
    </Card>
  );
}

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-muted-foreground", className)} />;
}

export function PageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );
}

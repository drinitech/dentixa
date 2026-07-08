import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data: URIs aren't supported by next/image
      <img
        src={src}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", SIZE_CLASSES[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initialsOf(name)}
    </div>
  );
}

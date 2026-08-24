export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-border/70 ${className ?? "h-24"}`} />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white">
      <Skeleton className="h-52 rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

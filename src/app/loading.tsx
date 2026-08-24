import { EventCardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-px grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  );
}

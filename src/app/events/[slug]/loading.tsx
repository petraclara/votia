import { EventCardSkeleton } from "@/components/ui/skeleton";

export default function EventLoading() {
  return (
    <div className="container-px py-10">
      <EventCardSkeleton />
    </div>
  );
}

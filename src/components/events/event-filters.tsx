"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const filters = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
];

export function EventFilters({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") params.delete("filter");
    else params.set("filter", id);
    router.push(`/events${params.size ? `?${params}` : ""}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => setFilter(filter.id)}
          className={cn(
            "h-11 shrink-0 rounded-full px-5 text-sm font-semibold",
            current === filter.id
              ? "bg-navy text-white"
              : "bg-white text-muted ring-1 ring-border",
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

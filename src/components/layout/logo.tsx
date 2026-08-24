import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="Votia home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal font-display text-lg font-bold text-navy">
        V
      </span>
      <span className={cn("font-display text-xl font-semibold tracking-tight", light ? "text-white" : "text-navy")}>
        Votia
      </span>
    </Link>
  );
}

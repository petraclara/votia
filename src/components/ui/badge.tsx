import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  LIVE: "bg-danger text-white",
  "Voting Open": "bg-teal text-navy",
  "Coming Soon": "bg-navy-muted text-white",
  "Voting Closed": "bg-muted text-white",
  Completed: "bg-border text-navy",
};

export function Badge({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        tone ? styles[tone] ?? "bg-teal-soft text-navy" : "bg-teal-soft text-navy",
        className,
      )}
    >
      {children}
    </span>
  );
}

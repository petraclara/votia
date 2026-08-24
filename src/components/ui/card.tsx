import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-border bg-white shadow-[var(--shadow)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-teal-dark">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold text-navy md:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-3 text-base text-muted md:text-lg">{description}</p>
      ) : null}
    </div>
  );
}

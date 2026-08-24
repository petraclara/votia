import { cn } from "@/lib/utils";
import Link from "next/link";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "dark";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary:
    "bg-teal text-navy hover:bg-teal-dark focus-visible:outline-teal shadow-[0_10px_24px_rgba(0,194,184,0.28)]",
  secondary: "bg-navy text-white hover:bg-navy-light focus-visible:outline-navy",
  ghost: "bg-transparent text-ink hover:bg-teal-soft",
  outline: "border border-border bg-white text-ink hover:border-teal hover:text-navy",
  dark: "bg-white text-navy hover:bg-teal-soft",
};

const sizes = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-sm md:text-base",
  lg: "h-14 px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
}: {
  href: string;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        variants[variant ?? "primary"],
        sizes[size ?? "md"],
        className,
      )}
    >
      {children}
    </Link>
  );
}

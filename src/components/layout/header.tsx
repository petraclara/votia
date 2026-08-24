"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { navItems } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (isDashboard) return null;

  const authHref =
    session?.user?.role === "ADMIN"
      ? "/admin"
      : session?.user?.role === "ORGANIZER"
        ? "/dashboard"
        : "/login";
  const authLabel =
    session?.user?.role === "ADMIN"
      ? "Admin"
      : session?.user?.role === "ORGANIZER"
        ? "Dashboard"
        : "Organizer Login";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/95 text-white backdrop-blur">
      <div className="container-px flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Logo light />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium text-white/80 transition hover:text-teal",
                pathname === item.href && "text-teal",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href={authHref} className="text-sm font-medium text-white/80 hover:text-white">
            {authLabel}
          </Link>
          <ButtonLink href="/vote" size="sm">
            Vote Now
          </ButtonLink>
        </div>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-white/10 bg-navy px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-medium text-white/90 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={authHref}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-white/90 hover:bg-white/10"
            >
              {authLabel}
            </Link>
            <Link href="/vote" onClick={() => setOpen(false)} className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-teal font-semibold text-navy">
              Vote Now
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

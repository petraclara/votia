"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, Ticket, Trophy, Vote } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/vote", label: "Vote", icon: Vote },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/about", label: "More", icon: Trophy },
];

export function MobileNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur md:hidden"
      aria-label="Mobile"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                  active ? "text-teal-dark" : "text-muted",
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

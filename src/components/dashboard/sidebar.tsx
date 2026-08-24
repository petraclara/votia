"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BarChart3, Calendar, LogOut, Ticket, Wallet } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/events", label: "Events", icon: Calendar },
  { href: "/dashboard/transactions", label: "Votes", icon: Wallet },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-white/10 bg-navy text-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="p-5">
        <Logo light />
        <p className="mt-2 text-xs text-white/60">Organizer dashboard</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-white/80 hover:bg-white/10",
              pathname === link.href && "bg-white/10 text-teal",
            )}
          >
            <link.icon size={16} />
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-auto m-3 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-white/70 hover:bg-white/10"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </aside>
  );
}

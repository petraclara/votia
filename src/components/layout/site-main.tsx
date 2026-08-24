"use client";

import { usePathname } from "next/navigation";

export function SiteMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const appShell = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  return <main className={appShell ? "flex-1" : "flex-1 pb-24 md:pb-0"}>{children}</main>;
}

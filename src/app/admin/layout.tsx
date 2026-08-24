import { requireAdmin } from "@/lib/session";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b border-border bg-navy text-white">
        <div className="container-px flex flex-wrap gap-4 py-4 text-sm font-semibold">
          <Link href="/admin">Admin</Link>
          <Link href="/admin/payments">Payments</Link>
          <Link href="/admin/settlements">Settlements</Link>
          <Link href="/dashboard">Organizer view</Link>
        </div>
      </nav>
      {children}
    </div>
  );
}

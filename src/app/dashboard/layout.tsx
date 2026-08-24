import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-bg lg:flex">
      <DashboardSidebar />
      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}

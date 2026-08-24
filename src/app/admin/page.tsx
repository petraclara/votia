import { disableEventAction, setOrganizerStatusAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [organizers, events] = await Promise.all([
    prisma.organizer.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
    prisma.event.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="container-px py-10">
      <h1 className="text-3xl font-semibold text-navy">Platform admin</h1>
      <p className="mt-2 text-muted">Approve organizers, disable events, and reconcile payments.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/admin/payments" className="font-semibold text-navy">
          Payments
        </Link>
        <Link href="/admin/settlements" className="font-semibold text-navy">
          Settlements
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-navy">Organizers</h2>
        <div className="mt-4 grid gap-3">
          {organizers.map((organizer) => (
            <div key={organizer.id} className="rounded-3xl bg-white p-4 shadow-[var(--shadow)]">
              <p className="font-semibold text-navy">{organizer.organizationName}</p>
              <p className="text-sm text-muted">
                {organizer.user.email} · {organizer.status}
              </p>
              <div className="mt-3 flex gap-2">
                <form
                  action={async () => {
                    "use server";
                    await setOrganizerStatusAction(organizer.id, "APPROVED");
                  }}
                >
                  <Button type="submit" size="sm">
                    Approve
                  </Button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await setOrganizerStatusAction(organizer.id, "SUSPENDED");
                  }}
                >
                  <Button type="submit" size="sm" variant="secondary">
                    Suspend
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-navy">Events</h2>
        <div className="mt-4 grid gap-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-[var(--shadow)]">
              <div>
                <p className="font-semibold text-navy">{event.name}</p>
                <p className="text-sm text-muted">{event.status}</p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await disableEventAction(event.id);
                }}
              >
                <Button type="submit" size="sm" variant="outline">
                  Disable
                </Button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

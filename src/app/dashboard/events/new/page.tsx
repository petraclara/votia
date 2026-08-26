import { EventForm } from "@/components/dashboard/event-form";
import { createEventAction } from "@/app/actions/events";
import { ButtonLink } from "@/components/ui/button";
import { requireApprovedOrganizer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  try {
    await requireApprovedOrganizer();
  } catch {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
        <h1 className="text-3xl font-semibold text-navy">Approval required</h1>
        <p className="mt-3 text-muted">
          Your organizer account is not approved yet. An admin must approve you before you can
          create events or upload images.
        </p>
        <ButtonLink href="/dashboard" className="mt-6">
          Back to dashboard
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold text-navy">Create event</h1>
      <div className="mt-6 rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
        <EventForm action={createEventAction} />
      </div>
    </div>
  );
}

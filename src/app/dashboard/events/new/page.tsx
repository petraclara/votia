import { EventForm } from "@/components/dashboard/event-form";
import { createEventAction } from "@/app/actions/events";

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold text-navy">Create event</h1>
      <div className="mt-6 rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
        <EventForm action={createEventAction} />
      </div>
    </div>
  );
}

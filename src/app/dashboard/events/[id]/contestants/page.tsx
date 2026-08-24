import { notFound } from "next/navigation";
import { deleteContestantAction, upsertContestantAction } from "@/app/actions/contestants";
import { ImageField } from "@/components/dashboard/event-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireOrganizer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ContestantsAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, organizer } = await requireOrganizer();
  const event = await prisma.event.findUnique({
    where: { id },
    include: { contestants: { orderBy: { contestantNumber: "asc" } } },
  });
  if (!event) notFound();
  if (user.role !== "ADMIN" && event.organizerId !== organizer?.id) notFound();

  async function addContestant(formData: FormData) {
    "use server";
    await upsertContestantAction(id, formData);
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-navy">Contestants · {event.name}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow)]">
          <h2 className="font-semibold text-navy">Add contestant</h2>
          <form action={addContestant} className="mt-4 grid gap-3">
            <input name="name" required placeholder="Name" className="h-12 rounded-2xl border border-border px-4" />
            <input name="contestantNumber" required placeholder="Number e.g. 08" className="h-12 rounded-2xl border border-border px-4" />
            <input name="category" required placeholder="Category" className="h-12 rounded-2xl border border-border px-4" />
            <textarea name="bio" required placeholder="Biography" rows={4} className="rounded-2xl border border-border px-4 py-3" />
            <ImageField name="image" label="Contestant photo" />
            <input name="instagram" placeholder="Instagram URL" className="h-12 rounded-2xl border border-border px-4" />
            <input name="twitter" placeholder="X URL" className="h-12 rounded-2xl border border-border px-4" />
            <input name="tiktok" placeholder="TikTok URL" className="h-12 rounded-2xl border border-border px-4" />
            <input name="facebook" placeholder="Facebook URL" className="h-12 rounded-2xl border border-border px-4" />
            <Button type="submit">Add contestant</Button>
          </form>
        </div>
        <div className="space-y-3">
          {event.contestants.map((contestant) => (
            <div key={contestant.id} className="rounded-3xl bg-white p-4 shadow-[var(--shadow)]">
              <p className="font-semibold text-navy">
                #{contestant.contestantNumber} {contestant.name}
              </p>
              <p className="text-sm text-muted">
                {contestant.category} · {contestant.voteCount} votes
              </p>
              <form
                action={async () => {
                  "use server";
                  await deleteContestantAction(id, contestant.id);
                }}
              >
                <button type="submit" className="mt-2 text-sm font-semibold text-danger">
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

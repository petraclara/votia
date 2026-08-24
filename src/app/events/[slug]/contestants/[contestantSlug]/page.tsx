import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShareButtons } from "@/components/events/share-buttons";
import { VoteForm } from "@/components/voting/vote-modal";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { canShowVoteCounts, getVotingState } from "@/lib/events";
import { getContestantBySlugs } from "@/lib/queries";
import { padContestantNumber, siteUrl } from "@/lib/utils";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; contestantSlug: string }>;
}): Promise<Metadata> {
  const { slug, contestantSlug } = await params;
  const data = await getContestantBySlugs(slug, contestantSlug);
  if (!data) return { title: "Contestant" };
  const title = `${data.contestant.name} | ${data.event.name}`;
  const description = `Support ${data.contestant.name} in ${data.event.name}. Vote for her on Votia.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [data.contestant.image],
      url: siteUrl(`/events/${slug}/contestants/${contestantSlug}`),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [data.contestant.image],
    },
  };
}

export default async function ContestantPage({
  params,
}: {
  params: Promise<{ slug: string; contestantSlug: string }>;
}) {
  const { slug, contestantSlug } = await params;
  const data = await getContestantBySlugs(slug, contestantSlug);
  if (!data) notFound();
  const { event, contestant } = data;
  const voting = getVotingState(event);
  const showVotes = canShowVoteCounts(event);
  const socials = [
    contestant.instagram && { href: contestant.instagram, label: "Instagram" },
    contestant.twitter && { href: contestant.twitter, label: "X" },
    contestant.tiktok && { href: contestant.tiktok, label: "TikTok" },
    contestant.facebook && { href: contestant.facebook, label: "Facebook" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <div className="container-px grid gap-8 py-8 md:grid-cols-[0.9fr_1.1fr] md:py-12">
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-navy">
        <Image
          src={contestant.image}
          alt={contestant.name}
          fill
          className="object-cover"
          priority
        />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-dark">
          Contestant #{padContestantNumber(contestant.contestantNumber)}
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-navy">{contestant.name}</h1>
        <p className="mt-2 text-lg text-muted">
          {event.name} · {contestant.category}
        </p>
        <div className="mt-3">
          <Badge tone={voting === "open" ? "Voting Open" : "Voting Closed"}>
            {voting === "open" ? "Voting Open" : "Voting closed"}
          </Badge>
        </div>
        {showVotes ? (
          <p className="mt-4 text-lg font-semibold text-navy">
            {contestant.voteCount.toLocaleString()} votes
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">Vote totals are hidden for this competition.</p>
        )}
        <p className="mt-6 whitespace-pre-line text-muted">{contestant.bio}</p>
        {socials.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {socials.map((social) => (
              <a
                key={social.href}
                href={social.href}
                className="rounded-full bg-teal-soft px-4 py-2 text-sm font-semibold text-navy"
                target="_blank"
                rel="noreferrer"
              >
                {social.label}
              </a>
            ))}
          </div>
        ) : null}
        <div className="mt-6">
          <ShareButtons
            name={contestant.name}
            eventName={event.name}
            path={`/events/${event.slug}/contestants/${contestant.slug}`}
          />
        </div>
        <div className="mt-8">
          {voting === "open" ? (
            <div className="rounded-3xl border border-border bg-white p-5">
              <h2 className="text-xl font-semibold text-navy">Vote for {contestant.name}</h2>
              <div className="mt-4">
                <VoteForm contestant={contestant} event={event} />
              </div>
            </div>
          ) : (
            <ButtonLink href={`/events/${event.slug}`} variant="secondary">
              View event
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <Image
        src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=2000&q=80"
        alt="Audience celebrating at a live event"
        fill
        priority
        className="object-cover opacity-40"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/30" />
      <div className="container-px relative grid min-h-[78vh] items-center py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-teal">
            Vote. Support. Celebrate.
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
            Support Your Favourite. Make Your Vote Count.
          </h1>
          <p className="mt-5 max-w-lg text-base text-white/80 md:text-lg">
            Discover competitions, support your favourite contestants and securely vote
            online.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/events" size="lg">
              Explore Events
            </ButtonLink>
            <ButtonLink href="/vote" size="lg" variant="dark">
              Vote Now
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Lock, Smartphone, Sparkles, Vote } from "lucide-react";

const items = [
  {
    title: "Secure Payments",
    body: "Checkout uses Safaricom Daraja M-Pesa STK Push. Votes are only added after payment is verified on the server.",
    icon: Lock,
  },
  {
    title: "Transparent Voting",
    body: "Organizers choose when vote totals are public, hidden, or revealed after voting closes.",
    icon: Vote,
  },
  {
    title: "Fast Mobile Experience",
    body: "Large tap targets and a short path from event to contestant to payment.",
    icon: Smartphone,
  },
  {
    title: "Reliable Event Management",
    body: "Create events, manage contestants, sell tickets and track revenue from one dashboard.",
    icon: Sparkles,
  },
];

export function TrustSection() {
  return (
    <section className="bg-navy py-16 text-white md:py-20">
      <div className="container-px">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-teal">
            Built for trust
          </p>
          <h2 className="text-3xl font-semibold text-white md:text-4xl">
            Why organizers and fans choose Votia
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {items.map((item) => (
            <article key={item.title} className="rounded-3xl bg-navy-light p-6">
              <item.icon className="text-teal" />
              <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{item.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-white/50">
          Payments are processed with M-Pesa via Safaricom Daraja. Votia never stores card details.
        </p>
      </div>
    </section>
  );
}

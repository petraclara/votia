import { Compass, Heart, ShieldCheck, Wallet } from "lucide-react";
import { SectionHeading } from "@/components/ui/card";

const steps = [
  {
    title: "Find an Event",
    body: "Browse active competitions and events.",
    icon: Compass,
  },
  {
    title: "Pick Your Favourite",
    body: "Choose the contestant you want to support.",
    icon: Heart,
  },
  {
    title: "Choose Your Votes",
    body: "Select how many votes you want to purchase.",
    icon: Wallet,
  },
  {
    title: "Pay Securely",
    body: "Complete payment with M-Pesa STK Push.",
    icon: ShieldCheck,
  },
];

export function HowItWorks() {
  return (
    <section className="container-px py-16 md:py-20">
      <SectionHeading
        eyebrow="Simple flow"
        title="How it works"
        description="Support a contestant in four mobile-friendly steps."
      />
      <ol className="mt-10 grid gap-4 md:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
            <step.icon className="text-teal-dark" />
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-teal-dark">
              Step {index + 1}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-navy">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

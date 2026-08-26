export const metadata = {
  title: "About",
  description: "Votia provides secure digital voting and event ticketing across Kenya.",
};

const categories = [
  "Pageants",
  "Awards",
  "Talent competitions",
  "Fashion events",
  "School competitions",
  "Campus competitions",
  "Community events",
  "Entertainment events",
];

export default function AboutPage() {
  return (
    <div className="container-px py-12 md:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-dark">About Votia</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-navy md:text-5xl">
        Digital voting and ticketing built for African events.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        Votia helps organizers run fair competitions and helps fans support the people they
        believe in. Payments use M-Pesa STK Push via Safaricom Daraja, and votes are credited only after
        the backend confirms a successful transaction.
      </p>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((item) => (
          <div key={item} className="rounded-2xl bg-white p-5 font-semibold text-navy shadow-[var(--shadow)]">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

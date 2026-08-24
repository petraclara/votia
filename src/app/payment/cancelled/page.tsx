import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Payment cancelled" };

export default function PaymentCancelledPage() {
  return (
    <div className="container-px py-16 text-center">
      <h1 className="text-3xl font-semibold text-navy">Payment cancelled</h1>
      <p className="mt-3 text-muted">No votes or tickets were added.</p>
      <ButtonLink href="/events" className="mt-6">
        Back to events
      </ButtonLink>
    </div>
  );
}

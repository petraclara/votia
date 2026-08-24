import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-px py-20 text-center">
      <h1 className="text-4xl font-semibold text-navy">Page not found</h1>
      <p className="mt-3 text-muted">The event or page you requested is unavailable.</p>
      <ButtonLink href="/events" className="mt-6">
        Browse events
      </ButtonLink>
    </div>
  );
}

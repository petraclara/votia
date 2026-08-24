import { ContactForm } from "@/components/contact/contact-form";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description: "Talk to the Votia team about voting, ticketing or organizer accounts.",
};

export default function ContactPage() {
  return (
    <div className="container-px grid gap-10 py-12 md:grid-cols-2 md:py-16">
      <div>
        <h1 className="text-4xl font-semibold text-navy">Contact</h1>
        <p className="mt-3 text-muted">
          Questions about an event, a payment, or becoming an organizer? Send a message.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          <li>
            <strong>Email:</strong> {siteConfig.contact.email}
          </li>
          <li>
            <strong>Phone:</strong> {siteConfig.contact.phone}
          </li>
          <li>
            <strong>WhatsApp:</strong>{" "}
            <a href={`https://wa.me/${siteConfig.contact.whatsapp}`}>Chat with us</a>
          </li>
          <li>
            <a href={siteConfig.social.instagram}>Instagram</a> ·{" "}
            <a href={siteConfig.social.facebook}>Facebook</a> ·{" "}
            <a href={siteConfig.social.x}>X</a>
          </li>
        </ul>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
        <ContactForm />
      </div>
    </div>
  );
}

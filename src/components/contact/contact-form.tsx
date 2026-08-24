"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export function ContactForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to send message.");
        return;
      }
      setStatus("Thanks. We will get back to you shortly.");
    });
  }

  return (
    <form action={submit} className="grid gap-3">
      <input name="name" required placeholder="Name" className="h-12 rounded-2xl border border-border px-4" />
      <input name="email" type="email" required placeholder="Email" className="h-12 rounded-2xl border border-border px-4" />
      <input name="phone" placeholder="Phone" className="h-12 rounded-2xl border border-border px-4" />
      <input name="subject" required placeholder="Subject" className="h-12 rounded-2xl border border-border px-4" />
      <textarea
        name="message"
        required
        placeholder="Message"
        rows={5}
        className="rounded-2xl border border-border px-4 py-3"
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {status ? <p className="text-sm text-success">{status}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send message"}
      </Button>
      <p className="text-sm text-muted">
        Or reach us on{" "}
        <a className="font-semibold text-navy" href={`https://wa.me/${siteConfig.contact.whatsapp}`}>
          WhatsApp
        </a>{" "}
        and {siteConfig.contact.email}.
      </p>
    </form>
  );
}

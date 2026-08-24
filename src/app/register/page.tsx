"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
          organizationName: formData.get("organizationName"),
          phone: formData.get("phone"),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to create account.");
        return;
      }
      router.push("/login");
    });
  }

  return (
    <div className="container-px flex min-h-[70vh] items-center py-12">
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
        <h1 className="text-3xl font-semibold text-navy">Create organizer account</h1>
        <p className="mt-2 text-sm text-muted">
          Accounts are reviewed before you can publish live events.
        </p>
        <form action={submit} className="mt-6 grid gap-3">
          <input name="name" required placeholder="Your name" className="h-12 rounded-2xl border border-border px-4" />
          <input name="organizationName" required placeholder="Organization name" className="h-12 rounded-2xl border border-border px-4" />
          <input name="phone" required placeholder="Phone" className="h-12 rounded-2xl border border-border px-4" />
          <input name="email" type="email" required placeholder="Email" className="h-12 rounded-2xl border border-border px-4" />
          <input name="password" type="password" required minLength={8} placeholder="Password" className="h-12 rounded-2xl border border-border px-4" />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Register"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-navy">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

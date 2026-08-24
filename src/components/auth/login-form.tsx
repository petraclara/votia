"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(searchParams.get("callbackUrl") || "/dashboard");
    router.refresh();
  }

  return (
    <div className="container-px flex min-h-[70vh] items-center py-12">
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
        <h1 className="text-3xl font-semibold text-navy">Organizer login</h1>
        <p className="mt-2 text-sm text-muted">Access your Votia dashboard.</p>
        <form action={onSubmit} className="mt-6 grid gap-3">
          <input name="email" type="email" required placeholder="Email" className="h-12 rounded-2xl border border-border px-4" />
          <input name="password" type="password" required placeholder="Password" className="h-12 rounded-2xl border border-border px-4" />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          New organizer?{" "}
          <Link href="/register" className="font-semibold text-navy">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { Check, Copy, Facebook } from "lucide-react";
import { useState } from "react";
import { siteUrl } from "@/lib/utils";

export function ShareButtons({
  name,
  eventName,
  path,
}: {
  name: string;
  eventName: string;
  path: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = siteUrl(path);
  const text = `Support ${name} in ${eventName}. Vote on Votia.`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={whatsapp}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-11 items-center rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white"
      >
        Share on WhatsApp
      </a>
      <a
        href={facebook}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1877F2] px-4 text-sm font-semibold text-white"
      >
        <Facebook size={16} />
        Facebook
      </a>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-navy"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Copied" : "Copy Link"}
      </button>
    </div>
  );
}

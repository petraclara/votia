import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getAppUrl } from "@/lib/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function padContestantNumber(value: string | number) {
  return String(value).padStart(2, "0");
}

export function siteUrl(path = "") {
  const base = getAppUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function absoluteUrl(path: string) {
  return siteUrl(path);
}

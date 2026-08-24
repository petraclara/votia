export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000"
  ).replace(/\/$/, "");
}

export const siteConfig = {
  name: "Votia",
  tagline: "Vote. Support. Celebrate.",
  description:
    "Discover competitions, support your favourite contestants and securely vote online. Votia provides digital voting and event ticketing across Kenya.",
  url: getAppUrl(),
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@votia.co.ke",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+254 700 000 000",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "254700000000",
  },
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM ?? "https://instagram.com/votia",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK ?? "https://facebook.com/votia",
    x: process.env.NEXT_PUBLIC_X ?? "https://x.com/votia",
  },
} as const;

export const votePacks = [1, 5, 10, 20, 50, 100] as const;

export const navItems = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/vote", label: "Vote" },
  { href: "/tickets", label: "Tickets" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

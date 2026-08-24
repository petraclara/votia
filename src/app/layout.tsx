import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteMain } from "@/components/layout/site-main";
import { Providers } from "@/components/providers";
import { getAppUrl, siteConfig } from "@/lib/site";
import "./globals.css";

const appUrl = getAppUrl();

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "online voting Kenya",
    "pageant voting",
    "event tickets",
    "talent awards",
    "campus competitions",
  ],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#071A2B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full bg-bg font-sans text-ink antialiased">
        <Providers>
          <div className="flex min-h-full flex-col">
            <Header />
            <SiteMain>{children}</SiteMain>
            <Footer />
            <MobileNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await prisma.event.findMany({
    where: { status: { notIn: ["DRAFT", "DISABLED"] } },
    include: { contestants: true },
  }).catch(() => []);

  const staticRoutes = ["", "/events", "/vote", "/tickets", "/about", "/contact"].map((path) => ({
    url: siteUrl(path || "/"),
    lastModified: new Date(),
  }));

  const eventRoutes = events.flatMap((event) => [
    {
      url: siteUrl(`/events/${event.slug}`),
      lastModified: event.updatedAt,
    },
    ...event.contestants.map((contestant) => ({
      url: siteUrl(`/events/${event.slug}/contestants/${contestant.slug}`),
      lastModified: contestant.updatedAt,
    })),
  ]);

  return [...staticRoutes, ...eventRoutes];
}

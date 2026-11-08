import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/data";
import { COLLECTIONS } from "@/lib/collections";
import { site } from "@/lib/site";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { models } = await getCatalog();
  const b = site.url.replace(/\/$/, "");
  const statics = ["", "/best-models-for", "/leaderboard", "/compare", "/makers", "/methodology", "/api-docs"];
  return [
    ...statics.map((p) => ({ url: b + p, changeFrequency: "daily" as const })),
    ...COLLECTIONS.map((c) => ({ url: `${b}/best-models-for/${c.slug}`, changeFrequency: "daily" as const })),
    ...models.map((m) => ({ url: `${b}/models/${m.slug}`, changeFrequency: "weekly" as const })),
  ];
}

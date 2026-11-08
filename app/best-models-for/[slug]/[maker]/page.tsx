import type { Metadata } from "next";
import { getCollection } from "@/lib/collections";
import { RankingPage } from "@/components/RankingPage";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string; maker: string }> }): Promise<Metadata> {
  const p = await params;
  const c = getCollection(p.slug);
  return c ? { title: `Best ${p.maker} models for ${c.title}` } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string; maker: string }> }) {
  const p = await params;
  return <RankingPage slug={p.slug} maker={p.maker} />;
}

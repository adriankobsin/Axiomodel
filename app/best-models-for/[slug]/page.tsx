import type { Metadata } from "next";
import { COLLECTIONS, getCollection } from "@/lib/collections";
import { RankingPage } from "@/components/RankingPage";

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = getCollection((await params).slug);
  return c ? { title: `Best AI models for ${c.title}`, description: `${c.blurb} ${c.intro}` } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <RankingPage slug={(await params).slug} />;
}

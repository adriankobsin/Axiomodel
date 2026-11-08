import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/data";
import { COLLECTIONS, rank } from "@/lib/collections";
import { MakerBadge, PageHead } from "@/components/ui";
import { RankTable } from "@/components/RankTable";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return { title: `${(await params).slug} models` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { models } = await getCatalog();
  const mine = models.filter((m) => m.makerSlug === slug);
  if (!mine.length) notFound();
  const name = mine[0].maker;
  const r = rank(models, COLLECTIONS.find((c) => c.slug === "smartest")!, slug);
  return (
    <div>
      <PageHead kicker={`${mine.length} models`} title={<span className="flex items-center gap-4"><MakerBadge slug={slug} name={name} size={48} /> <span className="grad-text">{name}</span></span>} />
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2">
          <span className="hud-label mr-1 self-center">Best {name} models for</span>
          {COLLECTIONS.filter((c) => rank(models, c, slug).rows.length > 0).map((c) => (
            <Link key={c.slug} href={`/best-models-for/${c.slug}/${slug}`} className="chip !py-1.5 hover:!text-cyan hover:!border-cyan/50">{c.icon} {c.title}</Link>
          ))}
        </div>
        <RankTable rows={r.rows} metric={r.metric} limit={100} />
      </div>
    </div>
  );
}

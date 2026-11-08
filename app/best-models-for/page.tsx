import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/data";
import { COLLECTIONS, rank } from "@/lib/collections";
import { DataBanner, MakerBadge, PageHead } from "@/components/ui";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Best AI models for every use case" };

export default async function Page() {
  const catalog = await getCatalog();
  const groups = ["Use cases", "Constraints", "Frameworks & tools"] as const;
  return (
    <div>
      <PageHead kicker={`${COLLECTIONS.length} rankings · live`} title={<>Best models <span className="grad-text">for…</span></>}>
        <p className="text-dim max-w-2xl">There&apos;s no single best AI model. Pick the job, and we rank every model that can do it on the metric that matters for that job.</p>
      </PageHead>
      <div className="space-y-12">
        <DataBanner catalog={catalog} />
        {groups.map((g) => (
          <section key={g} className="space-y-4">
            <h2 className="hud-label !text-dim">// {g}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COLLECTIONS.filter((c) => c.group === g).map((c) => {
                const r = rank(catalog.models, c);
                return (
                  <Link key={c.slug} href={`/best-models-for/${c.slug}`} className="glass corner rounded-xl p-5 hover:border-cyan/40 transition-colors group">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-lg group-hover:text-cyan transition-colors">{c.title}</div>
                        <div className="text-sm text-dim mt-1">{c.blurb}</div>
                      </div>
                      <span className="font-mono text-cyan text-lg">{c.icon}</span>
                    </div>
                    <ol className="mt-4 space-y-2 border-t border-line pt-3">
                      {r.rows.slice(0, 3).map((x) => (
                        <li key={x.model.id} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-mute w-5">{x.rank}</span>
                          <MakerBadge slug={x.model.makerSlug} name={x.model.maker} size={18} />
                          <span className="truncate">{x.model.name}</span>
                          <span className="ml-auto font-mono text-dim">{r.metric.display(x.value)}</span>
                        </li>
                      ))}
                    </ol>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

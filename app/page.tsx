import Link from "next/link";
import { getCatalog, getMakers } from "@/lib/data";
import { COLLECTIONS, METRICS, rank } from "@/lib/collections";
import { ModelSearch } from "@/components/ModelSearch";
import { DataBanner, MakerBadge } from "@/components/ui";
import { RankTable } from "@/components/RankTable";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function Home() {
  const catalog = await getCatalog();
  const makers = await getMakers();
  const { models } = catalog;
  const top = rank(models, COLLECTIONS.find((c) => c.slug === "smartest")!);
  const featured = ["coding", "agents", "vision", "cheapest", "fastest", "open-source", "free", "long-context"]
    .map((s) => COLLECTIONS.find((c) => c.slug === s)!)
    .map((c) => ({ c, r: rank(models, c) }));

  const searchItems = [
    ...COLLECTIONS.map((c) => ({ slug: c.slug, name: c.title, maker: "", kind: "collection" as const })),
    ...models.map((m) => ({ slug: m.slug, name: m.name, maker: m.maker, kind: "model" as const })),
  ];

  return (
    <div className="space-y-20">
      {/* HERO */}
      <section className="pt-20 pb-6 grid gap-10">
        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center gap-2 hud-label">
            <span className="live-dot" /> Live index · {models.length} models · {makers.length} labs
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-[-0.035em] leading-[0.95]">
            The right model <br />
            <span className="grad-text">for every job.</span>
          </h1>
          <p className="text-lg text-dim max-w-2xl">{site.description}</p>
        </div>
        <ModelSearch items={searchItems} />
        <div className="flex flex-wrap gap-2">
          {COLLECTIONS.slice(0, 9).map((c) => (
            <Link key={c.slug} href={`/best-models-for/${c.slug}`} className="chip !text-[11.5px] !px-3 !py-1.5 hover:!text-cyan hover:!border-cyan/50 transition-colors">
              {c.icon} {c.title}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/playground" className="rounded-lg bg-gradient-to-r from-cyan to-violet text-void font-medium px-5 py-3">Chat with free models now →</Link>
          <Link href="/leaderboard" className="rounded-lg border border-line-2 px-5 py-3 text-dim hover:text-ink hover:border-cyan/40">Open the leaderboard</Link>
        </div>
        <DataBanner catalog={catalog} />
      </section>

      {/* STAT STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line rounded-xl overflow-hidden border border-line">
        {[
          ["Models tracked", String(models.length)],
          ["AI labs", String(makers.length)],
          ["Free models", String(models.filter((m) => m.free).length)],
          ["Open-weight", String(models.filter((m) => m.openWeights).length)],
        ].map(([k, v]) => (
          <div key={k} className="bg-panel/90 p-6">
            <div className="hud-label">{k}</div>
            <div className="mt-2 font-mono text-3xl text-ink">{v}</div>
          </div>
        ))}
      </section>

      {/* USE CASE GRID */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="hud-label">// rankings</div>
            <h2 className="text-3xl font-semibold tracking-tight mt-1">Best models for…</h2>
          </div>
          <Link href="/best-models-for" className="text-sm text-cyan hover:underline">All {COLLECTIONS.length} rankings →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map(({ c, r }) => {
            const w = r.rows[0];
            return (
              <Link key={c.slug} href={`/best-models-for/${c.slug}`} className="glass corner rounded-xl p-5 hover:border-cyan/40 transition-colors group flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan text-lg">{c.icon}</span>
                  <span className="hud-label">{r.metric.short}</span>
                </div>
                <div>
                  <div className="font-semibold text-lg group-hover:text-cyan transition-colors">{c.title}</div>
                  <div className="text-sm text-dim mt-1">{c.blurb}</div>
                </div>
                {w && (
                  <div className="mt-auto pt-4 border-t border-line flex items-center gap-2.5">
                    <MakerBadge slug={w.model.makerSlug} name={w.model.maker} />
                    <span className="truncate text-sm">{w.model.name}</span>
                    <span className="ml-auto font-mono text-sm text-cyan">{r.metric.display(w.value)}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* TOP 10 */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="hud-label">// leaderboard</div>
            <h2 className="text-3xl font-semibold tracking-tight mt-1">Top 10 by {top.fallback ? METRICS.heuristic.label : "intelligence"}</h2>
          </div>
          <Link href="/leaderboard" className="text-sm text-cyan hover:underline">Full leaderboard →</Link>
        </div>
        <RankTable rows={top.rows} metric={top.metric} limit={10} />
      </section>
    </div>
  );
}

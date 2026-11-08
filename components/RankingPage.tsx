import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/data";
import { answerSentence, COLLECTIONS, getCollection, rank } from "@/lib/collections";
import { DataBanner, MakerBadge, PageHead } from "./ui";
import { RankTable } from "./RankTable";

export async function RankingPage({ slug, maker }: { slug: string; maker?: string }) {
  const c = getCollection(slug);
  if (!c) notFound();
  const catalog = await getCatalog();
  const r = rank(catalog.models, c, maker);
  const makerName = maker ? catalog.models.find((m) => m.makerSlug === maker)?.maker : undefined;
  if (maker && !makerName) notFound();

  // makers that have at least one model in this collection
  const all = rank(catalog.models, c);
  const makerCounts = new Map<string, { name: string; n: number }>();
  for (const row of all.rows) {
    const e = makerCounts.get(row.model.makerSlug) ?? { name: row.model.maker, n: 0 };
    e.n++;
    makerCounts.set(row.model.makerSlug, e);
  }
  const related = COLLECTIONS.filter((x) => x.group === c.group && x.slug !== c.slug).slice(0, 6);
  const winner = r.rows[0];
  const month = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const faq = [
    { q: `What is the best ${makerName ? makerName + " " : ""}model for ${c.title.toLowerCase()}?`, a: answerSentence(c, r, makerName) },
    { q: "How is this ranking calculated?", a: `${c.intro} ${r.fallback ? "Benchmark data isn't available for this metric right now, so models are ordered by the Axiom heuristic score (recency, context, capabilities and price tier)." : `The metric used is ${r.metric.label}.`}` },
    { q: "How often is it updated?", a: "Prices, context and capabilities refresh every hour from the live catalog. Benchmark scores refresh every few hours." },
  ];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }),
        }}
      />
      <nav className="pt-8 text-sm font-mono text-mute flex gap-2">
        <Link href="/best-models-for" className="hover:text-cyan">best-models-for</Link>
        <span>/</span>
        <Link href={`/best-models-for/${c.slug}`} className={maker ? "hover:text-cyan" : "text-dim"}>{c.slug}</Link>
        {maker && (<><span>/</span><span className="text-dim">{maker}</span></>)}
      </nav>
      <PageHead kicker={`${c.group} · Updated ${month}`} title={<>Best {makerName ? <span className="grad-text">{makerName}</span> : null} models for <span className={makerName ? "" : "grad-text"}>{c.title}</span></>}>
        <p className="text-dim max-w-3xl">{c.intro}</p>
      </PageHead>

      <div className="space-y-6">
        <DataBanner catalog={catalog} />

        {/* Answer box */}
        {winner && (
          <div className="glass glow-border rounded-xl p-6 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div className="space-y-2">
              <div className="hud-label text-cyan">// answer</div>
              <p className="text-lg leading-relaxed">{answerSentence(c, r, makerName)}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="chip">Metric: {r.metric.label}</span>
                {c.filterNote && <span className="chip">Filter: {c.filterNote}</span>}
                <span className="chip">{r.rows.length} qualifying models</span>
                {r.fallback && <span className="chip !text-violet !border-violet/40">Heuristic fallback</span>}
              </div>
            </div>
            <Link href={`/models/${winner.model.slug}`} className="flex items-center gap-4 rounded-lg border border-cyan/30 bg-cyan/[0.05] px-5 py-4 hover:bg-cyan/[0.1] transition-colors">
              <MakerBadge slug={winner.model.makerSlug} name={winner.model.maker} size={40} />
              <div>
                <div className="hud-label">#01 pick</div>
                <div className="font-semibold">{winner.model.name}</div>
                <div className="font-mono text-cyan text-xl">{r.metric.display(winner.value)}</div>
              </div>
            </Link>
          </div>
        )}

        {/* Maker filter */}
        {makerCounts.size > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="hud-label mr-1">Filter by lab</span>
            <Link href={`/best-models-for/${c.slug}`} className={`chip !py-1 ${!maker ? "!text-cyan !border-cyan/50" : "hover:!text-ink"}`}>All</Link>
            {[...makerCounts.entries()].slice(0, 16).map(([s, { name, n }]) => (
              <Link key={s} href={`/best-models-for/${c.slug}/${s}`} className={`chip !py-1 ${maker === s ? "!text-cyan !border-cyan/50" : "hover:!text-ink"}`}>
                {name} <span className="text-mute">{n}</span>
              </Link>
            ))}
          </div>
        )}

        <RankTable rows={r.rows} metric={r.metric} limit={50} />

        <section className="grid md:grid-cols-2 gap-6 pt-10">
          <div className="space-y-3">
            <div className="hud-label">// frequently asked</div>
            {faq.map((f) => (
              <details key={f.q} className="glass rounded-lg px-5 py-4 group" open={f === faq[0]}>
                <summary className="cursor-pointer font-medium list-none flex justify-between gap-4">
                  {f.q} <span className="font-mono text-cyan group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-dim mt-3 text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="space-y-3">
            <div className="hud-label">// related rankings</div>
            <div className="grid grid-cols-2 gap-3">
              {related.map((x) => (
                <Link key={x.slug} href={`/best-models-for/${x.slug}${maker ? "/" + maker : ""}`} className="glass rounded-lg p-4 hover:border-cyan/40 transition-colors">
                  <div className="font-mono text-cyan">{x.icon}</div>
                  <div className="font-medium mt-1">{x.title}</div>
                  <div className="text-xs text-mute mt-1">{x.blurb}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog, getModel } from "@/lib/data";
import { COLLECTIONS, rank } from "@/lib/collections";
import { blended, fmtCtx, fmtDate, fmtNum, fmtPrice } from "@/lib/format";
import { CapChips, MakerBadge, ScoreBar } from "@/components/ui";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = await getModel((await params).slug);
  return m ? { title: `${m.name} — benchmarks, price & speed`, description: m.description.slice(0, 160) } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const m = await getModel((await params).slug);
  if (!m) notFound();
  const { models } = await getCatalog();

  // Where does this model place across rankings?
  const placements = COLLECTIONS.map((c) => {
    const r = rank(models, c);
    const row = r.rows.find((x) => x.model.id === m.id);
    return row ? { c, rank: row.rank, of: r.rows.length, value: r.metric.display(row.value) } : null;
  })
    .filter((x): x is NonNullable<typeof x> => !!x && x.rank <= 25)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 8);

  const bench: [string, number | undefined, number][] = [
    ["Intelligence Index", m.scores.intelligence, 100],
    ["Coding Index", m.scores.coding, 100],
    ["Math Index", m.scores.math, 100],
    ["GPQA Diamond %", m.scores.gpqa, 100],
  ];
  const peers = models
    .filter((x) => x.makerSlug === m.makerSlug && x.id !== m.id)
    .sort((a, b) => (b.scores.intelligence ?? b.heuristic) - (a.scores.intelligence ?? a.heuristic))
    .slice(0, 5);

  const stats: [string, string][] = [
    ["Input / 1M", m.free ? "Free" : fmtPrice(m.priceIn)],
    ["Output / 1M", m.free ? "Free" : fmtPrice(m.priceOut)],
    ["Blended / 1M", m.free ? "Free" : fmtPrice(blended(m))],
    ["Context", fmtCtx(m.context)],
    ["Max output", m.maxOutput ? fmtCtx(m.maxOutput) : "—"],
    ["Speed", m.speed ? `${Math.round(m.speed)} t/s` : "—"],
    ["Latency (TTFT)", m.ttft ? `${m.ttft.toFixed(2)}s` : "—"],
    ["Released", fmtDate(m.created)],
  ];

  return (
    <div className="pt-8 space-y-8">
      <nav className="text-sm font-mono text-mute flex gap-2">
        <Link href="/leaderboard" className="hover:text-cyan">models</Link>/<Link href={`/makers/${m.makerSlug}`} className="hover:text-cyan">{m.makerSlug}</Link>/<span className="text-dim truncate">{m.id.split("/")[1]}</span>
      </nav>

      <header className="glass glow-border rounded-2xl p-7 grid md:grid-cols-[1fr_auto] gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <MakerBadge slug={m.makerSlug} name={m.maker} size={44} />
            <div>
              <div className="hud-label">{m.maker}</div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{m.name}</h1>
            </div>
          </div>
          <CapChips m={m} max={8} />
          {m.description && <p className="text-dim leading-relaxed max-w-3xl line-clamp-5">{m.description}</p>}
          <div className="flex flex-wrap gap-2 font-mono text-xs text-mute">
            <span className="chip">id: {m.id}</span>
            {m.hfId && <a className="chip hover:!text-cyan" href={`https://huggingface.co/${m.hfId}`} target="_blank" rel="noreferrer">weights ↗</a>}
            <a className="chip hover:!text-cyan" href={`https://openrouter.ai/${m.id}`} target="_blank" rel="noreferrer">try on OpenRouter ↗</a>
          </div>
        </div>
        <div className="flex md:flex-col gap-3 md:min-w-[200px]">
          <div className="rounded-xl border border-cyan/30 bg-cyan/[0.05] p-4 flex-1">
            <div className="hud-label">Intelligence</div>
            <div className="font-mono text-4xl text-cyan mt-1">{fmtNum(m.scores.intelligence)}</div>
          </div>
          <div className="rounded-xl border border-violet/30 bg-violet/[0.06] p-4 flex-1">
            <div className="hud-label">Axiom score</div>
            <div className="font-mono text-4xl text-violet mt-1">{fmtNum(m.heuristic)}</div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line rounded-xl overflow-hidden border border-line">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-panel/90 p-5">
            <div className="hud-label">{k}</div>
            <div className="mt-1.5 font-mono text-xl">{v}</div>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="glass rounded-xl p-6 space-y-5">
          <div className="hud-label">// benchmarks</div>
          {bench.map(([l, v, max]) => (
            <div key={l} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-dim">{l}</span>
                <span className="font-mono">{fmtNum(v)}</span>
              </div>
              {v !== undefined ? <ScoreBar value={v} max={max} /> : <div className="h-1.5 rounded-full bg-line/60" />}
            </div>
          ))}
          {m.scores.intelligence === undefined && <p className="text-xs text-mute">No independent benchmark data is available for this model yet.</p>}
        </section>

        <section className="glass rounded-xl p-6 space-y-3">
          <div className="hud-label">// ranks in</div>
          {placements.length === 0 && <p className="text-sm text-dim">Not in the top 25 of any ranking.</p>}
          {placements.map((p) => (
            <Link key={p.c.slug} href={`/best-models-for/${p.c.slug}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-cyan/[0.05] border border-transparent hover:border-line">
              <span className={`font-mono text-lg w-10 ${p.rank <= 3 ? "text-cyan" : "text-dim"}`}>#{p.rank}</span>
              <span className="flex-1">{p.c.title}<span className="text-mute text-xs font-mono ml-2">of {p.of}</span></span>
              <span className="font-mono text-sm text-dim">{p.value}</span>
            </Link>
          ))}
        </section>
      </div>

      {peers.length > 0 && (
        <section className="space-y-3">
          <div className="hud-label">// more from {m.maker}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {peers.map((p) => (
              <Link key={p.id} href={`/models/${p.slug}`} className="glass rounded-lg p-4 hover:border-cyan/40">
                <div className="font-medium truncate">{p.name}</div>
                <div className="font-mono text-xs text-mute mt-1">{p.free ? "Free" : fmtPrice(blended(p)) + "/M"} · {fmtCtx(p.context)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className="flex flex-wrap gap-3">
        {m.outputMods.includes("text") && (
          <Link href={`/playground?model=${m.slug}`} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-violet text-void font-medium px-4 py-2.5">
            {m.free ? "Chat with it free →" : "Chat with it →"}
          </Link>
        )}
        <Link href={`/compare?m=${m.slug}`} className="inline-flex items-center gap-2 rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2.5 text-cyan hover:bg-cyan/20">Compare {m.name} with others →</Link>
      </div>
    </div>
  );
}

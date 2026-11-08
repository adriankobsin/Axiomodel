import Link from "next/link";
import type { Metric, Ranked } from "@/lib/collections";
import { blended, fmtCtx, fmtPrice } from "@/lib/format";
import { CapChips, MakerBadge, ScoreBar } from "./ui";

export function RankTable({ rows, metric, limit = 50 }: { rows: Ranked[]; metric: Metric; limit?: number }) {
  const shown = rows.slice(0, limit);
  const values = shown.map((r) => r.value);
  const max = metric.higherIsBetter ? Math.max(...values) : Math.max(...values);
  const min = Math.min(...values);
  // For lower-is-better metrics, invert bar so the best has the longest bar
  const barVal = (v: number) => (metric.higherIsBetter ? v : max - v + min);

  if (!shown.length)
    return <div className="glass rounded-xl p-10 text-center text-dim">No models match this ranking yet.</div>;

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="grid grid-cols-[44px_1fr_110px] md:grid-cols-[56px_1fr_150px_110px_90px_180px] items-center gap-4 px-4 py-2.5 border-b border-line hud-label">
        <span>#</span>
        <span>Model</span>
        <span className="hidden md:block">Capabilities</span>
        <span className="hidden md:block text-right">$/M blend</span>
        <span className="hidden md:block text-right">Context</span>
        <span className="text-right">{metric.short}</span>
      </div>
      <ol>
        {shown.map((r) => {
          const m = r.model;
          const top = r.rank <= 3;
          return (
            <li key={m.id}>
              <Link
                href={`/models/${m.slug}`}
                className={`grid grid-cols-[44px_1fr_110px] md:grid-cols-[56px_1fr_150px_110px_90px_180px] items-center gap-4 px-4 py-3 border-b border-line/60 hover:bg-cyan/[0.04] transition-colors group ${top ? "bg-violet/[0.03]" : ""}`}
              >
                <span className={`font-mono text-sm ${r.rank === 1 ? "text-cyan" : top ? "text-violet" : "text-mute"}`}>{String(r.rank).padStart(2, "0")}</span>
                <span className="flex items-center gap-3 min-w-0">
                  <MakerBadge slug={m.makerSlug} name={m.maker} size={26} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium group-hover:text-cyan transition-colors">{m.name}</span>
                    <span className="block text-xs text-mute font-mono truncate">{m.maker}</span>
                  </span>
                </span>
                <span className="hidden md:block">
                  <CapChips m={m} max={3} />
                </span>
                <span className="hidden md:block text-right font-mono text-sm text-dim">{m.free ? <span className="text-lime">Free</span> : fmtPrice(blended(m))}</span>
                <span className="hidden md:block text-right font-mono text-sm text-dim">{fmtCtx(m.context)}</span>
                <span className="flex flex-col items-end gap-1.5">
                  <span className={`font-mono text-sm ${r.rank === 1 ? "text-cyan" : "text-ink"}`}>{metric.display(r.value)}</span>
                  <span className="w-full max-w-[150px] hidden md:block">
                    <ScoreBar value={barVal(r.value)} max={max} />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

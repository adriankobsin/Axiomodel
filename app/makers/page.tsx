import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog, getMakers } from "@/lib/data";
import { blended, fmtNum, fmtPrice } from "@/lib/format";
import { MakerBadge, PageHead } from "@/components/ui";

export const revalidate = 3600;
export const metadata: Metadata = { title: "AI model makers" };

export default async function Page() {
  const makers = await getMakers();
  const { models } = await getCatalog();
  return (
    <div>
      <PageHead kicker={`${makers.length} labs · ${models.length} models`} title={<>AI model <span className="grad-text">makers</span></>}>
        <p className="text-dim max-w-2xl">Every lab in the index, with its strongest model and cheapest entry point.</p>
      </PageHead>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {makers.map((mk) => (
          <Link key={mk.slug} href={`/makers/${mk.slug}`} className="glass corner rounded-xl p-5 hover:border-cyan/40 transition-colors group">
            <div className="flex items-center gap-3">
              <MakerBadge slug={mk.slug} name={mk.name} size={36} />
              <div>
                <div className="font-semibold text-lg group-hover:text-cyan">{mk.name}</div>
                <div className="font-mono text-xs text-mute">{mk.count} models</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-line grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="hud-label">Best</div>
                <div className="truncate">{mk.best?.name}</div>
                <div className="font-mono text-cyan text-xs">{fmtNum(mk.best?.scores.intelligence ?? mk.best?.heuristic)}</div>
              </div>
              <div>
                <div className="hud-label">From</div>
                <div className="font-mono">{mk.cheapest ? (mk.cheapest.free ? "Free" : fmtPrice(blended(mk.cheapest)) + "/M") : "—"}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

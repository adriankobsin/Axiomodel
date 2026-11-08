import type { Metadata } from "next";
import { getCatalog } from "@/lib/data";
import { Compare } from "@/components/Compare";
import { PageHead } from "@/components/ui";

export const metadata: Metadata = { title: "Compare AI models side by side" };

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const { models } = await getCatalog();
  const fallback = [...models].sort((a, b) => (b.scores.intelligence ?? b.heuristic) - (a.scores.intelligence ?? a.heuristic)).slice(0, 3).map((x) => x.slug);
  return (
    <div>
      <PageHead kicker="Up to 4 models · best value highlighted" title={<>Compare <span className="grad-text">models</span></>}>
        <p className="text-dim max-w-2xl">Benchmarks, speed, price and capabilities side by side. The best value in each row is marked ◆.</p>
      </PageHead>
      <Compare models={models} initial={m ? m.split(",") : fallback} />
    </div>
  );
}

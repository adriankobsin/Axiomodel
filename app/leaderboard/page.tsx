import type { Metadata } from "next";
import { getCatalog } from "@/lib/data";
import { Leaderboard } from "@/components/Leaderboard";
import { DataBanner, PageHead } from "@/components/ui";

export const revalidate = 3600;
export const metadata: Metadata = { title: "AI model leaderboard" };

export default async function Page() {
  const catalog = await getCatalog();
  return (
    <div>
      <PageHead kicker={`${catalog.models.length} models · sortable · live`} title={<>LLM <span className="grad-text">leaderboard</span></>}>
        <p className="text-dim max-w-2xl">Every model in one table. Sort any column, filter by lab, price and capability. Click a model for its full profile.</p>
      </PageHead>
      <div className="space-y-4">
        <DataBanner catalog={catalog} />
        <Leaderboard models={catalog.models} benchmarks={catalog.benchmarks} />
      </div>
    </div>
  );
}

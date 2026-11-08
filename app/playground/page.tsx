import type { Metadata } from "next";
import { getCatalog } from "@/lib/data";
import { isPro } from "@/lib/entitlement";
import { dailyLimit } from "@/lib/limits";
import { Playground } from "@/components/Playground";
import { PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Playground — chat with any AI model" };

export default async function Page({ searchParams }: { searchParams: Promise<{ model?: string }> }) {
  const { model } = await searchParams;
  const [{ models }, pro] = await Promise.all([getCatalog(), isPro()]);
  const chat = models
    .filter((m) => m.outputMods.includes("text"))
    .sort((a, b) => (b.scores.intelligence ?? b.heuristic / 2) - (a.scores.intelligence ?? a.heuristic / 2))
    .map((m) => ({ id: m.id, slug: m.slug, name: m.name, maker: m.maker, free: m.free, context: m.context }));
  const initial = model ? models.find((m) => m.slug === model || m.id === model)?.id : undefined;
  const enabled = !!process.env.OPENROUTER_API_KEY;
  return (
    <div>
      <PageHead kicker={`${chat.filter((m) => m.free).length} free models · no sign-up`} title={<>AI <span className="grad-text">playground</span></>}>
        <p className="text-dim max-w-2xl">
          Chat with any model right here. Free models are open to everyone ({dailyLimit("free")} messages a day). Pro unlocks the paid models.
        </p>
      </PageHead>
      {!enabled && (
        <div className="mb-5 border border-amber/40 bg-amber/10 text-amber rounded-lg px-4 py-2.5 text-sm font-mono">
          ⚠ Chat is off until OPENROUTER_API_KEY is set on the server. Visitors can still chat if they add their own key.
        </div>
      )}
      <Playground models={chat} initial={initial} pro={pro} />
    </div>
  );
}

import type { Metadata } from "next";
import { METRICS } from "@/lib/collections";
import { PageHead } from "@/components/ui";

export const metadata: Metadata = { title: "Methodology" };

export default function Page() {
  const items: [string, string][] = [
    ["Model catalog", "The list of models, their pricing, context windows and supported features (tool calling, JSON output, reasoning, image input) comes from OpenRouter's public model catalog, refreshed hourly."],
    ["Benchmarks", "Intelligence, Coding and Math indices, GPQA Diamond scores, output speed and time to first token come from Artificial Analysis, an independent benchmarking organisation. They're shown when an API key is configured."],
    ["Matching", "Catalog entries are matched to benchmark entries by normalised model name and slug. If a model can't be matched, its benchmark fields show “—” and it's left out of benchmark-based rankings rather than guessed."],
    ["Heuristic fallback", "When a ranking's metric has no data at all, models are ordered by the Axiom Score: a transparent 0–100 heuristic weighting recency (30%), capability breadth (25%), price tier (30%) and context length (15%). It is labelled wherever it's used and is not a benchmark."],
    ["Blended price", "Blended price assumes 3 input tokens for every output token, which is the common industry convention for chat workloads."],
    ["Independence", "We don't run benchmarks ourselves and don't accept payment for placement."],
  ];
  return (
    <div className="max-w-3xl">
      <PageHead kicker="How the numbers work" title={<span className="grad-text">Methodology</span>} />
      <div className="space-y-4">
        {items.map(([h, t]) => (
          <section key={h} className="glass rounded-xl p-6">
            <h2 className="font-semibold text-lg">{h}</h2>
            <p className="text-dim mt-2 leading-relaxed">{t}</p>
          </section>
        ))}
        <section className="glass rounded-xl p-6">
          <h2 className="font-semibold text-lg">Metrics</h2>
          <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
            {Object.values(METRICS).map((m) => (
              <li key={m.key} className="flex gap-3"><span className="chip">{m.short}</span><span className="text-dim">{m.label} · {m.higherIsBetter ? "higher is better" : "lower is better"}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { COLLECTIONS } from "@/lib/collections";
import { PageHead } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Free JSON API" };

const ENDPOINTS: [string, string, string][] = [
  ["GET", "/api/v1/models", "List models. Query: q, maker, capabilities (tools,vision,json,reasoning,audio,imageOut), max_price (blended $/M), min_context, limit"],
  ["GET", "/api/v1/models/{slug}", "One model, full profile"],
  ["GET", "/api/v1/rankings/{collection}", "A ranking plus a one-sentence answer. Query: maker"],
];

export default function Page() {
  const base = site.url.replace(/\/$/, "");
  return (
    <div className="max-w-4xl">
      <PageHead kicker="Read-only · no key · CORS enabled" title={<>Free <span className="grad-text">JSON API</span></>} />
      <div className="space-y-4">
        {ENDPOINTS.map(([m, p, d]) => (
          <div key={p} className="glass rounded-xl p-5 flex flex-col md:flex-row gap-3 md:items-center">
            <span className="chip !text-lime !border-lime/40 w-fit">{m}</span>
            <code className="font-mono text-cyan">{p}</code>
            <span className="text-sm text-dim md:ml-auto md:max-w-md">{d}</span>
          </div>
        ))}
        <pre className="glass rounded-xl p-5 overflow-x-auto font-mono text-sm text-dim leading-relaxed">
{`# Cheapest vision models under $1 per million tokens
curl "${base}/api/v1/models?capabilities=vision&max_price=1&limit=5"

# Best Anthropic model for coding
curl "${base}/api/v1/rankings/coding?maker=anthropic"`}
        </pre>
        <div className="glass rounded-xl p-5">
          <div className="hud-label mb-3">Collections</div>
          <div className="flex flex-wrap gap-2">{COLLECTIONS.map((c) => <code key={c.slug} className="chip">{c.slug}</code>)}</div>
        </div>
      </div>
    </div>
  );
}

import type { Model } from "./types";
import { blended, fmtCtx, fmtNum, fmtPrice } from "./format";

export type MetricKey = "intelligence" | "coding" | "math" | "gpqa" | "speed" | "ttft" | "price" | "context" | "heuristic";

export type Metric = {
  key: MetricKey;
  label: string;
  short: string;
  higherIsBetter: boolean;
  value: (m: Model) => number | undefined;
  display: (v: number) => string;
};

export const METRICS: Record<MetricKey, Metric> = {
  intelligence: { key: "intelligence", label: "Intelligence Index", short: "INT", higherIsBetter: true, value: (m) => m.scores.intelligence, display: (v) => fmtNum(v) },
  coding: { key: "coding", label: "Coding Index", short: "CODE", higherIsBetter: true, value: (m) => m.scores.coding, display: (v) => fmtNum(v) },
  math: { key: "math", label: "Math Index", short: "MATH", higherIsBetter: true, value: (m) => m.scores.math, display: (v) => fmtNum(v) },
  gpqa: { key: "gpqa", label: "GPQA Diamond", short: "GPQA", higherIsBetter: true, value: (m) => m.scores.gpqa, display: (v) => `${fmtNum(v)}%` },
  speed: { key: "speed", label: "Output speed", short: "TOK/S", higherIsBetter: true, value: (m) => m.speed, display: (v) => `${Math.round(v)} t/s` },
  ttft: { key: "ttft", label: "Time to first token", short: "TTFT", higherIsBetter: false, value: (m) => m.ttft, display: (v) => `${v.toFixed(2)}s` },
  price: { key: "price", label: "Blended price / 1M tokens", short: "$/M", higherIsBetter: false, value: (m) => blended(m), display: (v) => fmtPrice(v) },
  context: { key: "context", label: "Context window", short: "CTX", higherIsBetter: true, value: (m) => m.context, display: (v) => fmtCtx(v) },
  heuristic: { key: "heuristic", label: "Axiom Score (heuristic)", short: "AXS", higherIsBetter: true, value: (m) => m.heuristic, display: (v) => fmtNum(v) },
};

export type Collection = {
  slug: string;
  title: string; // "Coding"
  group: "Use cases" | "Constraints" | "Frameworks & tools";
  icon: string; // short glyph
  blurb: string;
  intro: string;
  metric: MetricKey;
  filter?: (m: Model) => boolean;
  filterNote?: string;
};

const textModel = (m: Model) => m.outputMods.includes("text");

export const COLLECTIONS: Collection[] = [
  // ── Use cases ──
  { slug: "smartest", title: "Overall intelligence", group: "Use cases", icon: "◆", metric: "intelligence", blurb: "The most capable general-purpose models.", intro: "Ranked by a composite intelligence index covering reasoning, knowledge, maths and science.", filter: textModel },
  { slug: "coding", title: "Coding", group: "Use cases", icon: "</>", metric: "coding", blurb: "Writing, refactoring and debugging code.", intro: "Ranked by a coding index built from real-world programming benchmarks. Only models with tool calling are included, since modern coding assistants depend on it.", filter: (m) => textModel(m) && m.caps.tools, filterNote: "Requires tool calling" },
  { slug: "agents", title: "AI agents", group: "Use cases", icon: "⟳", metric: "intelligence", blurb: "Multi-step tool use and autonomous workflows.", intro: "Agents need to plan, call tools and recover from errors. These models support tool calling and are ranked by intelligence.", filter: (m) => m.caps.tools && textModel(m), filterNote: "Requires tool calling" },
  { slug: "reasoning", title: "Reasoning & maths", group: "Use cases", icon: "∑", metric: "math", blurb: "Hard problems that reward thinking time.", intro: "Models with a dedicated reasoning mode, ranked by maths benchmark performance.", filter: (m) => m.caps.reasoning, filterNote: "Reasoning mode" },
  { slug: "science", title: "Science", group: "Use cases", icon: "⚛", metric: "gpqa", blurb: "Graduate-level physics, chemistry and biology.", intro: "Ranked by GPQA Diamond, a set of expert-written science questions that are hard to look up.", filter: textModel },
  { slug: "vision", title: "Vision", group: "Use cases", icon: "◉", metric: "intelligence", blurb: "Understanding images, screenshots and documents.", intro: "Models that accept image input, ranked by intelligence.", filter: (m) => m.caps.vision, filterNote: "Image input" },
  { slug: "rag", title: "RAG & retrieval", group: "Use cases", icon: "⌕", metric: "intelligence", blurb: "Answering questions over your own documents.", intro: "Retrieval-augmented generation needs room for retrieved passages. These models have at least 128K tokens of context, ranked by intelligence.", filter: (m) => m.context >= 128_000 && textModel(m), filterNote: "≥128K context" },
  { slug: "structured-output", title: "Structured output / JSON", group: "Use cases", icon: "{}", metric: "intelligence", blurb: "Reliable JSON for pipelines and APIs.", intro: "Models that support JSON or schema-constrained output, ranked by intelligence.", filter: (m) => m.caps.json, filterNote: "JSON / schema output" },
  { slug: "image-generation", title: "Image generation", group: "Use cases", icon: "▣", metric: "heuristic", blurb: "Models that output images.", intro: "Models that can generate images, ranked by the Axiom heuristic score.", filter: (m) => m.caps.imageOut, filterNote: "Image output" },

  // ── Constraints ──
  { slug: "fastest", title: "Fastest", group: "Constraints", icon: "≫", metric: "speed", blurb: "Highest output tokens per second.", intro: "Ranked by measured median output speed across providers.", filter: textModel },
  { slug: "lowest-latency", title: "Lowest latency", group: "Constraints", icon: "⏱", metric: "ttft", blurb: "Quickest time to first token.", intro: "Ranked by measured time to first token, which matters most for chat and voice.", filter: textModel },
  { slug: "cheapest", title: "Cheapest", group: "Constraints", icon: "$", metric: "price", blurb: "Lowest blended price per million tokens.", intro: "Paid models ranked by blended price (3 parts input to 1 part output).", filter: (m) => !m.free && textModel(m), filterNote: "Paid models" },
  { slug: "free", title: "Free", group: "Constraints", icon: "∅", metric: "intelligence", blurb: "Zero-cost models to start with.", intro: "Free-tier models, ranked by intelligence. Free endpoints usually have rate limits.", filter: (m) => m.free && textModel(m), filterNote: "$0 input & output" },
  { slug: "open-source", title: "Open-weight", group: "Constraints", icon: "⌥", metric: "intelligence", blurb: "Downloadable and self-hostable.", intro: "Models with weights published on Hugging Face, ranked by intelligence.", filter: (m) => m.openWeights, filterNote: "Open weights" },
  { slug: "long-context", title: "Long context", group: "Constraints", icon: "↔", metric: "context", blurb: "The largest context windows.", intro: "Ranked by maximum context length, for whole codebases, books and long transcripts.", filter: (m) => m.context >= 200_000, filterNote: "≥200K context" },

  // ── Frameworks & tools ──
  { slug: "cursor", title: "Cursor", group: "Frameworks & tools", icon: "⌘", metric: "coding", blurb: "Best picks for the Cursor editor.", intro: "Cursor's agent mode depends on tool calling and strong coding ability. Ranked by coding index.", filter: (m) => m.caps.tools && textModel(m), filterNote: "Tool calling" },
  { slug: "cline", title: "Cline", group: "Frameworks & tools", icon: "⌘", metric: "coding", blurb: "Best picks for the Cline VS Code agent.", intro: "Cline runs long autonomous coding sessions, so tool calling and context length both matter. Ranked by coding index, 100K+ context.", filter: (m) => m.caps.tools && m.context >= 100_000, filterNote: "Tools · ≥100K ctx" },
  { slug: "langchain", title: "LangChain", group: "Frameworks & tools", icon: "⛓", metric: "intelligence", blurb: "Chains, tools and structured output.", intro: "LangChain apps lean on tool calling and structured output. Ranked by intelligence.", filter: (m) => m.caps.tools && m.caps.json, filterNote: "Tools + JSON" },
  { slug: "crewai", title: "CrewAI", group: "Frameworks & tools", icon: "⚑", metric: "intelligence", blurb: "Multi-agent crews.", intro: "Multi-agent crews multiply token usage, so these are tool-capable models ranked by intelligence. Check the price column.", filter: (m) => m.caps.tools && textModel(m), filterNote: "Tool calling" },
  { slug: "autogen", title: "AutoGen", group: "Frameworks & tools", icon: "⚙", metric: "intelligence", blurb: "Conversational multi-agent systems.", intro: "AutoGen agents exchange many messages and call functions. Ranked by intelligence among tool-capable models.", filter: (m) => m.caps.tools && textModel(m), filterNote: "Tool calling" },
  { slug: "n8n", title: "n8n", group: "Frameworks & tools", icon: "⇄", metric: "price", blurb: "Workflow automation at volume.", intro: "Automations run constantly, so cost dominates. Tool-capable paid models ranked by blended price.", filter: (m) => m.caps.tools && !m.free, filterNote: "Tools · paid" },
  { slug: "chatbots", title: "Customer chatbots", group: "Frameworks & tools", icon: "✉", metric: "ttft", blurb: "Fast, affordable conversational models.", intro: "Customer-facing chat needs a quick first token. Ranked by latency among models under $3 per million blended tokens.", filter: (m) => textModel(m) && blended(m) <= 3, filterNote: "≤$3/M blended" },
];

export function getCollection(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export type Ranked = { model: Model; value: number; rank: number };

/**
 * Rank models for a collection. If the collection's metric has no data
 * (e.g. no benchmark key configured), fall back to the heuristic score
 * so the page is still useful, and report which metric was really used.
 */
export function rank(models: Model[], c: Collection, maker?: string): { metric: Metric; rows: Ranked[]; fallback: boolean } {
  let pool = models.filter((m) => (c.filter ? c.filter(m) : true));
  if (maker) pool = pool.filter((m) => m.makerSlug === maker);

  let metric = METRICS[c.metric];
  let withValue = pool.filter((m) => metric.value(m) !== undefined);
  let fallback = false;
  if (withValue.length === 0 && pool.length > 0) {
    metric = METRICS.heuristic;
    withValue = pool;
    fallback = true;
  }
  const dir = metric.higherIsBetter ? -1 : 1;
  const rows = withValue
    .map((m) => ({ model: m, value: metric.value(m)! }))
    .sort((a, b) => dir * (a.value - b.value) || b.model.heuristic - a.model.heuristic)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return { metric, rows, fallback };
}

export function answerSentence(c: Collection, r: ReturnType<typeof rank>, makerName?: string): string {
  const [a, b, d] = r.rows;
  if (!a) return `No ${makerName ? makerName + " " : ""}models currently match this ranking.`;
  const scope = makerName ? `${makerName} model` : "model";
  const v = (x: Ranked) => r.metric.display(x.value);
  let s = `The best ${scope} for ${c.title.toLowerCase()} right now is ${a.model.name}, at ${v(a)} (${r.metric.label.toLowerCase()})`;
  if (b && d) s += `; ${b.model.name} (${v(b)}) and ${d.model.name} (${v(d)}) follow.`;
  else if (b) s += `; ${b.model.name} (${v(b)}) follows.`;
  else s += ".";
  return s;
}

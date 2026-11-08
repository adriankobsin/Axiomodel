import "server-only";
import { cache } from "react";
import type { Catalog, Model } from "./types";
import { norm, slugify } from "./format";
import { sampleRaw } from "./sample";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/models";
const AA_URL = "https://artificialanalysis.ai/api/v2/data/llms/models";
export const REVALIDATE_SECONDS = 3600;

const MAKER_NAMES: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  "meta-llama": "Meta",
  meta: "Meta",
  mistralai: "Mistral",
  deepseek: "DeepSeek",
  qwen: "Qwen",
  "x-ai": "xAI",
  "z-ai": "Z.ai",
  moonshotai: "MoonshotAI",
  minimax: "MiniMax",
  cohere: "Cohere",
  nvidia: "NVIDIA",
  microsoft: "Microsoft",
  amazon: "Amazon",
  perplexity: "Perplexity",
  "ibm-granite": "IBM",
  tencent: "Tencent",
  xiaomi: "Xiaomi",
  baidu: "Baidu",
  liquid: "LiquidAI",
  nousresearch: "Nous",
  inception: "Inception",
  stepfun: "StepFun",
  upstage: "Upstage",
  "ai21": "AI21",
  inclusionai: "inclusionAI",
  bytedance: "ByteDance",
};

/* ── Raw shapes (defensive: upstream APIs may add/remove fields) ── */
type ORModel = {
  id: string;
  name?: string;
  description?: string;
  created?: number;
  context_length?: number;
  hugging_face_id?: string | null;
  architecture?: { input_modalities?: string[]; output_modalities?: string[]; modality?: string };
  pricing?: { prompt?: string; completion?: string };
  top_provider?: { context_length?: number; max_completion_tokens?: number | null };
  supported_parameters?: string[];
};

type AAModel = {
  name?: string;
  slug?: string;
  model_creator?: { name?: string; slug?: string };
  evaluations?: Record<string, number | null | undefined>;
  median_output_tokens_per_second?: number | null;
  median_time_to_first_token_seconds?: number | null;
};

async function fetchOpenRouter(): Promise<ORModel[] | null> {
  if (process.env.USE_SAMPLE_DATA === "1") return null;
  try {
    const res = await fetch(OPENROUTER_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : null;
  } catch {
    return null;
  }
}

async function fetchArtificialAnalysis(): Promise<AAModel[] | null> {
  const key = process.env.ARTIFICIAL_ANALYSIS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(AA_URL, {
      headers: { "x-api-key": key, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS * 6 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : null;
  } catch {
    return null;
  }
}

const perMillion = (v?: string) => {
  const n = parseFloat(v ?? "");
  return isFinite(n) && n >= 0 ? n * 1_000_000 : NaN;
};

function cleanName(raw: string): string {
  // OpenRouter names look like "Anthropic: Claude Opus 4.5"
  const i = raw.indexOf(": ");
  return i > -1 ? raw.slice(i + 2) : raw;
}

function heuristicScore(m: Omit<Model, "heuristic">): number {
  // A transparent fallback when no benchmark key is configured.
  // Rewards recency, context, capability breadth and price tier (a rough proxy for model size).
  const ageDays = (Date.now() / 1000 - m.created) / 86400;
  const recency = Math.max(0, 1 - ageDays / 730); // newer = better, 2yr window
  const ctx = Math.min(1, Math.log10(Math.max(m.context, 4096) / 4096) / Math.log10(256));
  const caps = [m.caps.tools, m.caps.reasoning, m.caps.vision, m.caps.json].filter(Boolean).length / 4;
  const tier = m.free ? 0.2 : Math.min(1, Math.log10(1 + m.priceOut) / Math.log10(76));
  return Math.round((recency * 0.3 + ctx * 0.15 + caps * 0.25 + tier * 0.3) * 1000) / 10;
}

function toModel(r: ORModel): Model | null {
  if (!r?.id || !r.id.includes("/")) return null;
  const [makerSlug] = r.id.split("/");
  const priceIn = perMillion(r.pricing?.prompt);
  const priceOut = perMillion(r.pricing?.completion);
  if (!isFinite(priceIn) || !isFinite(priceOut)) return null; // router/variable-priced entries
  const inputMods = r.architecture?.input_modalities ?? [];
  const outputMods = r.architecture?.output_modalities ?? ["text"];
  const params = r.supported_parameters ?? [];
  const base: Omit<Model, "heuristic"> = {
    id: r.id,
    slug: slugify(r.id.replace("/", "--")),
    name: cleanName(r.name || r.id),
    maker: MAKER_NAMES[makerSlug] ?? makerSlug.replace(/(^|-)(\w)/g, (_, a, b) => (a ? " " : "") + b.toUpperCase()),
    makerSlug,
    description: r.description ?? "",
    created: r.created ?? 0,
    context: r.top_provider?.context_length || r.context_length || 0,
    maxOutput: r.top_provider?.max_completion_tokens ?? undefined,
    priceIn,
    priceOut,
    free: priceIn === 0 && priceOut === 0,
    inputMods,
    outputMods,
    params,
    caps: {
      vision: inputMods.includes("image"),
      tools: params.includes("tools"),
      json: params.includes("structured_outputs") || params.includes("response_format"),
      reasoning: params.includes("reasoning") || params.includes("include_reasoning"),
      audio: inputMods.includes("audio"),
      imageOut: outputMods.includes("image"),
    },
    openWeights: !!r.hugging_face_id,
    hfId: r.hugging_face_id || undefined,
    scores: {},
  };
  return { ...base, heuristic: heuristicScore(base) };
}

function mergeBenchmarks(models: Model[], aa: AAModel[]): number {
  const byKey = new Map<string, AAModel>();
  for (const a of aa) {
    if (a.slug) byKey.set(norm(a.slug), a);
    if (a.name) byKey.set(norm(a.name), a);
  }
  let matched = 0;
  for (const m of models) {
    const tail = m.id.split("/")[1]?.replace(/:.*$/, "") ?? "";
    const a = byKey.get(norm(tail)) ?? byKey.get(norm(m.name.replace(/\(.*?\)/g, "")));
    if (!a) continue;
    const e = a.evaluations ?? {};
    const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : undefined);
    m.scores = {
      intelligence: num(e.artificial_analysis_intelligence_index),
      coding: num(e.artificial_analysis_coding_index),
      math: num(e.artificial_analysis_math_index),
      gpqa: num(e.gpqa) !== undefined ? (e.gpqa as number) * 100 : undefined,
    };
    m.speed = num(a.median_output_tokens_per_second) || undefined;
    m.ttft = num(a.median_time_to_first_token_seconds) || undefined;
    matched++;
  }
  return matched;
}

// Module-level memo: the OpenRouter payload can exceed Next's 2MB fetch-cache
// limit, so keep the processed catalog in memory per server instance too.
let memo: { at: number; p: Promise<Catalog> } | null = null;

export const getCatalog = cache(async (): Promise<Catalog> => {
  if (memo && Date.now() - memo.at < REVALIDATE_SECONDS * 1000) return memo.p;
  const p = buildCatalog();
  memo = { at: Date.now(), p };
  const c = await p;
  if (c.source === "sample") memo = { at: Date.now() - REVALIDATE_SECONDS * 1000 + 60_000, p }; // retry live after 1 min
  return c;
});

async function buildCatalog(): Promise<Catalog> {
  const [or, aa] = await Promise.all([fetchOpenRouter(), fetchArtificialAnalysis()]);
  const live = !!or && or.length > 0;
  const raw = live ? or! : (sampleRaw as ORModel[]);
  const models = raw.map(toModel).filter((m): m is Model => !!m);

  // De-duplicate by id (keep first)
  const seen = new Set<string>();
  const unique = models.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));

  let benchmarks = false;
  if (aa && aa.length) benchmarks = mergeBenchmarks(unique, aa) > 0;
  if (!live) {
    // sample data ships with illustrative scores so the UI can be previewed offline
    const { sampleScores } = await import("./sample");
    for (const m of unique) {
      const s = sampleScores[m.id];
      if (s) {
        m.scores = s.scores;
        m.speed = s.speed;
        m.ttft = s.ttft;
      }
    }
    benchmarks = true;
  }

  return {
    models: unique,
    source: live ? "live" : "sample",
    benchmarks,
    updatedAt: new Date().toISOString(),
  };
}

export async function getModel(slug: string): Promise<Model | undefined> {
  const { models } = await getCatalog();
  return models.find((m) => m.slug === slug);
}

export type Maker = {
  slug: string;
  name: string;
  count: number;
  best?: Model;
  cheapest?: Model;
};

export async function getMakers(): Promise<Maker[]> {
  const { models } = await getCatalog();
  const groups = new Map<string, Model[]>();
  for (const m of models) {
    const g = groups.get(m.makerSlug) ?? [];
    g.push(m);
    groups.set(m.makerSlug, g);
  }
  const score = (m: Model) => m.scores.intelligence ?? -1;
  return [...groups.entries()]
    .map(([slug, ms]) => {
      const best = [...ms].sort((a, b) => score(b) - score(a) || b.heuristic - a.heuristic)[0];
      const paid = ms.filter((m) => !m.free);
      const cheapest = [...(paid.length ? paid : ms)].sort((a, b) => a.priceIn - b.priceIn)[0];
      return { slug, name: ms[0].maker, count: ms.length, best, cheapest };
    })
    .sort((a, b) => score(b.best!) - score(a.best!) || b.count - a.count);
}

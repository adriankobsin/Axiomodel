// ─────────────────────────────────────────────────────────────────
// OFFLINE SAMPLE DATA — used only when the live OpenRouter catalog
// can't be reached (or USE_SAMPLE_DATA=1). All numbers here are
// ILLUSTRATIVE placeholders for previewing the design, not real
// benchmarks or prices. The site shows a banner whenever this is in use.
// ─────────────────────────────────────────────────────────────────
import type { Scores } from "./types";

const day = 86400;
const now = Math.floor(Date.now() / 1000);

type Seed = {
  id: string;
  name: string;
  ctx: number;
  in: number; // $/M
  out: number; // $/M
  age: number; // days
  mods?: string[];
  outMods?: string[];
  params?: string[];
  hf?: string;
  desc: string;
};

const FULL = ["tools", "tool_choice", "structured_outputs", "response_format", "reasoning", "temperature", "max_tokens"];
const BASIC = ["tools", "response_format", "temperature", "max_tokens"];

const seeds: Seed[] = [
  { id: "anthropic/claude-opus-5.5", name: "Anthropic: Claude Opus 5.5", ctx: 1_000_000, in: 5, out: 25, age: 40, mods: ["text", "image", "file"], params: FULL, desc: "Frontier flagship model for complex reasoning, long-horizon agents and coding." },
  { id: "anthropic/claude-sonnet-5.5", name: "Anthropic: Claude Sonnet 5.5", ctx: 1_000_000, in: 3, out: 15, age: 40, mods: ["text", "image", "file"], params: FULL, desc: "Balanced model for production coding and agent workloads." },
  { id: "anthropic/claude-haiku-5.5", name: "Anthropic: Claude Haiku 5.5", ctx: 200_000, in: 1, out: 5, age: 40, mods: ["text", "image"], params: FULL, desc: "Fast, low-cost model for high-volume tasks." },
  { id: "openai/gpt-6-astra", name: "OpenAI: GPT-6 Astra", ctx: 400_000, in: 2.5, out: 15, age: 30, mods: ["text", "image", "file"], params: FULL, desc: "General-purpose frontier model with adaptive reasoning." },
  { id: "openai/gpt-6-mini", name: "OpenAI: GPT-6 Mini", ctx: 400_000, in: 0.25, out: 2, age: 30, mods: ["text", "image"], params: FULL, desc: "Smaller, cheaper GPT-6 variant." },
  { id: "openai/gpt-image-2", name: "OpenAI: GPT Image 2", ctx: 32_000, in: 5, out: 40, age: 120, mods: ["text", "image"], outMods: ["image", "text"], params: ["temperature"], desc: "Image generation and editing model." },
  { id: "google/gemini-4-argon", name: "Google: Gemini 4 Argon", ctx: 2_000_000, in: 2, out: 12, age: 25, mods: ["text", "image", "audio", "video", "file"], params: FULL, desc: "Multimodal flagship with a very long context window." },
  { id: "google/gemini-4-flash", name: "Google: Gemini 4 Flash", ctx: 1_000_000, in: 0.3, out: 2.5, age: 25, mods: ["text", "image", "audio", "video"], params: FULL, desc: "High-throughput multimodal model." },
  { id: "google/gemma-4-26b-a4b-it", name: "Google: Gemma 4 26B A4B", ctx: 128_000, in: 0.08, out: 0.35, age: 150, mods: ["text", "image"], params: BASIC, hf: "google/gemma-4-26b-a4b-it", desc: "Open-weight mixture-of-experts model." },
  { id: "moonshotai/kimi-k3.1-pro", name: "MoonshotAI: Kimi K3.1 Pro", ctx: 256_000, in: 0.6, out: 2.5, age: 20, mods: ["text", "image"], params: FULL, hf: "moonshotai/Kimi-K3.1", desc: "Open-weight agentic model with strong tool use." },
  { id: "deepseek/deepseek-v4.1-flash", name: "DeepSeek: DeepSeek V4.1 Flash", ctx: 164_000, in: 0.1, out: 0.4, age: 35, params: FULL, hf: "deepseek-ai/DeepSeek-V4.1", desc: "Efficient open-weight reasoning model." },
  { id: "z-ai/glm-5.3", name: "Z.ai: GLM 5.3", ctx: 200_000, in: 0.45, out: 1.9, age: 28, params: FULL, hf: "zai-org/GLM-5.3", desc: "Open-weight model tuned for agents and coding." },
  { id: "qwen/qwen3.8-max", name: "Qwen: Qwen3.8 Max", ctx: 262_000, in: 1.2, out: 6, age: 45, mods: ["text", "image"], params: FULL, desc: "Alibaba's flagship Qwen model." },
  { id: "qwen/qwen3.8-30b-a3b:free", name: "Qwen: Qwen3.8 30B A3B (free)", ctx: 131_000, in: 0, out: 0, age: 60, params: BASIC, hf: "Qwen/Qwen3.8-30B-A3B", desc: "Free tier of a compact open-weight Qwen model." },
  { id: "x-ai/grok-4.7", name: "xAI: Grok 4.7", ctx: 256_000, in: 3, out: 15, age: 50, mods: ["text", "image"], params: FULL, desc: "xAI's flagship reasoning model." },
  { id: "mistralai/mistral-medium-3.5", name: "Mistral: Mistral Medium 3.5", ctx: 131_000, in: 0.4, out: 2, age: 90, mods: ["text", "image"], params: BASIC, desc: "European mid-size model with strong price-performance." },
  { id: "meta-llama/llama-4-maverick", name: "Meta: Llama 4 Maverick", ctx: 1_000_000, in: 0.15, out: 0.6, age: 400, mods: ["text", "image"], params: BASIC, hf: "meta-llama/Llama-4-Maverick-17B-128E-Instruct", desc: "Open-weight multimodal MoE model." },
  { id: "minimax/minimax-m3.1-flash", name: "MiniMax: MiniMax M3.1 Flash", ctx: 1_000_000, in: 0.15, out: 1.2, age: 22, params: FULL, hf: "MiniMaxAI/MiniMax-M3.1", desc: "Long-context open-weight agent model." },
  { id: "meta-llama/llama-3.3-8b-instruct:free", name: "Meta: Llama 3.3 8B Instruct (free)", ctx: 128_000, in: 0, out: 0, age: 500, params: ["temperature", "max_tokens"], hf: "meta-llama/Llama-3.3-8B-Instruct", desc: "Small free open-weight model." },
  { id: "ibm-granite/granite-4.2-8b", name: "IBM: Granite 4.2 8B", ctx: 128_000, in: 0.017, out: 0.11, age: 70, params: BASIC, hf: "ibm-granite/granite-4.2-8b-instruct", desc: "Small enterprise open-weight model." },
];

export const sampleRaw = seeds.map((s) => ({
  id: s.id,
  name: s.name,
  description: s.desc,
  created: now - s.age * day,
  context_length: s.ctx,
  hugging_face_id: s.hf ?? null,
  architecture: { input_modalities: s.mods ?? ["text"], output_modalities: s.outMods ?? ["text"] },
  pricing: { prompt: String(s.in / 1_000_000), completion: String(s.out / 1_000_000) },
  top_provider: { context_length: s.ctx, max_completion_tokens: Math.min(s.ctx / 4, 128_000) },
  supported_parameters: s.params ?? ["temperature", "max_tokens"],
}));

// Illustrative scores for the offline preview only.
export const sampleScores: Record<string, { scores: Scores; speed?: number; ttft?: number }> = {
  "anthropic/claude-opus-5.5": { scores: { intelligence: 62, coding: 78, math: 88, gpqa: 86 }, speed: 70, ttft: 1.6 },
  "anthropic/claude-sonnet-5.5": { scores: { intelligence: 58, coding: 74, math: 84, gpqa: 82 }, speed: 95, ttft: 1.1 },
  "anthropic/claude-haiku-5.5": { scores: { intelligence: 47, coding: 60, math: 72, gpqa: 70 }, speed: 180, ttft: 0.5 },
  "openai/gpt-6-astra": { scores: { intelligence: 60, coding: 76, math: 91, gpqa: 85 }, speed: 110, ttft: 2.2 },
  "openai/gpt-6-mini": { scores: { intelligence: 49, coding: 61, math: 82, gpqa: 72 }, speed: 160, ttft: 1.4 },
  "google/gemini-4-argon": { scores: { intelligence: 59, coding: 73, math: 90, gpqa: 86 }, speed: 140, ttft: 2.5 },
  "google/gemini-4-flash": { scores: { intelligence: 50, coding: 62, math: 83, gpqa: 76 }, speed: 260, ttft: 0.6 },
  "google/gemma-4-26b-a4b-it": { scores: { intelligence: 33, coding: 38, math: 58, gpqa: 55 }, speed: 120, ttft: 0.4 },
  "moonshotai/kimi-k3.1-pro": { scores: { intelligence: 55, coding: 70, math: 85, gpqa: 79 }, speed: 60, ttft: 1.2 },
  "deepseek/deepseek-v4.1-flash": { scores: { intelligence: 45, coding: 57, math: 80, gpqa: 71 }, speed: 90, ttft: 1.0 },
  "z-ai/glm-5.3": { scores: { intelligence: 45, coding: 59, math: 78, gpqa: 72 }, speed: 75, ttft: 0.9 },
  "qwen/qwen3.8-max": { scores: { intelligence: 45, coding: 58, math: 81, gpqa: 73 }, speed: 55, ttft: 1.5 },
  "qwen/qwen3.8-30b-a3b:free": { scores: { intelligence: 30, coding: 34, math: 55, gpqa: 50 }, speed: 140, ttft: 0.6 },
  "x-ai/grok-4.7": { scores: { intelligence: 46, coding: 57, math: 84, gpqa: 80 }, speed: 65, ttft: 3.1 },
  "mistralai/mistral-medium-3.5": { scores: { intelligence: 34, coding: 41, math: 60, gpqa: 58 }, speed: 105, ttft: 0.5 },
  "meta-llama/llama-4-maverick": { scores: { intelligence: 28, coding: 32, math: 45, gpqa: 54 }, speed: 150, ttft: 0.5 },
  "minimax/minimax-m3.1-flash": { scores: { intelligence: 43, coding: 55, math: 76, gpqa: 70 }, speed: 120, ttft: 0.9 },
  "meta-llama/llama-3.3-8b-instruct:free": { scores: { intelligence: 12, coding: 10, math: 18, gpqa: 30 }, speed: 220, ttft: 0.3 },
  "ibm-granite/granite-4.2-8b": { scores: { intelligence: 11, coding: 9, math: 20, gpqa: 63 }, speed: 200, ttft: 0.3 },
};

import "server-only";
import { getStripe, isTestMode, stripeEnabled } from "./stripe";

export type Check = { name: string; configured: boolean; ok: boolean; message: string; details?: Record<string, unknown> };

async function timed<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);
}

async function checkOpenRouter(detailed: boolean): Promise<Check> {
  const key = process.env.OPENROUTER_API_KEY;
  const name = "OpenRouter (chat for all models)";
  if (!key) return { name, configured: false, ok: false, message: "OPENROUTER_API_KEY is not set, so chat is switched off." };
  try {
    // 1) Is the key valid?
    const r = await timed(fetch(`${process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"}/key`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" }));
    if (r.status === 401) return { name, configured: true, ok: false, message: "Key rejected (401). Create a new key at openrouter.ai/keys." };
    if (!r.ok) return { name, configured: true, ok: false, message: `Key check failed (HTTP ${r.status}).` };
    const info = (await r.json())?.data ?? {};
    // 2) Can it actually generate? One tiny request to a free model.
    const g = await timed(
      fetch(`${process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openrouter/free", messages: [{ role: "user", content: "Reply with: ok" }], max_tokens: 5 }),
        cache: "no-store",
      }),
      20000
    );
    const gen = g.ok ? "test reply received" : `test reply failed (HTTP ${g.status})`;
    return {
      name,
      configured: true,
      ok: g.ok,
      message: `Key valid · ${gen}${info.is_free_tier ? " · free tier (50 free-model requests/day; buy $10 credit once for 1,000/day)" : ""}`,
      details: detailed ? { label: info.label, usage: info.usage, limit: info.limit, limit_remaining: info.limit_remaining, is_free_tier: info.is_free_tier } : undefined,
    };
  } catch (e) {
    return { name, configured: true, ok: false, message: `Couldn't reach OpenRouter (${(e as Error).message}).` };
  }
}

async function checkStripe(): Promise<Check> {
  const name = "Stripe (payments)";
  if (!stripeEnabled()) return { name, configured: false, ok: false, message: "STRIPE_SECRET_KEY is not set, so payments are switched off." };
  try {
    await timed(getStripe().balance.retrieve());
    const hook = !!process.env.STRIPE_WEBHOOK_SECRET;
    return { name, configured: true, ok: true, message: `Key valid · ${isTestMode() ? "TEST mode" : "LIVE mode"} · webhook secret ${hook ? "set" : "NOT set"}` };
  } catch (e) {
    return { name, configured: true, ok: false, message: `Key rejected or unreachable (${(e as Error).message.slice(0, 80)}).` };
  }
}

async function checkAA(): Promise<Check> {
  const key = process.env.ARTIFICIAL_ANALYSIS_API_KEY;
  const name = "Artificial Analysis (benchmarks)";
  if (!key) return { name, configured: false, ok: false, message: "Not set. Rankings use the heuristic score (optional)." };
  try {
    const r = await timed(fetch("https://artificialanalysis.ai/api/v2/data/llms/models", { headers: { "x-api-key": key }, cache: "no-store" }));
    return { name, configured: true, ok: r.ok, message: r.ok ? "Key valid · benchmarks on" : `Key check failed (HTTP ${r.status}).` };
  } catch (e) {
    return { name, configured: true, ok: false, message: `Unreachable (${(e as Error).message}).` };
  }
}

async function checkCatalog(): Promise<Check> {
  const name = "Model catalog (OpenRouter, public)";
  try {
    const r = await timed(fetch("https://openrouter.ai/api/v1/models", { cache: "no-store" }));
    const n = r.ok ? ((await r.json())?.data?.length ?? 0) : 0;
    return { name, configured: true, ok: r.ok && n > 0, message: r.ok ? `${n} models available` : `HTTP ${r.status}` };
  } catch (e) {
    return { name, configured: true, ok: false, message: `Unreachable (${(e as Error).message}).` };
  }
}

export async function checkAll(detailed = false) {
  const checks = await Promise.all([checkCatalog(), checkOpenRouter(detailed), checkStripe(), checkAA()]);
  return { checkedAt: new Date().toISOString(), checks };
}

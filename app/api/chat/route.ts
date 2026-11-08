import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/data";
import { isPro } from "@/lib/entitlement";
import { clientId, dailyLimit, take } from "@/lib/limits";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant" | "system"; content: string };

const OR_CHAT = `${process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"}/chat/completions`;
const MAX_MESSAGES = 40;
const MAX_CHARS = 32_000;

function err(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: code, message, ...extra }, { status });
}

export async function POST(req: Request) {
  let body: { model?: string; messages?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return err(400, "bad_json", "Invalid request.");
  }

  // Visitor's own OpenRouter key (optional). Used for this request only, never stored.
  const userKey = req.headers.get("x-user-openrouter-key")?.trim() || "";
  const siteKey = process.env.OPENROUTER_API_KEY || "";
  const key = userKey || siteKey;
  if (!key) return err(503, "not_configured", "Chat isn't switched on yet: the site owner needs to add OPENROUTER_API_KEY.");

  const { models } = await getCatalog();
  const model = models.find((m) => m.id === body.model);
  if (!model) return err(400, "unknown_model", "That model isn't available.");
  if (!model.outputMods.includes("text")) return err(400, "not_chat", "This model doesn't produce text, so it can't be used in chat.");

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && typeof m.content === "string" && ["user", "assistant", "system"].includes(m.role))
    .slice(-MAX_MESSAGES);
  if (!messages.length) return err(400, "no_messages", "Type a message first.");
  if (messages.reduce((n, m) => n + m.content.length, 0) > MAX_CHARS) return err(413, "too_long", "This conversation is too long. Start a new chat.");

  let remaining: number | null = null;
  if (!userKey) {
    const pro = await isPro();
    if (!model.free && !pro)
      return err(402, "upgrade_required", `${model.name} is a paid model. Upgrade to Pro, or add your own OpenRouter key, to use it. Free models are open to everyone.`);
    const limit = dailyLimit(pro ? "pro" : "free");
    const t = take(`${pro ? "pro" : "free"}:${clientId(req)}`, limit);
    if (!t.ok) return err(429, "daily_limit", `You've used today's ${limit} messages. Come back tomorrow, upgrade, or add your own OpenRouter key.`);
    remaining = t.remaining;
  }

  const upstream = await fetch(OR_CHAT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": site.url,
      "X-Title": site.name,
    },
    body: JSON.stringify({
      model: model.id,
      // If a free model is busy or rate-limited, fall back to OpenRouter's free router
      ...(model.free ? { models: [model.id, "openrouter/free"] } : {}),
      messages,
      stream: true,
      max_tokens: userKey ? undefined : 2048,
    }),
  }).catch((e) => {
    console.error("[chat] upstream fetch failed", e?.cause?.code ?? e?.message);
    return null;
  });

  if (!upstream) return err(502, "upstream_unreachable", "Couldn't reach the model provider. Try again.");
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    let detail = "";
    try {
      detail = JSON.parse(text)?.error?.message ?? "";
    } catch {}
    const msg =
      upstream.status === 401 ? (userKey ? "Your OpenRouter key was rejected. Check it and try again." : "The site's model key isn't valid. The owner needs to check OPENROUTER_API_KEY.")
      : upstream.status === 402 ? "The account behind this key is out of credit."
      : upstream.status === 429 ? "This model is busy or rate-limited right now. Try another free model or wait a minute."
      : detail || "The model returned an error.";
    return err(upstream.status === 401 || upstream.status === 402 || upstream.status === 429 ? upstream.status : 502, "upstream_error", msg);
  }

  // Stream OpenRouter's SSE straight through to the browser
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      ...(remaining !== null ? { "X-Messages-Remaining": String(remaining) } : {}),
    },
  });
}

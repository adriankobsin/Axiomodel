import "server-only";

// Simple per-visitor daily counter (UTC day).
// NOTE: kept in memory per server instance, so it resets on redeploy and isn't
// shared between Vercel instances. Good enough for testing; for production
// move this to a shared store (Upstash Redis or a Supabase table).
const buckets = new Map<string, { day: string; n: number }>();

export function dailyLimit(kind: "free" | "pro") {
  const env = kind === "pro" ? process.env.PRO_DAILY_MESSAGES : process.env.FREE_DAILY_MESSAGES;
  const n = parseInt(env ?? "", 10);
  return isFinite(n) && n > 0 ? n : kind === "pro" ? 300 : 20;
}

export function clientId(req: Request) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "local";
}

export function take(id: string, limit: number): { ok: boolean; remaining: number } {
  const day = new Date().toISOString().slice(0, 10);
  const b = buckets.get(id);
  const cur = b && b.day === day ? b : { day, n: 0 };
  if (cur.n >= limit) return { ok: false, remaining: 0 };
  cur.n++;
  buckets.set(id, cur);
  if (buckets.size > 50_000) buckets.clear(); // crude memory guard
  return { ok: true, remaining: limit - cur.n };
}

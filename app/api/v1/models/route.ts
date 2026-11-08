import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/data";
import { blended } from "@/lib/format";

export const revalidate = 3600;

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET(req: Request) {
  const { searchParams: q } = new URL(req.url);
  const { models, source, benchmarks, updatedAt } = await getCatalog();
  let rows = models;
  const maker = q.get("maker");
  const cap = q.get("capabilities")?.split(",").filter(Boolean) ?? [];
  const maxPrice = q.get("max_price");
  const minCtx = q.get("min_context");
  const search = q.get("q")?.toLowerCase();
  if (maker) rows = rows.filter((m) => m.makerSlug === maker);
  for (const c of cap) rows = rows.filter((m) => (m.caps as Record<string, boolean>)[c]);
  if (maxPrice) rows = rows.filter((m) => blended(m) <= +maxPrice);
  if (minCtx) rows = rows.filter((m) => m.context >= +minCtx);
  if (search) rows = rows.filter((m) => (m.name + m.id).toLowerCase().includes(search));
  const limit = Math.min(+(q.get("limit") ?? 500) || 500, 500);
  return NextResponse.json({ source, benchmarks, updatedAt, count: rows.length, data: rows.slice(0, limit) }, { headers: CORS });
}

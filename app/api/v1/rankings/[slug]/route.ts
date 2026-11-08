import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/data";
import { answerSentence, getCollection, rank } from "@/lib/collections";

export const revalidate = 3600;

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) return NextResponse.json({ error: "unknown_collection" }, { status: 404 });
  const maker = new URL(req.url).searchParams.get("maker") ?? undefined;
  const { models } = await getCatalog();
  const r = rank(models, c, maker);
  return NextResponse.json(
    {
      collection: c.slug,
      title: c.title,
      metric: r.metric.label,
      fallback: r.fallback,
      answer: answerSentence(c, r),
      data: r.rows.slice(0, 50).map((x) => ({ rank: x.rank, id: x.model.id, name: x.model.name, value: x.value })),
    },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}

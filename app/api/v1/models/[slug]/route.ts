import { NextResponse } from "next/server";
import { getModel } from "@/lib/data";

export const revalidate = 3600;

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = await getModel(slug);
  if (!m) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ data: m }, { headers: { "Access-Control-Allow-Origin": "*" } });
}

import { NextResponse } from "next/server";
import { checkAll } from "@/lib/status";

export const dynamic = "force-dynamic";

// GET /api/status            -> pass/fail for each key (safe to share)
// GET /api/status?token=XYZ  -> also usage/limits (token = STATUS_TOKEN env var)
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const detailed = !!process.env.STATUS_TOKEN && token === process.env.STATUS_TOKEN;
  return NextResponse.json(await checkAll(detailed));
}

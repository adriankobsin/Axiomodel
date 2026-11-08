import Link from "next/link";
import { getPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ plan?: string; email?: string }> }) {
  const { plan, email } = await searchParams;
  const p = plan ? getPlan(plan) : undefined;
  return (
    <div className="py-24 max-w-xl mx-auto text-center space-y-6">
      <div className="mx-auto w-16 h-16 rounded-full border border-lime/50 bg-lime/10 flex items-center justify-center font-mono text-2xl text-lime">✓</div>
      <h1 className="text-4xl font-semibold tracking-tight">Payment confirmed</h1>
      <p className="text-dim">
        You&apos;re now on <span className="text-cyan">{p?.name ?? "your new plan"}</span>.{email ? <> A receipt is on its way to <span className="text-ink">{email}</span>.</> : null}
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/" className="rounded-lg bg-gradient-to-r from-cyan to-violet text-void px-5 py-2.5 font-medium">Back to the index</Link>
        <Link href="/account" className="rounded-lg border border-line-2 px-5 py-2.5 text-dim hover:text-ink">Manage billing</Link>
      </div>
    </div>
  );
}

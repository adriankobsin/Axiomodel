import type { Metadata } from "next";
import { checkAll } from "@/lib/status";
import { PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "System status", robots: { index: false } };

export default async function Page() {
  const { checks, checkedAt } = await checkAll(false);
  return (
    <div className="max-w-3xl">
      <PageHead kicker={`Checked ${new Date(checkedAt).toUTCString().slice(5, 25)} UTC`} title={<>System <span className="grad-text">status</span></>}>
        <p className="text-dim">Live check of every key the site uses. Reload the page to check again.</p>
      </PageHead>
      <div className="space-y-3">
        {checks.map((c) => {
          const tone = c.ok ? "text-lime border-lime/40 bg-lime/10" : c.configured ? "text-magenta border-magenta/40 bg-magenta/10" : "text-amber border-amber/40 bg-amber/10";
          return (
            <div key={c.name} className="glass rounded-xl p-5 flex items-start gap-4">
              <span className={`mt-0.5 font-mono text-sm px-2 py-0.5 rounded border ${tone}`}>{c.ok ? "OK" : c.configured ? "FAIL" : "OFF"}</span>
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-dim mt-0.5">{c.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

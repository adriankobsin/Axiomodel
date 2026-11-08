"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Model } from "@/lib/types";
import { blended, fmtCtx, fmtDate, fmtNum, fmtPrice, makerHue } from "@/lib/format";

type Row = { label: string; get: (m: Model) => number | undefined; fmt: (v: number) => string; hib: boolean };
const ROWS: Row[] = [
  { label: "Intelligence", get: (m) => m.scores.intelligence, fmt: (v) => fmtNum(v), hib: true },
  { label: "Coding", get: (m) => m.scores.coding, fmt: (v) => fmtNum(v), hib: true },
  { label: "Math", get: (m) => m.scores.math, fmt: (v) => fmtNum(v), hib: true },
  { label: "GPQA %", get: (m) => m.scores.gpqa, fmt: (v) => fmtNum(v), hib: true },
  { label: "Speed (t/s)", get: (m) => m.speed, fmt: (v) => String(Math.round(v)), hib: true },
  { label: "Latency", get: (m) => m.ttft, fmt: (v) => `${v.toFixed(2)}s`, hib: false },
  { label: "Input $/M", get: (m) => m.priceIn, fmt: fmtPrice, hib: false },
  { label: "Output $/M", get: (m) => m.priceOut, fmt: fmtPrice, hib: false },
  { label: "Blended $/M", get: (m) => blended(m), fmt: fmtPrice, hib: false },
  { label: "Context", get: (m) => m.context, fmt: fmtCtx, hib: true },
  { label: "Axiom score", get: (m) => m.heuristic, fmt: (v) => fmtNum(v), hib: true },
];
const BOOL: [string, (m: Model) => boolean][] = [
  ["Tool calling", (m) => m.caps.tools],
  ["Reasoning mode", (m) => m.caps.reasoning],
  ["Vision input", (m) => m.caps.vision],
  ["JSON output", (m) => m.caps.json],
  ["Open weights", (m) => m.openWeights],
];

export function Compare({ models, initial }: { models: Model[]; initial: string[] }) {
  const [sel, setSel] = useState<string[]>(initial.filter((s) => models.some((m) => m.slug === s)).slice(0, 4));
  const [q, setQ] = useState("");
  const chosen = sel.map((s) => models.find((m) => m.slug === s)!).filter(Boolean);
  const matches = useMemo(
    () => (q ? models.filter((m) => (m.name + m.maker).toLowerCase().includes(q.toLowerCase()) && !sel.includes(m.slug)).slice(0, 8) : []),
    [q, models, sel]
  );
  const add = (s: string) => {
    const next = [...sel, s].slice(0, 4);
    setSel(next);
    setQ("");
    window.history.replaceState(null, "", `?m=${next.join(",")}`);
  };
  const remove = (s: string) => {
    const next = sel.filter((x) => x !== s);
    setSel(next);
    window.history.replaceState(null, "", next.length ? `?m=${next.join(",")}` : "/compare");
  };

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <div className="glass glow-border rounded-xl flex items-center gap-3 px-4 h-12">
          <span className="font-mono text-cyan text-sm">+</span>
          <input disabled={sel.length >= 4} value={q} onChange={(e) => setQ(e.target.value)} placeholder={sel.length >= 4 ? "Maximum 4 models" : "Add a model to compare…"} className="flex-1 bg-transparent outline-none text-sm" />
          <span className="font-mono text-xs text-mute">{sel.length}/4</span>
        </div>
        {matches.length > 0 && (
          <ul className="absolute z-20 mt-2 w-full glass rounded-xl overflow-hidden">
            {matches.map((m) => (
              <li key={m.slug}>
                <button onClick={() => add(m.slug)} className="w-full text-left px-4 py-2.5 hover:bg-cyan/[0.07] flex justify-between">
                  <span>{m.name}</span>
                  <span className="hud-label">{m.maker}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {chosen.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-dim">Add up to four models to see them side by side.</div>
      ) : (
        <div className="glass rounded-xl overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 200 + chosen.length * 180 }}>
            <thead>
              <tr className="border-b border-line">
                <th className="w-44" />
                {chosen.map((m) => (
                  <th key={m.slug} className="p-4 text-left align-top">
                    <div className="h-1 rounded-full mb-3" style={{ background: `hsl(${makerHue(m.makerSlug)} 90% 65%)` }} />
                    <Link href={`/models/${m.slug}`} className="font-semibold hover:text-cyan block">{m.name}</Link>
                    <div className="hud-label mt-1 flex justify-between">
                      {m.maker}
                      <button onClick={() => remove(m.slug)} className="hover:text-magenta" aria-label={`Remove ${m.name}`}>✕</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => {
                const vals = chosen.map(r.get);
                const defined = vals.filter((v): v is number => v !== undefined);
                const best = defined.length > 1 ? (r.hib ? Math.max(...defined) : Math.min(...defined)) : undefined;
                return (
                  <tr key={r.label} className="border-b border-line/50">
                    <td className="hud-label px-4 py-3">{r.label}</td>
                    {vals.map((v, i) => (
                      <td key={i} className={`px-4 py-3 font-mono ${v !== undefined && v === best ? "text-cyan" : "text-dim"}`}>
                        {v === undefined ? "—" : r.fmt(v)} {v !== undefined && v === best ? "◆" : ""}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {BOOL.map(([l, f]) => (
                <tr key={l} className="border-b border-line/50">
                  <td className="hud-label px-4 py-3">{l}</td>
                  {chosen.map((m) => (
                    <td key={m.slug} className={`px-4 py-3 font-mono ${f(m) ? "text-lime" : "text-mute"}`}>{f(m) ? "● yes" : "○ no"}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="hud-label px-4 py-3">Released</td>
                {chosen.map((m) => (
                  <td key={m.slug} className="px-4 py-3 font-mono text-dim">{fmtDate(m.created)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

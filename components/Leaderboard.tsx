"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Model } from "@/lib/types";
import { blended, fmtCtx, fmtNum, fmtPrice, makerHue } from "@/lib/format";

type Col = { key: string; label: string; get: (m: Model) => number | undefined; fmt: (v: number) => string; hib: boolean };

const COLS: Col[] = [
  { key: "intelligence", label: "Intel", get: (m) => m.scores.intelligence, fmt: (v) => fmtNum(v), hib: true },
  { key: "coding", label: "Coding", get: (m) => m.scores.coding, fmt: (v) => fmtNum(v), hib: true },
  { key: "math", label: "Math", get: (m) => m.scores.math, fmt: (v) => fmtNum(v), hib: true },
  { key: "speed", label: "Tok/s", get: (m) => m.speed, fmt: (v) => String(Math.round(v)), hib: true },
  { key: "ttft", label: "TTFT", get: (m) => m.ttft, fmt: (v) => `${v.toFixed(2)}s`, hib: false },
  { key: "in", label: "$ In", get: (m) => m.priceIn, fmt: fmtPrice, hib: false },
  { key: "out", label: "$ Out", get: (m) => m.priceOut, fmt: fmtPrice, hib: false },
  { key: "ctx", label: "Context", get: (m) => m.context, fmt: fmtCtx, hib: true },
  { key: "axs", label: "AXS", get: (m) => m.heuristic, fmt: (v) => fmtNum(v), hib: true },
];

const CAPS: [keyof Model["caps"] | "open" | "free", string][] = [
  ["tools", "Tools"],
  ["reasoning", "Reasoning"],
  ["vision", "Vision"],
  ["json", "JSON"],
  ["open", "Open-weight"],
  ["free", "Free"],
];

export function Leaderboard({ models, benchmarks }: { models: Model[]; benchmarks: boolean }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(benchmarks ? "intelligence" : "axs");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [caps, setCaps] = useState<string[]>([]);
  const [maker, setMaker] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const makers = useMemo(() => [...new Map(models.map((m) => [m.makerSlug, m.maker])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [models]);

  const rows = useMemo(() => {
    const col = COLS.find((c) => c.key === sort)!;
    let r = models.filter((m) => (m.name + " " + m.id + " " + m.maker).toLowerCase().includes(q.toLowerCase()));
    if (maker) r = r.filter((m) => m.makerSlug === maker);
    if (maxPrice) r = r.filter((m) => blended(m) <= +maxPrice);
    for (const c of caps) r = r.filter((m) => (c === "open" ? m.openWeights : c === "free" ? m.free : m.caps[c as keyof Model["caps"]]));
    return [...r].sort((a, b) => {
      const va = col.get(a), vb = col.get(b);
      if (va === undefined && vb === undefined) return 0;
      if (va === undefined) return 1;
      if (vb === undefined) return -1;
      return dir === -1 ? vb - va : va - vb;
    });
  }, [models, q, sort, dir, caps, maker, maxPrice]);

  const clickSort = (k: string) => {
    if (k === sort) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(k);
      setDir(COLS.find((c) => c.key === k)!.hib ? -1 : 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] bg-void/60 border border-line rounded-lg px-3 h-10">
          <span className="font-mono text-cyan text-xs">&gt;_</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter models…" className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <select value={maker} onChange={(e) => setMaker(e.target.value)} className="bg-void/60 border border-line rounded-lg h-10 px-3 text-sm text-dim">
          <option value="">All labs</option>
          {makers.map(([s, n]) => (
            <option key={s} value={s}>{n}</option>
          ))}
        </select>
        <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="bg-void/60 border border-line rounded-lg h-10 px-3 text-sm text-dim">
          <option value="">Any price</option>
          <option value="0.5">≤ $0.50 / M</option>
          <option value="1">≤ $1 / M</option>
          <option value="3">≤ $3 / M</option>
          <option value="10">≤ $10 / M</option>
        </select>
        <div className="flex flex-wrap gap-1.5">
          {CAPS.map(([k, l]) => {
            const on = caps.includes(k);
            return (
              <button key={k} onClick={() => setCaps((c) => (on ? c.filter((x) => x !== k) : [...c, k]))} className={`chip !py-1.5 !px-2.5 transition-colors ${on ? "!text-cyan !border-cyan/60 bg-cyan/10" : "hover:!text-ink"}`}>
                {l}
              </button>
            );
          })}
        </div>
        <span className="font-mono text-xs text-mute ml-auto">{rows.length} / {models.length}</span>
      </div>

      <div className="glass rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead>
            <tr className="border-b border-line">
              <th className="hud-label text-left px-4 py-3 w-10">#</th>
              <th className="hud-label text-left px-2 py-3">Model</th>
              {COLS.map((c) => (
                <th key={c.key} className="px-3 py-3 text-right">
                  <button onClick={() => clickSort(c.key)} className={`hud-label hover:!text-ink ${sort === c.key ? "!text-cyan" : ""}`}>
                    {c.label} {sort === c.key ? (dir === -1 ? "↓" : "↑") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={m.id} className="border-b border-line/50 hover:bg-cyan/[0.04]">
                <td className="px-4 py-2.5 font-mono text-mute">{i + 1}</td>
                <td className="px-2 py-2.5">
                  <Link href={`/models/${m.slug}`} className="flex items-center gap-2.5 hover:text-cyan">
                    <span className="w-1.5 h-6 rounded-full" style={{ background: `hsl(${makerHue(m.makerSlug)} 90% 65%)` }} />
                    <span>
                      <span className="block font-medium">{m.name}</span>
                      <span className="block text-[11px] font-mono text-mute">{m.maker}</span>
                    </span>
                  </Link>
                </td>
                {COLS.map((c) => {
                  const v = c.get(m);
                  return (
                    <td key={c.key} className={`px-3 py-2.5 text-right font-mono ${sort === c.key ? "text-cyan" : "text-dim"}`}>
                      {v === undefined ? <span className="text-mute/60">—</span> : c.key === "in" || c.key === "out" ? (v === 0 ? <span className="text-lime">0</span> : c.fmt(v)) : c.fmt(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

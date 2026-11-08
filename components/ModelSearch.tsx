"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { slug: string; name: string; maker: string; kind: "model" | "collection" };

export function ModelSearch({ items, placeholder }: { items: Item[]; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return items
      .filter((i) => (i.name + " " + i.maker).toLowerCase().includes(s))
      .sort((a, b) => (a.kind === "collection" ? -1 : 0) - (b.kind === "collection" ? -1 : 0))
      .slice(0, 8);
  }, [q, items]);

  const go = (i: Item) => router.push(i.kind === "model" ? `/models/${i.slug}` : `/best-models-for/${i.slug}`);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="glass glow-border rounded-xl flex items-center gap-3 px-4 h-14 focus-within:shadow-[0_0_40px_-8px_rgba(62,240,255,0.45)] transition-shadow">
        <span className="font-mono text-cyan text-sm">&gt;_</span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            if (e.key === "Enter" && results[active]) go(results[active]);
          }}
          placeholder={placeholder ?? "Search a model or a job — e.g. coding, vision, Claude…"}
          className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-mute"
          aria-label="Search models and use cases"
        />
        <kbd className="chip hidden sm:inline">↵</kbd>
      </div>
      {results.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full glass rounded-xl overflow-hidden shadow-2xl">
          {results.map((r, i) => (
            <li key={r.kind + r.slug}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 ${i === active ? "bg-cyan/[0.07]" : ""}`}
              >
                <span className="truncate">
                  {r.kind === "collection" ? <span className="text-dim">Best models for </span> : null}
                  <span className={i === active ? "text-cyan" : ""}>{r.name}</span>
                </span>
                <span className="hud-label shrink-0">{r.kind === "collection" ? "ranking" : r.maker}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

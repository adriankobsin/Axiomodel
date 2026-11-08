import Link from "next/link";
import type { Model, Catalog } from "@/lib/types";
import { makerHue } from "@/lib/format";
import { site } from "@/lib/site";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3ef0ff" />
            <stop offset="0.6" stopColor="#8b5cff" />
            <stop offset="1" stopColor="#ff4fd8" />
          </linearGradient>
        </defs>
        <path d="M16 2 29 9.5v13L16 30 3 22.5v-13z" fill="none" stroke="url(#lg)" strokeWidth="2" />
        <path d="M16 9 22 12.5v7L16 23l-6-3.5v-7z" fill="url(#lg)" opacity="0.9" />
        <circle cx="16" cy="16" r="2" fill="#05060a" />
      </svg>
      <span className="font-semibold tracking-tight text-[17px]">{site.name}</span>
      <span className="hud-label hidden sm:inline !text-[9px] border border-line-2 rounded px-1.5 py-0.5">v1</span>
    </Link>
  );
}

const NAV = [
  { href: "/best-models-for", label: "Best for" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/compare", label: "Compare" },
  { href: "/makers", label: "Makers" },
  { href: "/api-docs", label: "API" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-void/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-5 h-14 flex items-center justify-between gap-6">
        <Logo />
        <nav className="flex items-center gap-1 overflow-x-auto text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="px-3 py-1.5 rounded-md text-dim hover:text-ink hover:bg-panel-2 transition-colors whitespace-nowrap">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Footer({ catalog }: { catalog?: Catalog }) {
  return (
    <footer className="border-t border-line mt-24">
      <div className="mx-auto max-w-7xl px-5 py-10 grid gap-6 md:grid-cols-3 text-sm text-dim">
        <div className="space-y-2">
          <Logo />
          <p className="text-mute max-w-xs">{site.tagline}</p>
        </div>
        <div className="space-y-1.5">
          <div className="hud-label mb-2">Data sources</div>
          <p>Catalog, pricing &amp; capabilities: <a className="text-cyan hover:underline" href="https://openrouter.ai/models" target="_blank" rel="noreferrer">OpenRouter</a></p>
          <p>Benchmarks, speed &amp; latency: <a className="text-cyan hover:underline" href="https://artificialanalysis.ai" target="_blank" rel="noreferrer">Artificial Analysis</a></p>
          <p className="text-mute">We don&apos;t run benchmarks ourselves or accept paid placement.</p>
        </div>
        <div className="space-y-1.5">
          <div className="hud-label mb-2">System</div>
          <Link href="/methodology" className="block hover:text-ink">Methodology</Link>
          <Link href="/api-docs" className="block hover:text-ink">Free JSON API</Link>
          {catalog && <p className="font-mono text-xs text-mute">{catalog.models.length} models · {catalog.source} · {new Date(catalog.updatedAt).toUTCString().slice(5, 22)} UTC</p>}
        </div>
      </div>
    </footer>
  );
}

export function DataBanner({ catalog }: { catalog: Catalog }) {
  if (catalog.source === "sample")
    return (
      <div className="border border-amber/40 bg-amber/10 text-amber rounded-lg px-4 py-2.5 text-sm font-mono">
        ⚠ OFFLINE PREVIEW — the live catalog couldn&apos;t be reached, so illustrative sample data is shown. Figures are not real.
      </div>
    );
  if (!catalog.benchmarks)
    return (
      <div className="border border-violet/40 bg-violet/10 text-ink/90 rounded-lg px-4 py-2.5 text-sm">
        <span className="font-mono text-violet mr-2">◇ HEURISTIC MODE</span>
        Live prices &amp; capabilities are on. Add an <code className="font-mono text-cyan">ARTIFICIAL_ANALYSIS_API_KEY</code> to switch rankings to real benchmark scores.
      </div>
    );
  return null;
}

export function MakerBadge({ slug, name, size = 22 }: { slug: string; name: string; size?: number }) {
  const h = makerHue(slug);
  return (
    <span
      title={name}
      className="inline-flex items-center justify-center rounded-md font-mono font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        color: `hsl(${h} 95% 72%)`,
        background: `hsl(${h} 70% 50% / 0.12)`,
        border: `1px solid hsl(${h} 80% 60% / 0.35)`,
      }}
    >
      {name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}
    </span>
  );
}

export function CapChips({ m, max = 6 }: { m: Model; max?: number }) {
  const chips: [boolean, string][] = [
    [m.caps.reasoning, "Reasoning"],
    [m.caps.tools, "Tools"],
    [m.caps.json, "JSON"],
    [m.caps.vision, "Vision"],
    [m.caps.audio, "Audio"],
    [m.caps.imageOut, "Image out"],
    [m.openWeights, "Open"],
    [m.free, "Free"],
  ];
  return (
    <span className="flex flex-wrap gap-1">
      {chips
        .filter(([on]) => on)
        .slice(0, max)
        .map(([, l]) => (
          <span key={l} className={`chip ${l === "Free" ? "!text-lime !border-lime/40" : l === "Open" ? "!text-cyan !border-cyan/30" : ""}`}>
            {l}
          </span>
        ))}
    </span>
  );
}

export function PageHead({ kicker, title, children }: { kicker: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="pt-12 pb-8 space-y-4">
      <div className="flex items-center gap-2 hud-label">
        <span className="live-dot" /> {kicker}
      </div>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">{title}</h1>
      {children}
    </div>
  );
}

export function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(2, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className="bar-track h-1.5 w-full rounded-full bg-line">
      <div className="bar-fill h-full rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

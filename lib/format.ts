export function fmtPrice(n: number): string {
  if (!isFinite(n)) return "—";
  if (n === 0) return "Free";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}

export function fmtCtx(n: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

export function fmtNum(n: number | undefined, digits = 1): string {
  if (n === undefined || n === null || !isFinite(n)) return "—";
  return n.toFixed(digits);
}

export function fmtDate(unix: number): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function blended(m: { priceIn: number; priceOut: number }): number {
  // 3:1 input:output blend, the common industry convention
  return (m.priceIn * 3 + m.priceOut) / 4;
}

// Deterministic accent colour per maker for monogram badges
export function makerHue(slug: string): number {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

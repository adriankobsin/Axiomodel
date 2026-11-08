export type Scores = {
  intelligence?: number;
  coding?: number;
  math?: number;
  gpqa?: number;
};

export type Model = {
  id: string; // e.g. "anthropic/claude-opus-4.5"
  slug: string; // url-safe id
  name: string; // "Claude Opus 4.5"
  maker: string; // "Anthropic"
  makerSlug: string; // "anthropic"
  description: string;
  created: number; // unix seconds
  context: number; // tokens
  maxOutput?: number;
  priceIn: number; // USD per 1M input tokens
  priceOut: number; // USD per 1M output tokens
  free: boolean;
  inputMods: string[];
  outputMods: string[];
  params: string[];
  caps: {
    vision: boolean;
    tools: boolean;
    json: boolean;
    reasoning: boolean;
    audio: boolean;
    imageOut: boolean;
  };
  openWeights: boolean;
  hfId?: string;
  scores: Scores;
  speed?: number; // output tokens/sec (measured)
  ttft?: number; // seconds to first token (measured)
  heuristic: number; // 0-100 fallback capability score when no benchmark
};

export type Catalog = {
  models: Model[];
  source: "live" | "sample";
  benchmarks: boolean;
  updatedAt: string;
};

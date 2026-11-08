"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export type PgModel = { id: string; slug: string; name: string; maker: string; free: boolean; context: number };
type Msg = { role: "user" | "assistant"; content: string };

const KEY_STORE = "axiom_or_key";

function readKey() {
  try {
    return localStorage.getItem(KEY_STORE) ?? "";
  } catch {
    return "";
  }
}
function writeKey(v: string) {
  try {
    if (v) localStorage.setItem(KEY_STORE, v);
    else localStorage.removeItem(KEY_STORE);
  } catch {}
}

export function Playground({ models, initial, pro }: { models: PgModel[]; initial?: string; pro: boolean }) {
  const free = useMemo(() => models.filter((m) => m.free), [models]);
  const paid = useMemo(() => models.filter((m) => !m.free), [models]);
  const [modelId, setModelId] = useState(initial && models.some((m) => m.id === initial) ? initial : free[0]?.id ?? models[0]?.id ?? "");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<string | null>(null);
  const [userKey, setUserKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserKey(readKey());
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const model = models.find((m) => m.id === modelId);
  const locked = !!model && !model.free && !pro && !userKey;

  async function send() {
    const text = input.trim();
    if (!text || busy || !model) return;
    setError(null);
    const history: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(userKey ? { "x-user-openrouter-key": userKey } : {}) },
        body: JSON.stringify({ model: model.id, messages: history }),
        signal: ctrl.signal,
      });
      const rem = res.headers.get("X-Messages-Remaining");
      if (rem !== null) setRemaining(rem);
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Error ${res.status}`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue; // skips ": OPENROUTER PROCESSING" keep-alives
          const data = l.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            if (j.error) throw new Error(j.error.message || "The model returned an error.");
            const delta = j.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              setMessages((m) => {
                const c = [...m];
                c[c.length - 1] = { role: "assistant", content: acc };
                return c;
              });
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
      if (!acc) throw new Error("The model returned an empty reply. Try again or pick another model.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message);
        setMessages((m) => (m[m.length - 1]?.content === "" ? m.slice(0, -1) : m));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-5">
      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="glass rounded-xl p-4 space-y-3">
          <label className="hud-label block" htmlFor="model">Model</label>
          <select id="model" value={modelId} onChange={(e) => setModelId(e.target.value)} className="w-full bg-void/60 border border-line rounded-lg h-10 px-3 text-sm">
            <optgroup label={`Free · ${free.length} models · no sign-up`}>
              {free.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </optgroup>
            <optgroup label={`Paid · ${paid.length} models · Pro or own key`}>
              {paid.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.maker}</option>
              ))}
            </optgroup>
          </select>
          {model && (
            <div className="flex flex-wrap gap-1.5">
              <span className={`chip ${model.free ? "!text-lime !border-lime/40" : "!text-violet !border-violet/40"}`}>{model.free ? "Free" : "Paid"}</span>
              <Link href={`/models/${model.slug}`} className="chip hover:!text-cyan">Model profile ↗</Link>
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-4 space-y-2 text-sm">
          <div className="hud-label">Your access</div>
          {userKey ? (
            <p className="text-dim">Using <span className="text-cyan">your own OpenRouter key</span>. All models, no site limits. Usage is billed to your account.</p>
          ) : pro ? (
            <p className="text-dim"><span className="text-cyan">Pro</span>: free and paid models.</p>
          ) : (
            <p className="text-dim">Free models, no account needed. <Link href="/pricing" className="text-cyan hover:underline">Upgrade</Link> for paid models.</p>
          )}
          {remaining !== null && !userKey && <p className="font-mono text-xs text-mute">{remaining} messages left today</p>}
        </div>

        <div className="glass rounded-xl p-4 space-y-2">
          <button onClick={() => setShowKey((s) => !s)} className="hud-label hover:!text-ink">{showKey ? "▾" : "▸"} Use your own OpenRouter key</button>
          {showKey && (
            <div className="space-y-2">
              <input
                type="password"
                value={userKey}
                onChange={(e) => {
                  setUserKey(e.target.value.trim());
                  writeKey(e.target.value.trim());
                }}
                placeholder="sk-or-v1-…"
                className="w-full bg-void/60 border border-line rounded-lg h-9 px-3 text-sm font-mono"
                autoComplete="off"
              />
              <p className="text-xs text-mute">Saved only in this browser and sent only with your own messages. Get one at <a className="text-cyan" href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">openrouter.ai/keys</a>.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Chat */}
      <section className="glass glow-border rounded-xl flex flex-col min-h-[560px] max-h-[75vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <span className={busy ? "live-dot" : "w-[7px] h-[7px] rounded-full bg-mute"} />
            <span className="font-medium text-sm">{model?.name ?? "No model"}</span>
          </div>
          <button onClick={() => { abortRef.current?.abort(); setMessages([]); setError(null); }} className="chip hover:!text-ink">New chat</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-16">
              <div className="font-mono text-cyan text-3xl">&gt;_</div>
              <p className="text-dim max-w-sm">Ask anything. Switch models from the list to compare how they answer.</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {["Explain RAG in two sentences", "Write a Python function to dedupe a list", "Which is bigger, 9.11 or 9.9?"].map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="chip !py-1.5 hover:!text-cyan hover:!border-cyan/50">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 text-[14.5px] leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-cyan/10 border border-cyan/25" : "bg-panel-2 border border-line"}`}>
                {m.content || <span className="font-mono text-mute animate-pulse">thinking…</span>}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {error && <div className="mx-5 mb-2 border border-magenta/40 bg-magenta/10 text-magenta rounded-lg px-3 py-2 text-sm">{error}</div>}
        {locked && (
          <div className="mx-5 mb-2 border border-violet/40 bg-violet/10 rounded-lg px-3 py-2 text-sm">
            {model?.name} is a paid model. <Link href="/pricing" className="text-cyan underline">Upgrade to Pro</Link>, add your own key, or pick a free model.
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-line p-3 flex gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={locked ? "Pick a free model to chat" : "Message the model… (Shift+Enter for a new line)"}
            disabled={locked}
            className="flex-1 resize-none bg-void/60 border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan/50 max-h-40"
          />
          {busy ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="rounded-lg border border-magenta/40 text-magenta px-4 text-sm">Stop</button>
          ) : (
            <button type="submit" disabled={locked || !input.trim()} className="rounded-lg bg-gradient-to-r from-cyan to-violet text-void font-medium px-5 text-sm disabled:opacity-40">Send</button>
          )}
        </form>
      </section>
    </div>
  );
}

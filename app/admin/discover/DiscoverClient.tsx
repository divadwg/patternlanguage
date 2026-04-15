"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Thinker } from "@/lib/admin/thinkers";

type Mode = "topic" | "thinker";
type ThinkerCounts = Record<string, { pending: number; approved: number }>;

export default function DiscoverClient({ thinkers }: { thinkers: Thinker[] }) {
  const [mode, setMode] = useState<Mode>("topic");
  const [topic, setTopic] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    key: string;
    count: number;
    alreadySeen?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<ThinkerCounts>({});

  async function refreshCounts() {
    try {
      const res = await fetch("/api/admin/thinker-counts");
      if (res.ok) {
        const body = await res.json();
        setCounts(body.counts ?? {});
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    refreshCounts();
  }, []);

  async function runTopic() {
    const t = topic.trim();
    if (t.length < 3) return;
    await run({ topic: t }, `topic:${t}`);
  }

  async function runThinker(thinker: Thinker) {
    await run({ thinkerId: thinker.id }, `thinker:${thinker.id}`);
  }

  async function run(body: Record<string, string>, key: string) {
    setBusyKey(key);
    setLastResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const rb = await res.json();
      if (!res.ok) {
        setError(rb.error ?? `HTTP ${res.status}`);
        return;
      }
      setLastResult({
        key,
        count: rb.count,
        alreadySeen: rb.alreadySeen,
      });
      if (key.startsWith("topic:")) setTopic("");
      refreshCounts();
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--surface)]">
      <div className="max-w-[960px] mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-1">
              Local admin
            </div>
            <h1 className="tracking-tight">Discover</h1>
            <div className="text-[13px] text-[color:var(--text-muted)] mt-1 max-w-[640px]">
              Ask Claude to research and synthesize. For thinkers, keep pressing
              <em> Extract more</em> — each pass excludes what's already in the queue or
              approved, so you can mine a thinker until they're exhausted.
            </div>
          </div>
          <Link href="/admin" className="btn-secondary">
            ← Admin
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("topic")}
            className={mode === "topic" ? "btn-primary" : "btn-secondary"}
          >
            By topic
          </button>
          <button
            onClick={() => setMode("thinker")}
            className={mode === "thinker" ? "btn-primary" : "btn-secondary"}
          >
            By thinker
          </button>
        </div>

        {mode === "topic" ? (
          <div className="card p-6">
            <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">
              Topic or question
            </label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={`e.g. "what makes a pedestrian street feel alive" or "patterns for third places"`}
              className="input"
              onKeyDown={(e) => {
                if (e.key === "Enter") runTopic();
              }}
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={runTopic}
                disabled={busyKey !== null || topic.trim().length < 3}
                className="btn-primary"
              >
                {busyKey?.startsWith("topic:") ? "Researching…" : "Research"}
              </button>
              {busyKey?.startsWith("topic:") ? (
                <span className="text-[12px] text-[color:var(--text-muted)]">
                  Claude is searching the web. 30–90 seconds.
                </span>
              ) : null}
              {lastResult?.key.startsWith("topic:") ? (
                <ResultNote count={lastResult.count} />
              ) : null}
              {error && mode === "topic" ? (
                <span className="text-[13px] text-[color:var(--danger)]">
                  {error}
                </span>
              ) : null}
            </div>
            <div className="mt-5 text-[12px] text-[color:var(--text-muted)] leading-relaxed">
              <strong className="text-[color:var(--text-body)]">Examples</strong>:
              “patterns for successful pedestrian streets”, “what makes a third place work”,
              “eyes on the street in modern apartment design”, “design patterns for
              climate-resilient neighborhoods”, “walkability and block size”.
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[13px] text-[color:var(--text-muted)] mb-4">
              Pick a thinker. First pass gets 10–20 patterns. Press{" "}
              <em>Extract more</em> to keep going — each pass hides the ones you've
              already seen and asks Claude for additional, more specific patterns.
              When Claude returns 0, the thinker is exhausted.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {thinkers.map((t) => {
                const key = `thinker:${t.id}`;
                const busy = busyKey === key;
                const done = lastResult?.key === key;
                const c = counts[t.id];
                const total = (c?.pending ?? 0) + (c?.approved ?? 0);
                const hasExtracted = total > 0;
                return (
                  <div
                    key={t.id}
                    className="card p-5"
                    style={t.canonical ? { opacity: 0.55 } : undefined}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3
                          className="text-[color:var(--text-primary)]"
                          style={{ fontSize: 16 }}
                        >
                          {t.name}
                        </h3>
                        {t.years ? (
                          <div className="font-mono text-[10px] text-[color:var(--text-muted)]">
                            {t.years}
                          </div>
                        ) : null}
                      </div>
                      {t.canonical ? (
                        <span
                          className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)]"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          Already seeded
                        </span>
                      ) : (
                        <button
                          onClick={() => runThinker(t)}
                          disabled={busyKey !== null}
                          className={hasExtracted ? "btn-secondary" : "btn-primary"}
                          style={{ padding: "6px 12px", fontSize: 13 }}
                        >
                          {busy
                            ? "…"
                            : hasExtracted
                              ? "Extract more"
                              : "Extract"}
                        </button>
                      )}
                    </div>
                    <p className="text-[12px] text-[color:var(--text-body)] leading-relaxed mb-2">
                      {t.blurb}
                    </p>
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-[11px] text-[color:var(--text-muted)] italic">
                        {t.works.slice(0, 2).join(" · ")}
                      </div>
                      {!t.canonical && hasExtracted ? (
                        <div className="font-mono text-[10px] text-[color:var(--text-muted)] whitespace-nowrap">
                          {c!.approved > 0 ? `${c!.approved} approved` : null}
                          {c!.approved > 0 && c!.pending > 0 ? " · " : null}
                          {c!.pending > 0 ? `${c!.pending} pending` : null}
                        </div>
                      ) : null}
                    </div>
                    {done ? (
                      <div className="mt-2 text-[12px]">
                        {lastResult!.count > 0 ? (
                          <span className="text-[color:var(--success)]">
                            ✓ Added {lastResult!.count} more.
                          </span>
                        ) : (
                          <span className="text-[color:var(--text-muted)]">
                            Claude returned 0 — this thinker looks exhausted.
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {error && mode === "thinker" ? (
              <div className="text-[13px] text-[color:var(--danger)] mt-4">
                {error}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultNote({ count }: { count: number }) {
  return (
    <span className="text-[13px] text-[color:var(--text-body)]">
      ✓ Added <strong>{count}</strong> candidate{count === 1 ? "" : "s"}.{" "}
      <Link
        href="/admin/queue"
        className="underline decoration-[color:var(--accent)] underline-offset-2"
      >
        Review →
      </Link>
    </span>
  );
}

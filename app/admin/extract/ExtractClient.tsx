"use client";

import Link from "next/link";
import { useState } from "react";

export default function ExtractClient() {
  const [mode, setMode] = useState<"text" | "url">("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    count: number;
    fetchedTitle: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disabled =
    loading || (mode === "text" ? text.trim().length < 100 : !url.trim());

  async function submit() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "text" ? { text } : { url },
        ),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? `Error ${res.status}`);
        return;
      }
      setResult({ count: body.count, fetchedTitle: body.fetchedTitle });
      if (mode === "text") setText("");
      if (mode === "url") setUrl("");
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--surface)]">
      <div className="max-w-[900px] mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-1">
              Local admin
            </div>
            <h1 className="tracking-tight">Extract patterns</h1>
          </div>
          <Link href="/admin" className="btn-secondary">
            ← Admin
          </Link>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMode("text")}
              className={mode === "text" ? "btn-primary" : "btn-secondary"}
            >
              Paste text
            </button>
            <button
              onClick={() => setMode("url")}
              className={mode === "url" ? "btn-primary" : "btn-secondary"}
            >
              Fetch URL
            </button>
          </div>

          {mode === "text" ? (
            <>
              <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">
                Source text (article, essay, notes)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste an article, essay, or your own notes here. Claude will read it and draft pattern candidates."
                className="input"
                style={{ minHeight: 300, fontFamily: "inherit", resize: "vertical" }}
              />
              <div className="text-[11px] text-[color:var(--text-muted)] mt-2 font-mono">
                {text.length.toLocaleString()} chars
                {text.length < 100 && text.length > 0 ? " — need at least 100" : ""}
              </div>
            </>
          ) : (
            <>
              <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">
                Article URL
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.dezeen.com/2024/..."
                className="input"
                type="url"
              />
              <div className="text-[11px] text-[color:var(--text-muted)] mt-2">
                We fetch the URL server-side, extract the readable article
                with Mozilla Readability, then send the body to Claude.
              </div>
            </>
          )}

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={submit}
              disabled={disabled}
              className="btn-primary"
            >
              {loading ? "Extracting…" : "Extract candidates"}
            </button>
            {result ? (
              <span className="text-[13px] text-[color:var(--text-body)]">
                ✓ Added <strong>{result.count}</strong> candidate
                {result.count === 1 ? "" : "s"} to the queue
                {result.fetchedTitle ? (
                  <>
                    {" "}
                    (from{" "}
                    <em className="text-[color:var(--text-muted)]">
                      {result.fetchedTitle}
                    </em>
                    )
                  </>
                ) : null}
                .{" "}
                <Link
                  href="/admin/queue"
                  className="underline decoration-[color:var(--accent)] underline-offset-2"
                >
                  Review now →
                </Link>
              </span>
            ) : null}
            {error ? (
              <span className="text-[13px] text-[color:var(--danger)]">
                {error}
              </span>
            ) : null}
          </div>
        </div>

        <div className="text-[12px] text-[color:var(--text-muted)] leading-relaxed">
          Claude may return 0 candidates — that's a good sign when the source
          isn't really about patterns. Candidates land in the review queue; none
          enter the graph until you approve them.
        </div>
      </div>
    </div>
  );
}

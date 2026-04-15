"use client";

import Link from "next/link";
import { useState } from "react";
import type { Source } from "@/lib/admin/storage";
import CrawlerButton from "../CrawlerButton";

export default function SourcesClient({
  initialSources,
}: {
  initialSources: Source[];
}) {
  const [sources, setSources] = useState(initialSources);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function update(i: number, patch: Partial<Source>) {
    setSources((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  function remove(i: number) {
    setSources((prev) => prev.filter((_, j) => j !== i));
  }

  function add() {
    setSources((prev) => [
      ...prev,
      {
        id: `source-${Date.now()}`,
        name: "",
        url: "",
        kind: "html_index",
        linkSelector: "a[href]",
        enabled: true,
      },
    ]);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources }),
      });
      if (res.ok) setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--surface)]">
      <div className="max-w-[1000px] mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-1">
              Local admin
            </div>
            <h1 className="tracking-tight">Crawler sources</h1>
            <div className="text-[13px] text-[color:var(--text-muted)] mt-1">
              Websites the crawler will pull from. Run{" "}
              <code className="font-mono bg-[color:var(--surface-raised)] px-1.5 py-0.5 rounded text-[12px]">
                npm run crawl
              </code>{" "}
              in a terminal to fetch and extract.
            </div>
          </div>
          <Link href="/admin" className="btn-secondary">
            ← Admin
          </Link>
        </div>

        <div className="card p-5 mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-3">
            Crawl now
          </div>
          <CrawlerButton />
        </div>

        <div className="space-y-3 mb-6">
          {sources.map((s, i) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start gap-4">
                <label className="flex items-center gap-2 pt-2 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) => update(i, { enabled: e.target.checked })}
                  />
                  <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                    on
                  </span>
                </label>
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={s.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                      placeholder="Name (e.g. Dezeen — Architecture)"
                      className="input"
                    />
                    <input
                      value={s.url}
                      onChange={(e) => update(i, { url: e.target.value })}
                      placeholder="https://..."
                      className="input"
                      type="url"
                    />
                  </div>
                  <div className="grid grid-cols-[150px_1fr] gap-3">
                    <select
                      value={s.kind}
                      onChange={(e) =>
                        update(i, { kind: e.target.value as Source["kind"] })
                      }
                      className="input"
                    >
                      <option value="html_index">html_index</option>
                      <option value="html_page">html_page</option>
                      <option value="rss">rss</option>
                    </select>
                    <input
                      value={s.linkSelector ?? ""}
                      onChange={(e) => update(i, { linkSelector: e.target.value })}
                      placeholder="CSS selector for article links (html_index only)"
                      className="input"
                    />
                  </div>
                  <textarea
                    value={s.note ?? ""}
                    onChange={(e) => update(i, { note: e.target.value })}
                    placeholder="Optional note"
                    className="input"
                    style={{ minHeight: 40, resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>
                <button
                  onClick={() => remove(i)}
                  className="text-[color:var(--text-muted)] hover:text-[color:var(--danger)] text-lg leading-none pt-2"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={add} className="btn-secondary">
            + Add source
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save"}
          </button>
          {savedAt ? (
            <span className="text-[13px] text-[color:var(--success)]">
              Saved ✓
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

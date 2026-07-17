"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import PatternGraph from "./PatternGraph";
import PatternPanel from "@/components/PatternPanel";
import type { Pattern, Connection } from "@/lib/types";
import { colorForPattern, sourceNameForPattern } from "@/lib/palette";

export default function ExploreClient({
  initialPatterns,
  initialConnections,
  initialSelectedId = null,
}: {
  initialPatterns: Pattern[];
  initialConnections: Connection[];
  initialSelectedId?: string | null;
}) {
  const [patterns] = useState(initialPatterns);
  const [connections] = useState(initialConnections);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(patterns, {
        keys: ["title", "summary", "number"],
        threshold: 0.32,
        ignoreLocation: true,
      }),
    [patterns]
  );

  const highlightIds = useMemo(() => {
    const q = query.trim();
    if (!q) return new Set<string>();
    return new Set(fuse.search(q, { limit: 12 }).map((r) => r.item.id));
  }, [query, fuse]);

  const selected = selectedId ? patterns.find((p) => p.id === selectedId) ?? null : null;

  // One unified legend keyed by source (Alexander, each thinker, each topic,
  // plain user). Sorted by count desc so Alexander leads and smaller sources
  // cluster at the bottom.
  const legendEntries = useMemo(() => {
    const buckets = new Map<string, { label: string; color: string; count: number }>();
    for (const p of patterns) {
      const label = sourceNameForPattern(p) ?? "User-added";
      const color = colorForPattern(p);
      const key = `${label}|${color}`;
      const existing = buckets.get(key);
      if (existing) existing.count += 1;
      else buckets.set(key, { label, color, count: 1 });
    }
    return Array.from(buckets.values()).sort((a, b) => b.count - a.count);
  }, [patterns]);

  return (
    <div className="fixed inset-0 bg-[color:var(--surface)]">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-4 px-6 py-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 text-[color:var(--text-primary)]">
          <span className="w-5 h-5 rounded-full bg-[color:var(--accent)] inline-block" />
          <span className="font-medium text-[14px]">A Pattern Language</span>
        </div>
        <Link
          href="/patterns"
          className="pointer-events-auto text-[13px] !text-[color:var(--text-secondary)] hover:!text-[color:var(--text-primary)]"
        >
          Index
        </Link>
        <Link
          href="/about"
          className="pointer-events-auto text-[13px] !text-[color:var(--text-secondary)] hover:!text-[color:var(--text-primary)]"
        >
          What is this?
        </Link>

        <div className="pointer-events-auto ml-6 flex-1 max-w-md">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${patterns.length} patterns…`}
              className="input !bg-white/90 backdrop-blur"
              style={{ paddingLeft: 36 }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none">
              ⌕
            </span>
          </div>
          {query && highlightIds.size > 0 ? (
            <SearchResults
              results={patterns.filter((p) => highlightIds.has(p.id)).slice(0, 8)}
              onSelect={(id) => {
                setSelectedId(id);
                setQuery("");
              }}
            />
          ) : null}
        </div>

        <div className="pointer-events-auto ml-auto flex items-center gap-2">
          {process.env.NODE_ENV === "development" ? (
            <Link href="/admin" className="btn-primary">
              Admin
            </Link>
          ) : null}
        </div>
      </div>

      {/* Graph */}
      <div className="absolute inset-0">
        <PatternGraph
          patterns={patterns}
          connections={connections}
          selectedId={selectedId}
          onSelect={setSelectedId}
          searchQuery={query}
          highlightIds={highlightIds}
        />
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-5 left-5 z-20 card px-4 py-3 text-[12px] max-h-[70vh] overflow-y-auto"
        style={{ maxWidth: 260 }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">
          Sources ({legendEntries.length})
        </div>
        <div className="space-y-1">
          {legendEntries.map((e) => (
            <LegendItem
              key={e.label + e.color}
              color={e.color}
              label={e.label}
              count={e.count}
            />
          ))}
        </div>
      </div>

      {/* Panel */}
      {selected ? (
        <PatternPanel
          pattern={selected}
          patterns={patterns}
          connections={connections}
          onSelect={setSelectedId}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}

function LegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 text-[color:var(--text-body)]">
      <span
        className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
        style={{ background: color }}
      />
      <span className="truncate flex-1" title={label}>
        {label}
      </span>
      {count !== undefined ? (
        <span className="font-mono text-[10px] text-[color:var(--text-muted)]">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function SearchResults({
  results,
  onSelect,
}: {
  results: Pattern[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="card mt-2 py-1 overflow-hidden">
      {results.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className="w-full text-left px-4 py-2 hover:bg-[color:var(--surface)] flex items-baseline gap-3"
        >
          <span className="font-mono text-[11px] text-[color:var(--text-muted)] w-7">
            {p.number ?? "•"}
          </span>
          <span className="text-[14px] text-[color:var(--text-primary)]">{p.title}</span>
        </button>
      ))}
    </div>
  );
}

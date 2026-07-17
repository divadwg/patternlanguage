"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import PatternGraph from "./PatternGraph";
import LinearView from "./LinearView";
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
  const [view, setView] = useState<"graph" | "linear">("linear");
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse(patterns, {
        keys: ["title", "summary", "number"],
        threshold: 0.32,
        ignoreLocation: true,
      }),
    [patterns]
  );

  const searchIds = useMemo(() => {
    const q = query.trim();
    if (!q) return new Set<string>();
    return new Set(fuse.search(q, { limit: 12 }).map((r) => r.item.id));
  }, [query, fuse]);

  const sourceIds = useMemo(() => {
    if (!sourceFilter) return new Set<string>();
    return new Set(
      patterns
        .filter((p) => (sourceNameForPattern(p) ?? "User-added") === sourceFilter)
        .map((p) => p.id)
    );
  }, [sourceFilter, patterns]);

  // An active search takes precedence over a legend source filter.
  const highlightIds = query.trim() ? searchIds : sourceIds;

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

  const searchBox = (
    <div className="relative">
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
      {query && searchIds.size > 0 ? (
        <SearchResults
          results={patterns.filter((p) => searchIds.has(p.id)).slice(0, 8)}
          onSelect={(id) => {
            setSelectedId(id);
            setQuery("");
            setMenuOpen(false);
          }}
        />
      ) : null}
    </div>
  );

  const viewToggle = (
    <div className="flex items-center rounded-md border border-[color:var(--border)] bg-white/90 backdrop-blur overflow-hidden">
      {(
        [
          ["linear", "List"],
          ["graph", "Graph"],
        ] as const
      ).map(([v, label]) => (
        <button
          key={v}
          onClick={() => {
            setView(v);
            setMenuOpen(false);
          }}
          className={
            view === v
              ? "px-3 py-1.5 text-[13px] font-medium bg-[color:var(--text-primary)] text-white"
              : "px-3 py-1.5 text-[13px] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[color:var(--surface)]">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center md:justify-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 text-[color:var(--text-primary)] flex-shrink-0">
          <span className="w-5 h-5 rounded-full bg-[color:var(--accent)] inline-block" />
          <span className="font-medium text-[14px] whitespace-nowrap">
            A Pattern Language
          </span>
        </div>

        {/* Desktop controls */}
        <div className="hidden md:flex items-center gap-4">
          <div className="pointer-events-auto">{viewToggle}</div>
          <Link
            href="/about"
            className="pointer-events-auto text-[13px] whitespace-nowrap !text-[color:var(--text-secondary)] hover:!text-[color:var(--text-primary)]"
          >
            What is this?
          </Link>
          <div className="pointer-events-auto ml-2 w-[340px]">{searchBox}</div>
        </div>
        {process.env.NODE_ENV === "development" ? (
          <div className="pointer-events-auto hidden md:block absolute right-6 top-1/2 -translate-y-1/2">
            <Link href="/admin" className="btn-primary">
              Admin
            </Link>
          </div>
        ) : null}

        {/* Mobile: hamburger */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          className="pointer-events-auto md:hidden ml-auto flex items-center justify-center w-9 h-9 rounded-md border border-[color:var(--border)] bg-white/90 backdrop-blur text-[color:var(--text-primary)]"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen ? (
        <div className="md:hidden absolute top-14 left-3 right-3 z-30 card p-4 space-y-4">
          {searchBox}
          <div className="flex items-center justify-between">
            {viewToggle}
            <Link
              href="/about"
              className="text-[13px] !text-[color:var(--text-secondary)]"
              onClick={() => setMenuOpen(false)}
            >
              What is this?
            </Link>
          </div>
          {process.env.NODE_ENV === "development" ? (
            <Link href="/admin" className="btn-primary w-full justify-center">
              Admin
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Graph / linear view */}
      <div className="absolute inset-0">
        {view === "graph" ? (
          <PatternGraph
            patterns={patterns}
            connections={connections}
            selectedId={selectedId}
            onSelect={setSelectedId}
            searchQuery={query}
            highlightIds={highlightIds}
          />
        ) : (
          <LinearView
            patterns={patterns}
            connections={connections}
            selectedId={selectedId}
            onSelect={setSelectedId}
            searchQuery={query}
            highlightIds={highlightIds}
          />
        )}
      </div>

      {/* Legend (graph view only — list rows carry their own source dots).
          Each source is clickable: highlight just that thinker's patterns. */}
      <div
        className="absolute bottom-5 left-5 z-20 card px-4 py-3 text-[12px] max-h-[60vh] md:max-h-[70vh] overflow-y-auto"
        style={{
          maxWidth: "min(260px, 70vw)",
          display: view === "graph" ? undefined : "none",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
            Sources ({legendEntries.length})
          </span>
          {sourceFilter ? (
            <button
              onClick={() => setSourceFilter(null)}
              className="ml-auto text-[10px] font-mono uppercase tracking-[0.1em] text-[color:var(--accent-hover)]"
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="space-y-0.5">
          {legendEntries.map((e) => (
            <LegendItem
              key={e.label + e.color}
              color={e.color}
              label={e.label}
              count={e.count}
              active={sourceFilter === e.label}
              dimmed={sourceFilter !== null && sourceFilter !== e.label}
              onClick={() =>
                setSourceFilter((cur) => (cur === e.label ? null : e.label))
              }
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
  active,
  dimmed,
  onClick,
}: {
  color: string;
  label: string;
  count?: number;
  active: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 text-left px-1.5 py-0.5 -mx-1.5 rounded ${
        active
          ? "bg-[color:var(--accent-light)] text-[color:var(--text-primary)] font-medium"
          : "text-[color:var(--text-body)] hover:bg-[color:var(--surface)]"
      }`}
      style={{ opacity: dimmed ? 0.45 : 1 }}
      title={active ? `Showing only ${label} — click to clear` : `Highlight ${label}`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
        style={{ background: color }}
      />
      <span className="truncate flex-1">{label}</span>
      {count !== undefined ? (
        <span className="font-mono text-[10px] text-[color:var(--text-muted)]">
          {count}
        </span>
      ) : null}
    </button>
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
    <div className="card py-1 absolute left-0 right-0 top-full mt-2 z-40 max-h-[60vh] overflow-y-auto">
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

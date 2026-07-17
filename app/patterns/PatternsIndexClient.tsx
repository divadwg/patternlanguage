"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Pattern, Scale } from "@/lib/types";
import { colorForPattern, sourceNameForPattern } from "@/lib/palette";

const SCALES: { value: Scale | "all"; label: string }[] = [
  { value: "all", label: "All scales" },
  { value: "town", label: "Towns" },
  { value: "building", label: "Buildings" },
  { value: "construction", label: "Construction" },
];

export default function PatternsIndexClient({
  patterns,
}: {
  patterns: Pattern[];
}) {
  const [query, setQuery] = useState("");
  const [scale, setScale] = useState<Scale | "all">("all");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = patterns.filter((p) => {
      if (scale !== "all" && p.scale !== scale) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        String(p.number ?? "").includes(q)
      );
    });

    const buckets = new Map<
      string,
      { label: string; color: string; items: Pattern[] }
    >();
    for (const p of filtered) {
      const label = sourceNameForPattern(p) ?? "User-added";
      const existing = buckets.get(label);
      if (existing) existing.items.push(p);
      else buckets.set(label, { label, color: colorForPattern(p), items: [p] });
    }

    for (const b of buckets.values()) {
      b.items.sort((a, z) => {
        if (a.number !== null && z.number !== null) return a.number - z.number;
        if (a.number !== null) return -1;
        if (z.number !== null) return 1;
        return a.title.localeCompare(z.title);
      });
    }

    // Alexander first, then the rest by size.
    return Array.from(buckets.values()).sort((a, z) => {
      if (a.label === "Christopher Alexander") return -1;
      if (z.label === "Christopher Alexander") return 1;
      return z.items.length - a.items.length;
    });
  }, [patterns, query, scale]);

  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[color:var(--border)] sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="max-w-[900px] mx-auto px-8 py-5 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 !text-[color:var(--text-primary)] flex-shrink-0"
          >
            <span className="w-5 h-5 rounded-full bg-[color:var(--accent)] inline-block" />
            <span className="font-medium text-[14px]">A Pattern Language</span>
          </Link>
          <Link href="/" className="btn-secondary">
            ← Back to the graph
          </Link>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-8 py-12">
        <h1
          className="tracking-tight mb-2"
          style={{ fontSize: 40, letterSpacing: "-0.02em" }}
        >
          Pattern index
        </h1>
        <p className="text-[color:var(--text-secondary)] mb-8">
          All {patterns.length} patterns as a list — Alexander&apos;s originals
          first, then patterns drawn from other theorists.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-10">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, summary, or number…"
            className="input"
            style={{ maxWidth: 340 }}
          />
          <div className="flex items-center gap-1">
            {SCALES.map((s) => (
              <button
                key={s.value}
                onClick={() => setScale(s.value)}
                className={
                  scale === s.value
                    ? "px-3 py-1.5 rounded-md text-[13px] font-medium bg-[color:var(--text-primary)] text-white"
                    : "px-3 py-1.5 rounded-md text-[13px] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface)]"
                }
              >
                {s.label}
              </button>
            ))}
          </div>
          {query || scale !== "all" ? (
            <span className="font-mono text-[11px] text-[color:var(--text-muted)] ml-auto">
              {shown} shown
            </span>
          ) : null}
        </div>

        {groups.length === 0 ? (
          <p className="text-[color:var(--text-secondary)]">
            No patterns match.
          </p>
        ) : (
          groups.map((g) => (
            <section key={g.label} className="mb-12">
              <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-[color:var(--border)]">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ background: g.color }}
                />
                <h2 style={{ fontSize: 22 }}>{g.label}</h2>
                <span className="font-mono text-[11px] text-[color:var(--text-muted)]">
                  {g.items.length}
                </span>
              </div>
              <ul>
                {g.items.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/pattern/${p.slug}`}
                      className="group flex items-baseline gap-4 py-2.5 px-3 -mx-3 rounded-md hover:bg-[color:var(--surface)] !text-inherit"
                    >
                      <span className="font-mono text-[12px] text-[color:var(--text-muted)] w-8 flex-shrink-0 text-right">
                        {p.number ?? "•"}
                      </span>
                      <span className="flex-shrink-0 font-medium text-[15px] text-[color:var(--text-primary)] group-hover:text-[color:var(--accent-hover)]">
                        {p.title}
                      </span>
                      <span className="text-[13px] text-[color:var(--text-secondary)] truncate">
                        {p.summary}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[color:var(--text-muted)] ml-auto flex-shrink-0 hidden sm:inline">
                        {p.scale}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
    </div>
  );
}

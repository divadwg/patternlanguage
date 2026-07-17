"use client";

// Linear rendering of the pattern graph, after the plotgraph project's
// vertical-scroll story view: rows in sequence down the page, every
// connection drawn as an arc in the left gutter. Long arcs bow far out,
// so cross-scale "loops" back to much larger patterns read at a glance.
//
// Canonical patterns run in Alexander's order (1–253, large scale to
// small). Extracted/user patterns are interleaved after the canonical
// pattern nearest the median of their canonical connections, so each
// one sits in the region of the sequence it actually talks to.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Pattern, Connection } from "@/lib/types";
import { colorForPattern, sourceNameForPattern } from "@/lib/palette";

const ROW_H = 44;
const GUTTER_W = 240;
const TOP_PAD = 76; // clearance for the floating top bar

export default function LinearView({
  patterns,
  connections,
  selectedId,
  onSelect,
  searchQuery,
  highlightIds,
}: {
  patterns: Pattern[];
  connections: Connection[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  searchQuery: string;
  highlightIds: Set<string>;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { rows, indexOf, edges, adjacency } = useMemo(() => {
    const byId = new Map(patterns.map((p) => [p.id, p]));
    const valid = connections.filter(
      (c) => byId.has(c.from) && byId.has(c.to) && c.from !== c.to,
    );

    const adjacency = new Map<string, Set<string>>();
    for (const c of valid) {
      if (!adjacency.has(c.from)) adjacency.set(c.from, new Set());
      if (!adjacency.has(c.to)) adjacency.set(c.to, new Set());
      adjacency.get(c.from)!.add(c.to);
      adjacency.get(c.to)!.add(c.from);
    }

    const canonical = patterns
      .filter((p) => p.isCanonical && p.number !== null)
      .sort((a, z) => a.number! - z.number!);

    // Anchor each non-canonical pattern to the canonical number nearest
    // the median of its canonical neighbours.
    const buckets = new Map<number, Pattern[]>();
    const unanchored: Pattern[] = [];
    for (const p of patterns) {
      if (p.isCanonical) continue;
      const nums = Array.from(adjacency.get(p.id) ?? [])
        .map((id) => byId.get(id))
        .filter((n): n is Pattern => !!n && n.isCanonical && n.number !== null)
        .map((n) => n.number!)
        .sort((a, z) => a - z);
      if (nums.length === 0) {
        unanchored.push(p);
        continue;
      }
      const anchor = nums[Math.floor((nums.length - 1) / 2)];
      if (!buckets.has(anchor)) buckets.set(anchor, []);
      buckets.get(anchor)!.push(p);
    }

    const rows: Pattern[] = [];
    for (const c of canonical) {
      rows.push(c);
      const extra = buckets.get(c.number!);
      if (extra) {
        extra.sort((a, z) => a.title.localeCompare(z.title));
        rows.push(...extra);
      }
    }
    unanchored.sort((a, z) => a.title.localeCompare(z.title));
    rows.push(...unanchored);

    const indexOf = new Map(rows.map((p, i) => [p.id, i]));
    const edges = valid
      .map((c) => {
        const a = indexOf.get(c.from)!;
        const b = indexOf.get(c.to)!;
        return a < b ? { from: c.from, to: c.to, a, b } : { from: c.from, to: c.to, a: b, b: a };
      })
      .sort((x, y) => x.b - x.a - (y.b - y.a));

    return { rows, indexOf, edges, adjacency };
  }, [patterns, connections]);

  const maxSpan = useMemo(
    () => edges.reduce((m, e) => Math.max(m, e.b - e.a), 1),
    [edges],
  );

  const yAt = (idx: number) => idx * ROW_H + ROW_H / 2;
  const arcPath = (a: number, b: number) => {
    const y1 = yAt(a);
    const y2 = yAt(b);
    const depth = 14 + Math.sqrt((b - a) / maxSpan) * (GUTTER_W - 34);
    const cx = GUTTER_W - depth;
    return `M ${GUTTER_W} ${y1} C ${cx} ${y1} ${cx} ${y2} ${GUTTER_W} ${y2}`;
  };

  const svgH = rows.length * ROW_H;

  // Static layer: every connection, faint. Only recomputed when data changes.
  const staticArcs = useMemo(
    () => (
      <svg
        width={GUTTER_W}
        height={svgH}
        className="absolute left-0 top-0 pointer-events-none"
      >
        {edges.map((e, i) => (
          <path
            key={i}
            d={arcPath(e.a, e.b)}
            fill="none"
            stroke="rgba(0,0,0,0.055)"
            strokeWidth={1}
          />
        ))}
      </svg>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [edges, svgH],
  );

  const activeId = hoverId ?? selectedId;
  const activeEdges = activeId
    ? edges.filter((e) => e.from === activeId || e.to === activeId)
    : [];
  const neighborIds = activeId ? adjacency.get(activeId) ?? new Set<string>() : new Set<string>();

  // Bring an externally selected pattern (search, deep link) into view.
  useEffect(() => {
    if (!selectedId || !scrollRef.current) return;
    const idx = indexOf.get(selectedId);
    if (idx === undefined) return;
    const el = scrollRef.current;
    const y = yAt(idx) - el.clientHeight / 2;
    el.scrollTo({ top: Math.max(0, y + TOP_PAD), behavior: "smooth" });
  }, [selectedId, indexOf]);

  const anyHighlight = highlightIds.size > 0 || !!searchQuery.trim();

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 overflow-y-auto bg-white"
      onClick={() => onSelect(null)}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: 980, paddingTop: TOP_PAD, paddingBottom: 60 }}
      >
        <div className="relative" style={{ height: svgH }}>
          {staticArcs}
          {/* Active layer: arcs for the hovered / selected pattern. */}
          <svg
            width={GUTTER_W}
            height={svgH}
            className="absolute left-0 top-0 pointer-events-none"
          >
            {activeEdges.map((e, i) => (
              <g key={i}>
                <path
                  d={arcPath(e.a, e.b)}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={1.6}
                />
                <circle cx={GUTTER_W} cy={yAt(e.a)} r={3} fill="var(--accent)" />
                <circle cx={GUTTER_W} cy={yAt(e.b)} r={3} fill="var(--accent)" />
              </g>
            ))}
          </svg>

          <div className="absolute top-0 right-0" style={{ left: GUTTER_W }}>
            {rows.map((p, i) => {
              const isSel = p.id === selectedId;
              const isNeighbor = activeId !== null && neighborIds.has(p.id);
              const isHi = highlightIds.has(p.id);
              const dim = anyHighlight && !isHi && !isSel;
              return (
                <button
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(p.id);
                  }}
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className="w-full text-left flex items-center gap-3 px-3 border-b border-[color:var(--border)]"
                  style={{
                    height: ROW_H,
                    opacity: dim ? 0.3 : 1,
                    background: isSel
                      ? "var(--accent-light)"
                      : isNeighbor
                        ? "var(--surface)"
                        : isHi
                          ? "var(--accent-light)"
                          : "transparent",
                  }}
                >
                  <span className="font-mono text-[11px] text-[color:var(--text-muted)] w-8 text-right flex-shrink-0">
                    {p.number ?? "•"}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: colorForPattern(p) }}
                    title={sourceNameForPattern(p) ?? "User-added"}
                  />
                  <span className="font-medium text-[14px] text-[color:var(--text-primary)] flex-shrink-0">
                    {p.title}
                  </span>
                  <span className="text-[12px] text-[color:var(--text-secondary)] truncate hidden md:inline">
                    {p.summary}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[color:var(--text-muted)] ml-auto flex-shrink-0 hidden sm:inline">
                    {p.scale}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

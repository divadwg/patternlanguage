"use client";

import { useMemo } from "react";
import type { Pattern, Connection } from "@/lib/types";
import { colorForPattern, sourceNameForPattern } from "@/lib/palette";

function ConnectionRow({
  pattern,
  onSelect,
}: {
  pattern: Pattern;
  onSelect: () => void;
}) {
  const color = colorForPattern(pattern);
  const source = sourceNameForPattern(pattern);
  return (
    <button
      onClick={onSelect}
      className="flex items-start gap-2.5 text-left px-2.5 py-2 rounded-md hover:bg-[color:var(--surface)] transition cursor-pointer w-full group"
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0 mt-[7px]"
        style={{ background: color }}
      />
      <span className="flex-1 min-w-0">
        <span
          className="block text-[13px] text-[color:var(--text-primary)] group-hover:text-[color:var(--accent-hover)] leading-snug"
        >
          {pattern.number !== null ? `${pattern.number}. ` : ""}
          {pattern.title}
        </span>
        {source ? (
          <span
            className="block text-[11px] leading-tight mt-0.5"
            style={{ color }}
          >
            {source}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export default function PatternPanel({
  pattern,
  patterns,
  connections,
  onSelect,
  onClose,
}: {
  pattern: Pattern;
  patterns: Pattern[];
  connections: Connection[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const byId = useMemo(() => new Map(patterns.map((p) => [p.id, p])), [patterns]);

  const related = useMemo(() => {
    const ids = new Set<string>();
    for (const c of connections) {
      if (c.from === pattern.id) ids.add(c.to);
      else if (c.to === pattern.id) ids.add(c.from);
    }
    return Array.from(ids)
      .map((id) => byId.get(id))
      .filter((p): p is Pattern => !!p)
      .sort((a, b) => (a.number ?? 9999) - (b.number ?? 9999));
  }, [pattern.id, connections, byId]);

  const dotColor = colorForPattern(pattern);
  const sourceName = sourceNameForPattern(pattern);

  return (
    <aside
      className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white border-l border-[color:var(--border)] shadow-[0_0_40px_rgba(0,0,0,0.06)] z-20 overflow-y-auto"
      style={{ animation: "slideIn 240ms ease" }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div className="px-7 pt-6 pb-4 border-b border-[color:var(--border)] sticky top-0 bg-white z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: dotColor }}
            />
            <span
              className="font-mono text-[11px] text-[color:var(--text-muted)] uppercase tracking-wider"
            >
              {pattern.isCanonical
                ? `Pattern ${pattern.number} · ${pattern.scale}`
                : `User pattern · ${pattern.scale}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] text-lg leading-none -mt-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <h2
          className="text-[color:var(--text-primary)] tracking-tight"
          style={{ fontSize: 26, lineHeight: 1.2 }}
        >
          {pattern.title}
        </h2>
        {sourceName ? (
          <div
            className="text-[12px] mt-2 inline-flex items-center gap-1.5 font-medium"
            style={{ color: dotColor }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: dotColor }}
            />
            {sourceName}
          </div>
        ) : null}
      </div>

      <div className="px-7 py-6 space-y-6">
        <Section label="Summary">
          <p className="text-[color:var(--text-body)] leading-relaxed" style={{ fontSize: 15 }}>
            {pattern.summary}
          </p>
        </Section>

        {pattern.context ? (
          <Section label="Context">
            <p className="text-[color:var(--text-body)] leading-relaxed" style={{ fontSize: 15 }}>
              {pattern.context}
            </p>
          </Section>
        ) : null}

        {pattern.problem ? (
          <Section label="Problem">
            <p className="text-[color:var(--text-body)] leading-relaxed" style={{ fontSize: 15 }}>
              {pattern.problem}
            </p>
          </Section>
        ) : null}

        {pattern.solution ? (
          <Section label="Solution">
            <p className="text-[color:var(--text-body)] leading-relaxed" style={{ fontSize: 15 }}>
              {pattern.solution}
            </p>
          </Section>
        ) : null}

        <Section label={`Connections (${related.length})`}>
          {related.length === 0 ? (
            <p className="text-[13px] text-[color:var(--text-muted)]">No connections yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {related.map((p) => (
                <ConnectionRow key={p.id} pattern={p} onSelect={() => onSelect(p.id)} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

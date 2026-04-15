"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { QueueItem } from "@/lib/admin/storage";
import { thinkerById } from "@/lib/admin/thinkers";

type EditableCandidate = QueueItem["candidate"];

export default function QueueClient({
  initialItems,
}: {
  initialItems: QueueItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [edits, setEdits] = useState<Record<string, EditableCandidate>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [banner, setBanner] = useState<{
    tone: "ok" | "warn";
    text: string;
  } | null>(null);

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && selected.size < items.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  }

  function patch(id: string, patch: Partial<EditableCandidate>) {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? items.find((i) => i.id === id)!.candidate), ...patch },
    }));
  }

  async function approveOne(item: QueueItem) {
    setBusy(item.id);
    setBanner(null);
    try {
      const overrides = edits[item.id];
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, overrides }),
      });
      const body = await res.json();
      if (!res.ok) {
        setBanner({ tone: "warn", text: body.error ?? "Failed to approve" });
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    } finally {
      setBusy(null);
    }
  }

  async function rejectOne(item: QueueItem) {
    setBusy(item.id);
    try {
      const res = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    } finally {
      setBusy(null);
    }
  }

  async function bulk(action: "approve" | "reject", ids: string[]) {
    if (ids.length === 0) return;
    if (
      action === "reject" &&
      !confirm(`Reject ${ids.length} candidate${ids.length === 1 ? "" : "s"}?`)
    ) {
      return;
    }
    setBulkBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      const body = await res.json();
      if (!res.ok) {
        setBanner({ tone: "warn", text: body.error ?? "Bulk action failed" });
        return;
      }
      // Drop the processed ids, whether approved, rejected, or skipped —
      // skipped items (dup slug) are removed from the queue by the server too.
      const processed = new Set(ids);
      setItems((prev) => prev.filter((i) => !processed.has(i.id)));
      setSelected(new Set());

      if (action === "approve") {
        const skippedCount = Array.isArray(body.skipped) ? body.skipped.length : 0;
        const msg =
          skippedCount > 0
            ? `Approved ${body.approved}. Skipped ${skippedCount} (duplicate titles).`
            : `Approved ${body.approved} ${body.approved === 1 ? "pattern" : "patterns"}.`;
        setBanner({ tone: skippedCount > 0 ? "warn" : "ok", text: msg });
      } else {
        setBanner({
          tone: "ok",
          text: `Rejected ${body.rejected} ${body.rejected === 1 ? "candidate" : "candidates"}.`,
        });
      }
    } finally {
      setBulkBusy(false);
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
            <h1 className="tracking-tight">Review queue</h1>
            <div className="text-[13px] text-[color:var(--text-muted)] mt-1">
              {items.length} candidate{items.length === 1 ? "" : "s"}
              {selected.size > 0 ? ` · ${selected.size} selected` : ""}
            </div>
          </div>
          <Link href="/admin" className="btn-secondary">
            ← Admin
          </Link>
        </div>

        {banner ? (
          <div
            className="card p-4 mb-4 text-[13px]"
            style={{
              borderColor:
                banner.tone === "warn" ? "var(--warning)" : "var(--success)",
              color:
                banner.tone === "warn" ? "var(--accent-hover)" : "var(--success)",
            }}
          >
            {banner.text}
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-[color:var(--text-muted)] text-[14px] mb-4">
              Queue is empty.
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/admin/discover" className="btn-primary">
                Discover →
              </Link>
              <Link href="/admin/extract" className="btn-secondary">
                Paste source
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Bulk toolbar */}
            <div
              className="card px-5 py-3 mb-5 flex items-center gap-3 sticky top-3 z-20"
              style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(255,255,255,0.92)" }}
            >
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                />
                <span className="text-[13px] text-[color:var(--text-body)]">
                  {allSelected
                    ? "Deselect all"
                    : someSelected
                      ? `${selected.size} selected`
                      : "Select all"}
                </span>
              </label>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => bulk("reject", Array.from(selected))}
                  disabled={bulkBusy || selected.size === 0}
                  className="btn-secondary"
                >
                  Reject selected
                </button>
                <button
                  onClick={() => bulk("approve", Array.from(selected))}
                  disabled={bulkBusy || selected.size === 0}
                  className="btn-secondary"
                >
                  {bulkBusy ? "Working…" : `Approve selected (${selected.size})`}
                </button>
                <button
                  onClick={() => bulk("approve", items.map((i) => i.id))}
                  disabled={bulkBusy}
                  className="btn-primary"
                >
                  {bulkBusy ? "Working…" : `Approve all (${items.length})`}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {items.map((item) => (
                <QueueCard
                  key={item.id}
                  item={item}
                  edited={edits[item.id]}
                  selected={selected.has(item.id)}
                  busy={busy === item.id || bulkBusy}
                  onToggle={() => toggle(item.id)}
                  onPatch={(p) => patch(item.id, p)}
                  onApprove={() => approveOne(item)}
                  onReject={() => rejectOne(item)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QueueCard({
  item,
  edited,
  selected,
  busy,
  onToggle,
  onPatch,
  onApprove,
  onReject,
}: {
  item: QueueItem;
  edited?: EditableCandidate;
  selected: boolean;
  busy: boolean;
  onToggle: () => void;
  onPatch: (p: Partial<EditableCandidate>) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const c = edited ?? item.candidate;
  const sourceLabel = useMemo(() => {
    if (item.source.kind === "thinker" && item.source.thinkerId) {
      const t = thinkerById(item.source.thinkerId);
      return t ? `From ${t.name}` : `From thinker: ${item.source.thinkerId}`;
    }
    if (item.source.kind === "topic" && item.source.topic) {
      return `From topic: ${item.source.topic}`;
    }
    return item.source.kind;
  }, [item.source]);

  return (
    <div
      className="card p-6"
      style={
        selected
          ? { borderColor: "var(--accent)", boxShadow: "0 0 0 2px var(--accent-light)" }
          : undefined
      }
    >
      <div className="flex items-start gap-4 mb-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-2 flex-shrink-0 cursor-pointer"
          style={{ width: 16, height: 16 }}
        />
        <input
          value={c.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          className="input !border-0 !bg-transparent !p-0 flex-1"
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}
        />
        <select
          value={c.scale}
          onChange={(e) => onPatch({ scale: e.target.value as any })}
          className="input"
          style={{ width: 160, flexShrink: 0 }}
        >
          <option value="town">town</option>
          <option value="building">building</option>
          <option value="construction">construction</option>
        </select>
      </div>

      <Field
        label="Summary"
        value={c.summary}
        onChange={(v) => onPatch({ summary: v })}
      />
      <Field
        label="Context"
        value={c.context}
        onChange={(v) => onPatch({ context: v })}
        textarea
      />
      <Field
        label="Problem"
        value={c.problem}
        onChange={(v) => onPatch({ problem: v })}
        textarea
      />
      <Field
        label="Solution"
        value={c.solution}
        onChange={(v) => onPatch({ solution: v })}
        textarea
      />
      <Field
        label="Related patterns (comma-separated titles or slugs)"
        value={c.relatedSlugs.join(", ")}
        onChange={(v) =>
          onPatch({
            relatedSlugs: v
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
      />

      <div className="mt-4 pt-4 border-t border-[color:var(--border)] flex items-center justify-between">
        <div className="text-[11px] text-[color:var(--text-muted)] font-mono">
          {sourceLabel}
          {item.source.url ? (
            <>
              {" · "}
              <a
                href={item.source.url}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                source
              </a>
            </>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReject}
            disabled={busy}
            className="btn-secondary"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            disabled={busy}
            className="btn-primary"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-1">
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
          style={{ minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
        />
      )}
    </div>
  );
}

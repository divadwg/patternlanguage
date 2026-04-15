"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CrawlReport {
  added: number;
  perSource: Array<{
    id: string;
    name: string;
    added: number;
    skipped: number;
    error?: string;
  }>;
}

export default function CrawlerButton({
  sourceIds,
  compact = false,
}: {
  sourceIds?: string[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<CrawlReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setReport(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sourceIds ? { sourceIds } : {}),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setReport(body);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={running}
        className={compact ? "btn-secondary" : "btn-primary"}
      >
        {running ? "Crawling…" : "Run crawler"}
      </button>

      {running ? (
        <div className="text-[12px] text-[color:var(--text-muted)] mt-2">
          This may take 30 seconds to a few minutes — we're fetching pages,
          extracting article text, and asking Claude for pattern candidates.
          Don't close this tab.
        </div>
      ) : null}

      {error ? (
        <div className="text-[13px] text-[color:var(--danger)] mt-3">
          {error}
        </div>
      ) : null}

      {report ? (
        <div className="mt-4 card p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">
            Crawl report
          </div>
          <div className="text-[14px] text-[color:var(--text-primary)] mb-3">
            Added{" "}
            <strong>
              {report.added} candidate{report.added === 1 ? "" : "s"}
            </strong>{" "}
            to the review queue.
          </div>
          <ul className="text-[12px] space-y-1">
            {report.perSource.map((s) => (
              <li
                key={s.id}
                className="flex items-baseline justify-between gap-4 text-[color:var(--text-body)]"
              >
                <span>{s.name}</span>
                <span className="font-mono text-[color:var(--text-muted)]">
                  {s.error
                    ? `error: ${s.error}`
                    : `+${s.added}${s.skipped ? ` (skipped ${s.skipped})` : ""}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

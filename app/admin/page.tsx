import Link from "next/link";
import { requireDev } from "@/lib/admin/guard";
import { readQueue, readUserPatterns, readSources } from "@/lib/admin/storage";
import CrawlerButton from "./CrawlerButton";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  requireDev();
  const [queue, userPatterns, sources] = await Promise.all([
    readQueue(),
    readUserPatterns(),
    readSources(),
  ]);

  return (
    <div className="min-h-screen bg-[color:var(--surface)]">
      <div className="max-w-[900px] mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-1">
              Local admin
            </div>
            <h1 className="tracking-tight">Pattern Studio</h1>
          </div>
          <Link href="/" className="btn-secondary">
            ← Back to graph
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <AdminCard
            href="/admin/discover"
            label="Discover"
            count={null}
            description="Ask Claude to research a topic (web search) or extract from a canonical thinker (Jacobs, Gehl, Lynch…). No scraping required."
          />
          <AdminCard
            href="/admin/extract"
            label="Extract from source"
            count={null}
            description="Paste text or a URL. Claude reads it and drafts pattern candidates for your review."
          />
          <AdminCard
            href="/admin/queue"
            label="Review queue"
            count={queue.length}
            description="Pending pattern candidates — approve or reject each."
            highlight={queue.length > 0}
          />
          <AdminCard
            href="/admin/sources"
            label="Sources"
            count={sources.filter((s) => s.enabled).length}
            countLabel="enabled"
            description="Manage the list of websites the crawler pulls from."
          />
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[color:var(--text-primary)]">Run crawler</h3>
            </div>
            <p className="text-[13px] text-[color:var(--text-body)] leading-relaxed mb-4">
              Fetch fresh articles from every enabled source and let Claude
              draft pattern candidates. Also available on the command line as{" "}
              <code className="font-mono text-[12px] bg-[color:var(--surface-raised)] px-1.5 py-0.5 rounded">
                npm run crawl
              </code>
              .
            </p>
            <CrawlerButton />
          </div>
        </div>

        <div className="card p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-3">
            State
          </div>
          <div className="grid grid-cols-3 gap-4 text-[14px]">
            <Stat label="Canonical patterns" value="253" />
            <Stat label="User patterns" value={userPatterns.length.toString()} />
            <Stat label="In review queue" value={queue.length.toString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminCard({
  href,
  label,
  description,
  count,
  countLabel = "pending",
  highlight = false,
  disabled = false,
}: {
  href: string;
  label: string;
  description: React.ReactNode;
  count: number | null;
  countLabel?: string;
  highlight?: boolean;
  disabled?: boolean;
}) {
  const content = (
    <div
      className={`card p-6 h-full transition ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-[color:var(--accent)] cursor-pointer"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[color:var(--text-primary)]">{label}</h3>
        {count !== null ? (
          <span
            className={
              highlight
                ? "tag"
                : "font-mono text-[11px] text-[color:var(--text-muted)]"
            }
          >
            {count} {countLabel}
          </span>
        ) : null}
      </div>
      <p className="text-[13px] text-[color:var(--text-body)] leading-relaxed">
        {description}
      </p>
    </div>
  );
  if (disabled) return content;
  return <Link href={href}>{content}</Link>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-1">
        {label}
      </div>
      <div className="text-[22px] text-[color:var(--text-primary)] tracking-tight">
        {value}
      </div>
    </div>
  );
}

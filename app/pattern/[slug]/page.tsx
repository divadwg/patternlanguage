import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPatterns, getAllConnections } from "@/lib/data";
import { colorForPattern, sourceNameForPattern } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default async function PatternPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [patterns, connections] = await Promise.all([
    getAllPatterns(),
    getAllConnections(),
  ]);
  const pattern = patterns.find((p) => p.slug === slug);
  if (!pattern) notFound();

  const byId = new Map(patterns.map((p) => [p.id, p]));
  const related = connections
    .filter((c) => c.from === pattern.id || c.to === pattern.id)
    .map((c) => byId.get(c.from === pattern.id ? c.to : c.from))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .sort((a, b) => (a.number ?? 9999) - (b.number ?? 9999));

  const dot = colorForPattern(pattern);
  const sourceName = sourceNameForPattern(pattern);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[color:var(--border)]">
        <div className="max-w-[760px] mx-auto px-8 py-5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 !text-[color:var(--text-primary)]"
          >
            <span className="w-5 h-5 rounded-full bg-[color:var(--accent)] inline-block" />
            <span className="font-medium text-[14px]">A Pattern Language</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/patterns" className="btn-secondary">
              Index
            </Link>
            <Link href={`/?p=${pattern.id}`} className="btn-secondary">
              Open in graph →
            </Link>
          </div>
        </div>
      </header>

      <article className="max-w-[760px] mx-auto px-8 py-16">
        <div className="flex items-center gap-3 mb-5">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: dot }}
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
            {pattern.isCanonical
              ? `Pattern ${pattern.number} · ${pattern.scale}`
              : `User pattern · ${pattern.scale}`}
          </span>
        </div>

        <h1
          className="tracking-tight text-[color:var(--text-primary)] mb-3"
          style={{ fontSize: 48, lineHeight: 1.1, letterSpacing: "-0.03em" }}
        >
          {pattern.title}
        </h1>

        {sourceName ? (
          <div
            className="text-[13px] mb-8 inline-flex items-center gap-2 font-medium"
            style={{ color: dot }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: dot }}
            />
            {sourceName}
          </div>
        ) : (
          <div className="mb-8" />
        )}

        <p
          className="text-[color:var(--text-body)] mb-10"
          style={{ fontSize: 19, lineHeight: 1.55 }}
        >
          {pattern.summary}
        </p>

        {pattern.context ? <Section title="Context" body={pattern.context} /> : null}
        {pattern.problem ? <Section title="Problem" body={pattern.problem} /> : null}
        {pattern.solution ? <Section title="Solution" body={pattern.solution} /> : null}

        {related.length > 0 ? (
          <div className="mt-12 pt-8 border-t border-[color:var(--border)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-3">
              Connections ({related.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/pattern/${p.slug}`}
                  className="tag !bg-[color:var(--surface)] !text-[color:var(--text-body)] hover:!bg-[color:var(--accent-light)] hover:!text-[color:var(--accent-hover)] !normal-case !tracking-normal"
                  style={{ fontSize: 13, padding: "4px 10px" }}
                >
                  {p.number !== null ? `${p.number}. ` : ""}
                  {p.title}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)] mb-2">
        {title}
      </div>
      <p
        className="text-[color:var(--text-body)]"
        style={{ fontSize: 16, lineHeight: 1.6 }}
      >
        {body}
      </p>
    </div>
  );
}

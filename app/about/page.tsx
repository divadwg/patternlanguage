import Link from "next/link";
import { THINKERS } from "@/lib/admin/thinkers";

export const metadata = {
  title: "About — A Pattern Language",
  description:
    "What Christopher Alexander's pattern language is, and how this project extends it with patterns drawn from other urban theorists.",
};

export default function AboutPage() {
  const thinkers = THINKERS.filter((t) => !t.canonical);

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
          <Link href="/" className="btn-secondary">
            ← Back to the graph
          </Link>
        </div>
      </header>

      <article className="max-w-[760px] mx-auto px-8 py-16">
        <h1
          className="tracking-tight mb-8"
          style={{ fontSize: 44, lineHeight: 1.1, letterSpacing: "-0.02em" }}
        >
          What is this?
        </h1>

        <Section title="Alexander's pattern language">
          <p>
            In 1977, the architect Christopher Alexander and his collaborators
            Sara Ishikawa and Murray Silverstein published{" "}
            <em>A Pattern Language</em>. It contains 253 numbered patterns for
            shaping the built world, from the scale of a whole region (
            <em>Independent Regions</em>, <em>City Country Fingers</em>) down
            through towns and buildings to the smallest construction details (
            <em>Window Place</em>, <em>Warm Colors</em>).
          </p>
          <p>
            Each pattern has the same form: a recurring problem people face in
            their environment, an analysis of the forces behind it, and the
            physical shape that resolves those forces. A pattern is never used
            alone — each one names the larger patterns it helps complete and
            the smaller patterns needed to complete it. Alexander called the
            whole web a <em>language</em> because, like words in a grammar,
            patterns combine to say things no single pattern can.
          </p>
          <p>
            The book presents the language as a numbered sequence, but the
            connections between patterns were always its real structure. This
            site treats them that way: every pattern is a node, every
            cross-reference an edge, and you read the language by walking the
            graph.
          </p>
        </Section>

        <Section title="Beyond the original 253">
          <p>
            Alexander was not the only person to look closely at why some
            places work and others fail. Jane Jacobs watched sidewalks in
            Greenwich Village, William Whyte pointed time-lapse cameras at
            plazas, Jan Gehl counted people lingering in Copenhagen streets,
            Kevin Lynch asked residents to draw their cities from memory. They
            wrote in different forms — polemics, field studies, histories —
            but they kept arriving at conclusions with the same shape as
            Alexander's patterns: a context, a tension, and a form that
            resolves it.
          </p>
          <p>
            This project makes that shared shape explicit. Using a language
            model, we extract candidate patterns from the writings of these
            other theorists, restating each observation in Alexander's format:
            a short imperative title, the context in which it applies, the
            problem, and the solution. Each candidate also proposes links to
            related patterns — preferring Alexander's canonical titles where
            they apply — so a pattern distilled from Jacobs or Gehl gets wired
            into the same web as the original 253. Extracted candidates are
            reviewed by hand before they join the graph.
          </p>
          <p>
            The result is one map rather than a shelf of separate books. Where
            two thinkers describe the same thing in different words, their
            patterns sit next to each other and connect; where one thinker saw
            something nobody else wrote down, the graph grows a new region.
            Nodes are colored by source, so you can see at a glance where each
            idea entered the language.
          </p>
        </Section>

        <Section title="The theorists">
          <p>Patterns are currently drawn, or being drawn, from:</p>
          <ul className="space-y-3 mt-4">
            {thinkers.map((t) => (
              <li key={t.id}>
                <span className="text-[color:var(--text-primary)] font-medium">
                  {t.name}
                </span>
                {t.years ? (
                  <span className="text-[color:var(--text-secondary)]">
                    {" "}
                    ({t.years})
                  </span>
                ) : null}
                <span className="text-[color:var(--text-secondary)]">
                  {" "}
                  — {t.works.slice(0, 2).join("; ")}.
                </span>{" "}
                {t.blurb}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="How to use the graph">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Pan and zoom</strong> — drag to move, scroll to zoom.
              Pattern names appear once you are zoomed in.
            </li>
            <li>
              <strong>Click a node</strong> to read the pattern: its context,
              problem, solution, and the patterns it connects to.
            </li>
            <li>
              <strong>Search</strong> by title, number, or summary from the
              bar at the top; matching patterns light up in the graph.
            </li>
            <li>
              <strong>Node size</strong> reflects how connected a pattern is;{" "}
              <strong>color</strong> shows its source — Alexander's originals,
              each theorist, and user-added patterns each get their own color,
              listed in the legend.
            </li>
          </ul>
        </Section>

        <footer className="mt-16 pt-8 border-t border-[color:var(--border)] text-[13px] text-[color:var(--text-secondary)]">
          After Alexander, Ishikawa &amp; Silverstein (1977). Pattern summaries
          and extractions our own; errors ours, not the authors&apos;.
        </footer>
      </article>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-4" style={{ fontSize: 26 }}>
        {title}
      </h2>
      <div className="space-y-4 text-[color:var(--text-body)] text-[15px] leading-[1.7]">
        {children}
      </div>
    </section>
  );
}

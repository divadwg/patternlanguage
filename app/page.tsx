import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Nav */}
      <header className="border-b border-[color:var(--border)]">
        <div className="max-w-[1100px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[color:var(--accent)]" />
            <span
              className="font-medium tracking-tight text-[color:var(--text-primary)]"
              style={{ fontSize: 15 }}
            >
              A Pattern Language
            </span>
          </div>
          <nav className="flex items-center gap-6 text-[13px] text-[color:var(--text-secondary)]">
            <Link href="/explore" className="hover:text-[color:var(--text-primary)] !text-[color:var(--text-secondary)] hover:!text-[color:var(--text-primary)]">
              Explore
            </Link>
            <a
              href="https://en.wikipedia.org/wiki/A_Pattern_Language"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[color:var(--text-primary)] !text-[color:var(--text-secondary)] hover:!text-[color:var(--text-primary)]"
            >
              About
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-[1100px] mx-auto px-8 pt-24 pb-20">
          <div className="max-w-2xl">
            <span className="tag mb-6">Est. 1977 — rewritten 2026</span>
            <h1
              className="tracking-tight text-[color:var(--text-primary)] mb-6"
              style={{ fontSize: 56, lineHeight: 1.05, letterSpacing: "-0.03em" }}
            >
              A language for building things that feel alive.
            </h1>
            <p
              className="text-[color:var(--text-body)] mb-10"
              style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 640 }}
            >
              In 1977, Christopher Alexander and his collaborators published{" "}
              <em>A Pattern Language</em> — 253 interlocking patterns for
              shaping towns, buildings, and rooms. Each pattern names a
              recurring problem and the form of its solution, and each one
              points to the larger and smaller patterns that complete it.
            </p>
            <p
              className="text-[color:var(--text-body)] mb-10"
              style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 640 }}
            >
              We think the language was never meant to stop at 253, and was
              never really a hierarchy. This is an attempt to free it — as a
              living graph you can walk through, and extend.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/explore" className="btn-primary">
                Enter the graph →
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary !text-[color:var(--text-body)]"
              >
                How it works
              </a>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-t border-[color:var(--border)] bg-[color:var(--surface)]"
        >
          <div className="max-w-[1100px] mx-auto px-8 py-20 grid md:grid-cols-3 gap-8">
            <Card
              num="01"
              title="Explore"
              body="Every one of the original 253 patterns is a node in a force-directed graph. Edges are the connections Alexander drew between them — click any node to read the pattern."
            />
            <Card
              num="02"
              title="Compose"
              body="A pattern is never used alone. Follow the connections outward to find the larger patterns a design needs, and inward to the smaller ones that fill it in."
            />
            <Card
              num="03"
              title="Extend"
              body="The world has changed. Add your own patterns — for software, for systems, for communities — and wire them into the existing language."
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[color:var(--border)]">
          <div className="max-w-[1100px] mx-auto px-8 py-8 flex items-center justify-between text-[13px] text-[color:var(--text-muted)]">
            <span>
              After Alexander, Ishikawa &amp; Silverstein (1977). Summaries our
              own.
            </span>
            <span className="font-mono">v0.1</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Card({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-6">
      <div className="font-mono text-[11px] text-[color:var(--text-muted)] mb-3">
        {num}
      </div>
      <h3 className="mb-3 text-[color:var(--text-primary)]">{title}</h3>
      <p
        className="text-[color:var(--text-body)]"
        style={{ fontSize: 14, lineHeight: 1.6 }}
      >
        {body}
      </p>
    </div>
  );
}

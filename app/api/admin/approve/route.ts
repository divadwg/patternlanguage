import { NextResponse } from "next/server";
import { requireDev } from "@/lib/admin/guard";
import {
  readQueue,
  writeQueue,
  readUserPatterns,
  writeUserPatterns,
  readUserConnections,
  writeUserConnections,
  userSlug,
  type UserPattern,
} from "@/lib/admin/storage";
import { PATTERNS } from "@/lib/seed/patterns";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const canonicalByLowerTitle = new Map(
  PATTERNS.map((p) => [p.title.toLowerCase(), p.slug]),
);

export async function POST(req: Request) {
  requireDev();
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    // caller may edit candidate fields before approving
    overrides?: Partial<{
      title: string;
      scale: "town" | "building" | "construction";
      summary: string;
      context: string;
      problem: string;
      solution: string;
      relatedSlugs: string[];
    }>;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const queue = await readQueue();
  const idx = queue.findIndex((q) => q.id === body.id);
  if (idx < 0) {
    return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
  }
  const item = queue[idx];
  const c = { ...item.candidate, ...(body.overrides ?? {}) };

  // Resolve related titles/slugs → valid pattern slugs (canonical or user).
  const userPatterns = await readUserPatterns();
  const userByLowerTitle = new Map(
    userPatterns.map((u) => [u.title.toLowerCase(), u.slug]),
  );
  const allUserSlugs = new Set(userPatterns.map((u) => u.slug));
  const allCanonicalSlugs = new Set(PATTERNS.map((p) => p.slug));

  const resolvedRelated: string[] = [];
  for (const ref of c.relatedSlugs ?? []) {
    const s = ref.trim();
    if (!s) continue;
    if (allCanonicalSlugs.has(s) || allUserSlugs.has(s)) {
      resolvedRelated.push(s);
      continue;
    }
    const byTitle =
      canonicalByLowerTitle.get(s.toLowerCase()) ??
      userByLowerTitle.get(s.toLowerCase());
    if (byTitle) resolvedRelated.push(byTitle);
  }

  const slug = userSlug(c.title);
  if (allUserSlugs.has(slug) || allCanonicalSlugs.has(slug)) {
    return NextResponse.json(
      { error: `A pattern with slug "${slug}" already exists.` },
      { status: 409 },
    );
  }

  const newPattern: UserPattern = {
    id: randomUUID(),
    slug,
    title: c.title,
    scale: c.scale,
    summary: c.summary,
    context: c.context,
    problem: c.problem,
    solution: c.solution,
    sourceUrl: item.source.url,
    thinkerId: item.source.thinkerId,
    topic: item.source.topic,
    createdAt: new Date().toISOString(),
  };

  await writeUserPatterns([...userPatterns, newPattern]);

  if (resolvedRelated.length > 0) {
    const existingConnections = await readUserConnections();
    const seen = new Set(
      existingConnections.map((c) =>
        c.from < c.to ? `${c.from}|${c.to}` : `${c.to}|${c.from}`,
      ),
    );
    const additions = resolvedRelated
      .map((to) => ({ from: slug, to, kind: "related" as const }))
      .filter((c) => {
        const key = c.from < c.to ? `${c.from}|${c.to}` : `${c.to}|${c.from}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    await writeUserConnections([...existingConnections, ...additions]);
  }

  // Remove from queue.
  queue.splice(idx, 1);
  await writeQueue(queue);

  return NextResponse.json({ ok: true, slug, related: resolvedRelated });
}

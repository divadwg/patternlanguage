import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireDev } from "@/lib/admin/guard";
import {
  readQueue,
  writeQueue,
  readUserPatterns,
  writeUserPatterns,
  readUserConnections,
  writeUserConnections,
  recordRejected,
  userSlug,
  type UserPattern,
} from "@/lib/admin/storage";
import { PATTERNS } from "@/lib/seed/patterns";

export const runtime = "nodejs";
export const maxDuration = 60;

const canonicalByLowerTitle = new Map(
  PATTERNS.map((p) => [p.title.toLowerCase(), p.slug]),
);

/**
 * Bulk approve or reject queue items by id. Returns per-id outcomes so the
 * client can tell the user how many were actually committed (e.g., a dup
 * title is skipped).
 */
export async function POST(req: Request) {
  requireDev();
  const body = (await req.json().catch(() => ({}))) as {
    action?: "approve" | "reject";
    ids?: string[];
  };

  if (!body.action || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json(
      { error: "Body must be { action: 'approve' | 'reject', ids: string[] }" },
      { status: 400 },
    );
  }

  const idSet = new Set(body.ids);
  const queue = await readQueue();
  const targets = queue.filter((q) => idSet.has(q.id));
  const remaining = queue.filter((q) => !idSet.has(q.id));

  if (body.action === "reject") {
    await recordRejected(targets);
    await writeQueue(remaining);
    return NextResponse.json({ approved: 0, rejected: targets.length });
  }

  // Approve path — resolve related references, skip duplicates.
  const userPatterns = await readUserPatterns();
  const userConnections = await readUserConnections();

  const userByLowerTitle = new Map(
    userPatterns.map((u) => [u.title.toLowerCase(), u.slug]),
  );
  const allUserSlugs = new Set(userPatterns.map((u) => u.slug));
  const allCanonicalSlugs = new Set(PATTERNS.map((p) => p.slug));

  const edgeKey = (a: string, b: string) =>
    a < b ? `${a}|${b}` : `${b}|${a}`;
  const seenEdges = new Set(
    userConnections.map((c) => edgeKey(c.from, c.to)),
  );

  const approvedSlugs: string[] = [];
  const skipped: { id: string; reason: string }[] = [];
  const now = new Date().toISOString();

  for (const item of targets) {
    const c = item.candidate;
    const slug = userSlug(c.title);

    if (allUserSlugs.has(slug) || allCanonicalSlugs.has(slug)) {
      skipped.push({ id: item.id, reason: `duplicate slug "${slug}"` });
      continue;
    }

    // Resolve related refs (title OR slug) against canonical + user patterns.
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
      createdAt: now,
    };

    userPatterns.push(newPattern);
    allUserSlugs.add(slug);
    userByLowerTitle.set(c.title.toLowerCase(), slug);
    approvedSlugs.push(slug);

    for (const to of resolvedRelated) {
      const key = edgeKey(slug, to);
      if (seenEdges.has(key)) continue;
      seenEdges.add(key);
      userConnections.push({ from: slug, to, kind: "related" });
    }
  }

  // Persist — write queue without any targets (dupes drop too, since Claude
  // doesn't need to keep suggesting them).
  await writeUserPatterns(userPatterns);
  await writeUserConnections(userConnections);
  await writeQueue(remaining);

  return NextResponse.json({
    approved: approvedSlugs.length,
    rejected: 0,
    skipped,
  });
}

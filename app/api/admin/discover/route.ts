import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireDev } from "@/lib/admin/guard";
import {
  discoverPatternsForTopic,
  extractPatternsFromThinker,
} from "@/lib/admin/extractor";
import { thinkerById } from "@/lib/admin/thinkers";
import {
  addToQueue,
  readQueue,
  readUserPatterns,
  type QueueItem,
} from "@/lib/admin/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Collect all titles already attributed to this thinker (in the pending queue
 * AND in already-approved user-patterns.json) so the next extraction pass can
 * exclude them and Claude has to find additional patterns.
 */
async function titlesSeenForThinker(thinkerId: string): Promise<string[]> {
  const [queue, userPatterns] = await Promise.all([
    readQueue(),
    readUserPatterns(),
  ]);
  const titles = new Set<string>();
  for (const q of queue) {
    if (q.source.thinkerId === thinkerId) titles.add(q.candidate.title);
  }
  for (const p of userPatterns) {
    if (p.thinkerId === thinkerId) titles.add(p.title);
  }
  return Array.from(titles);
}

export async function POST(req: Request) {
  requireDev();
  const body = (await req.json().catch(() => ({}))) as {
    topic?: string;
    thinkerId?: string;
  };

  try {
    if (body.thinkerId) {
      const t = thinkerById(body.thinkerId);
      if (!t) {
        return NextResponse.json({ error: "Unknown thinker" }, { status: 404 });
      }
      if (t.canonical) {
        return NextResponse.json(
          { error: `${t.name} is already seeded — their patterns are in the graph.` },
          { status: 400 },
        );
      }
      const excludeTitles = await titlesSeenForThinker(t.id);
      const candidates = await extractPatternsFromThinker(t, excludeTitles);
      const now = new Date().toISOString();
      const items: QueueItem[] = candidates.map((c) => ({
        id: randomUUID(),
        candidate: {
          title: c.title,
          scale: c.scale,
          summary: c.summary,
          context: c.context,
          problem: c.problem,
          solution: c.solution,
          relatedSlugs: c.relatedTitles,
        },
        source: {
          kind: "thinker",
          thinkerId: t.id,
          snippet: `Thinker: ${t.name}`,
        },
        createdAt: now,
      }));
      await addToQueue(items);
      return NextResponse.json({
        count: items.length,
        seenCount: excludeTitles.length + items.length,
        alreadySeen: excludeTitles.length,
      });
    }

    if (body.topic && body.topic.trim().length >= 3) {
      const topicText = body.topic.trim();
      const candidates = await discoverPatternsForTopic(topicText);
      const now = new Date().toISOString();
      const items: QueueItem[] = candidates.map((c) => ({
        id: randomUUID(),
        candidate: {
          title: c.title,
          scale: c.scale,
          summary: c.summary,
          context: c.context,
          problem: c.problem,
          solution: c.solution,
          relatedSlugs: c.relatedTitles,
        },
        source: {
          kind: "topic",
          topic: topicText,
          snippet: `Topic: ${topicText}`,
        },
        createdAt: now,
      }));
      await addToQueue(items);
      return NextResponse.json({ count: items.length });
    }

    return NextResponse.json(
      { error: "Provide either `topic` or `thinkerId`." },
      { status: 400 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

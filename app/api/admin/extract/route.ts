import { NextResponse } from "next/server";
import { requireDev } from "@/lib/admin/guard";
import { extractPatternsFromText, fetchArticleText } from "@/lib/admin/extractor";
import { addToQueue, type QueueItem } from "@/lib/admin/storage";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  requireDev();

  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    url?: string;
  };
  const { text, url } = body;

  if (!text && !url) {
    return NextResponse.json(
      { error: "Provide either `text` or `url`." },
      { status: 400 },
    );
  }

  let sourceText = text?.trim() ?? "";
  let sourceUrl = url?.trim() || undefined;
  let fetchedTitle: string | null = null;

  if (!sourceText && sourceUrl) {
    try {
      const article = await fetchArticleText(sourceUrl);
      sourceText = article.text;
      fetchedTitle = article.title;
    } catch (err: any) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${err?.message ?? String(err)}` },
        { status: 400 },
      );
    }
  }

  if (sourceText.length < 100) {
    return NextResponse.json(
      { error: "Source text is too short to extract patterns from." },
      { status: 400 },
    );
  }

  let candidates;
  try {
    candidates = await extractPatternsFromText(sourceText, sourceUrl);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Extraction failed: ${err?.message ?? String(err)}` },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();
  const snippet =
    sourceText.length > 300 ? sourceText.slice(0, 300) + "…" : sourceText;

  const items: QueueItem[] = candidates.map((c) => ({
    id: randomUUID(),
    candidate: {
      title: c.title,
      scale: c.scale,
      summary: c.summary,
      context: c.context,
      problem: c.problem,
      solution: c.solution,
      // Stored as titles here; the approver resolves them to slugs when accepting.
      relatedSlugs: c.relatedTitles,
    },
    source: {
      kind: sourceUrl ? "url" : "text",
      url: sourceUrl,
      snippet,
    },
    createdAt: now,
  }));

  await addToQueue(items);

  return NextResponse.json({
    count: items.length,
    fetchedTitle,
    items,
  });
}

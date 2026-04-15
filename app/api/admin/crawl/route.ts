import { NextResponse } from "next/server";
import { requireDev } from "@/lib/admin/guard";
import { runCrawler } from "@/lib/admin/crawler";

export const runtime = "nodejs";
// Crawling is network- and Claude-bound; give it headroom.
export const maxDuration = 300;

export async function POST(req: Request) {
  requireDev();
  const body = (await req.json().catch(() => ({}))) as {
    sourceIds?: string[];
    maxArticlesPerSource?: number;
  };

  try {
    const report = await runCrawler({
      sourceIds: body.sourceIds,
      maxArticlesPerSource: body.maxArticlesPerSource,
    });
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

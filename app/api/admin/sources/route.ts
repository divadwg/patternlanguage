import { NextResponse } from "next/server";
import { requireDev } from "@/lib/admin/guard";
import { readSources, writeSources, type Source } from "@/lib/admin/storage";

export const runtime = "nodejs";

export async function GET() {
  requireDev();
  const sources = await readSources();
  return NextResponse.json({ sources });
}

export async function PUT(req: Request) {
  requireDev();
  const body = (await req.json().catch(() => ({}))) as { sources?: Source[] };
  if (!Array.isArray(body.sources)) {
    return NextResponse.json(
      { error: "Body must be { sources: [...] }" },
      { status: 400 },
    );
  }
  await writeSources(body.sources);
  return NextResponse.json({ ok: true, count: body.sources.length });
}

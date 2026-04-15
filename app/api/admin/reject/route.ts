import { NextResponse } from "next/server";
import { requireDev } from "@/lib/admin/guard";
import { readQueue, writeQueue } from "@/lib/admin/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  requireDev();
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const queue = await readQueue();
  const next = queue.filter((q) => q.id !== body.id);
  if (next.length === queue.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await writeQueue(next);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { requireDev } from "@/lib/admin/guard";
import { readQueue, writeQueue, recordRejected } from "@/lib/admin/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  requireDev();
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const queue = await readQueue();
  const target = queue.find((q) => q.id === body.id);
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await recordRejected([target]);
  await writeQueue(queue.filter((q) => q.id !== body.id));
  return NextResponse.json({ ok: true });
}

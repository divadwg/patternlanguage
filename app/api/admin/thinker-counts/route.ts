import { NextResponse } from "next/server";
import { requireDev } from "@/lib/admin/guard";
import { readQueue, readUserPatterns } from "@/lib/admin/storage";

export const runtime = "nodejs";

/**
 * Per-thinker counts of how many pattern candidates we've already extracted
 * (both pending in the queue and already-approved). Drives the "N already"
 * hint on the Discover UI.
 */
export async function GET() {
  requireDev();
  const [queue, userPatterns] = await Promise.all([
    readQueue(),
    readUserPatterns(),
  ]);
  const counts: Record<string, { pending: number; approved: number }> = {};
  const bump = (id: string, field: "pending" | "approved") => {
    counts[id] = counts[id] ?? { pending: 0, approved: 0 };
    counts[id][field] += 1;
  };
  for (const q of queue) {
    if (q.source.thinkerId) bump(q.source.thinkerId, "pending");
  }
  for (const p of userPatterns) {
    if (p.thinkerId) bump(p.thinkerId, "approved");
  }
  return NextResponse.json({ counts });
}

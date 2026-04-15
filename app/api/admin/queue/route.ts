import { NextResponse } from "next/server";
import { requireDev } from "@/lib/admin/guard";
import { readQueue } from "@/lib/admin/storage";

export const runtime = "nodejs";

export async function GET() {
  requireDev();
  const items = await readQueue();
  return NextResponse.json({ items });
}

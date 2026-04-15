import { requireDev } from "@/lib/admin/guard";
import { readQueue } from "@/lib/admin/storage";
import QueueClient from "./QueueClient";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  requireDev();
  const items = await readQueue();
  return <QueueClient initialItems={items} />;
}

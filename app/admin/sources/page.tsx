import { requireDev } from "@/lib/admin/guard";
import { readSources } from "@/lib/admin/storage";
import SourcesClient from "./SourcesClient";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  requireDev();
  const sources = await readSources();
  return <SourcesClient initialSources={sources} />;
}

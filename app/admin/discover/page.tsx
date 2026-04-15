import { requireDev } from "@/lib/admin/guard";
import { THINKERS } from "@/lib/admin/thinkers";
import DiscoverClient from "./DiscoverClient";

export const dynamic = "force-dynamic";

export default function DiscoverPage() {
  requireDev();
  return <DiscoverClient thinkers={THINKERS} />;
}

import { requireDev } from "@/lib/admin/guard";
import ExtractClient from "./ExtractClient";

export const dynamic = "force-dynamic";

export default function ExtractPage() {
  requireDev();
  return <ExtractClient />;
}

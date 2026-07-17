import { getAllPatterns } from "@/lib/data";
import PatternsIndexClient from "./PatternsIndexClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pattern Index — A Pattern Language",
  description:
    "Browse every pattern in the language as a list, grouped by source and filterable by scale.",
};

export default async function PatternsIndexPage() {
  const patterns = await getAllPatterns();
  return <PatternsIndexClient patterns={patterns} />;
}

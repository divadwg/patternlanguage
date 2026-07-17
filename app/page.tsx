import { getAllPatterns, getAllConnections } from "@/lib/data";
import ExploreClient from "./ExploreClient";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const [patterns, connections, { p }] = await Promise.all([
    getAllPatterns(),
    getAllConnections(),
    searchParams,
  ]);
  const initialSelectedId =
    p && patterns.some((pat) => pat.id === p) ? p : null;
  return (
    <ExploreClient
      initialPatterns={patterns}
      initialConnections={connections}
      initialSelectedId={initialSelectedId}
    />
  );
}

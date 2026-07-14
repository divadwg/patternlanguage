import { getAllPatterns, getAllConnections } from "@/lib/data";
import ExploreClient from "./ExploreClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [patterns, connections] = await Promise.all([
    getAllPatterns(),
    getAllConnections(),
  ]);
  return <ExploreClient initialPatterns={patterns} initialConnections={connections} />;
}

import type { Metadata } from "next";
import { getAllPatterns, getAllConnections } from "@/lib/data";
import ExploreClient from "./ExploreClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}): Promise<Metadata> {
  const { p } = await searchParams;
  if (!p) return {};
  const patterns = await getAllPatterns();
  const pattern = patterns.find((pat) => pat.id === p);
  if (!pattern) return {};
  const title =
    pattern.number !== null
      ? `${pattern.number}. ${pattern.title} — A Pattern Language`
      : `${pattern.title} — A Pattern Language`;
  return {
    title,
    description: pattern.summary,
    openGraph: { title, description: pattern.summary },
  };
}

export default async function Home() {
  const [patterns, connections] = await Promise.all([
    getAllPatterns(),
    getAllConnections(),
  ]);
  return (
    <ExploreClient
      initialPatterns={patterns}
      initialConnections={connections}
    />
  );
}

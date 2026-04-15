// Server-side: merges seed (canonical) patterns with user-added patterns.
// Import only from server contexts (server components, route handlers).
import "server-only";

import { PATTERNS, CONNECTIONS } from "./seed/patterns";
import type { Pattern, Connection } from "./types";
import {
  readUserPatterns,
  readUserConnections,
} from "./admin/storage";

const seedByNumber = new Map(PATTERNS.map((p) => [p.number, p]));

function seedPatternsToPatterns(): Pattern[] {
  return PATTERNS.map((p) => ({
    id: p.slug,
    number: p.number,
    title: p.title,
    slug: p.slug,
    scale: p.scale,
    summary: p.summary,
    isCanonical: true,
  }));
}

function seedConnectionsToConnections(): Connection[] {
  const edges: Connection[] = [];
  const seen = new Set<string>();
  for (const [from, to] of CONNECTIONS) {
    const f = seedByNumber.get(from);
    const t = seedByNumber.get(to);
    if (!f || !t || f === t) continue;
    const key = f.slug < t.slug ? `${f.slug}|${t.slug}` : `${t.slug}|${f.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ from: f.slug, to: t.slug, kind: "related" });
  }
  return edges;
}

export async function getAllPatterns(): Promise<Pattern[]> {
  const seed = seedPatternsToPatterns();
  const user = await readUserPatterns();
  const userPatterns: Pattern[] = user.map((u) => ({
    id: u.slug,
    number: null,
    title: u.title,
    slug: u.slug,
    scale: u.scale,
    summary: u.summary,
    context: u.context,
    problem: u.problem,
    solution: u.solution,
    isCanonical: false,
    thinkerId: u.thinkerId,
    topic: u.topic,
    createdAt: u.createdAt,
  }));
  return [...seed, ...userPatterns];
}

export async function getAllConnections(): Promise<Connection[]> {
  const seed = seedConnectionsToConnections();
  const user = await readUserConnections();
  // Deduplicate across seed + user.
  const seen = new Set<string>();
  const out: Connection[] = [];
  for (const c of [...seed, ...user]) {
    const key = c.from < c.to ? `${c.from}|${c.to}` : `${c.to}|${c.from}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

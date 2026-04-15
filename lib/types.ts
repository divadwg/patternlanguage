export type Scale = "town" | "building" | "construction";

export interface Pattern {
  id: string;            // slug or uuid (canonical uses slug)
  number: number | null; // null for user-generated
  title: string;
  slug: string;
  scale: Scale;
  summary: string;
  context?: string | null;
  problem?: string | null;
  solution?: string | null;
  isCanonical: boolean;
  authorId?: string | null;
  authorName?: string | null;
  /** Set when the pattern was extracted from a canonical thinker. */
  thinkerId?: string;
  /** Set when the pattern came from a topic-discovery run. */
  topic?: string;
  createdAt?: string;
}

export interface Connection {
  from: string; // pattern id
  to: string;   // pattern id
  kind?: "larger" | "smaller" | "related";
}

export const SCALE_COLORS: Record<Scale, string> = {
  town: "#6b6b6b",         // medium gray
  building: "#4a4a4a",     // darker gray
  construction: "#2a2a2a", // near-black
};

/** Fallback color for user-added patterns that don't have a thinker attribution. */
export const USER_ACCENT = "#e87b35";

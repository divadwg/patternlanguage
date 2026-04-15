import { THINKERS, thinkerById } from "./admin/thinkers";
import { USER_ACCENT } from "./types";
import type { Pattern } from "./types";

// Distinctive color reserved for Christopher Alexander — the vast majority
// of canonical patterns. Near-charcoal so it reads as "the baseline" while
// still feeling like an intentional color.
const ALEXANDER_COLOR = "#2a2a2a";

// Palette for every OTHER thinker. Low-saturation, data-publication register.
const THINKER_PALETTE: string[] = [
  "#4a7c8a", // steel blue
  "#6b8e4a", // moss
  "#8a5a6f", // mauve
  "#b8935a", // amber
  "#5a6b8e", // slate blue
  "#7a4a5a", // plum
  "#4a8a6b", // teal green
  "#8a7a4a", // olive
  "#8a4a4a", // terracotta
  "#6b5a8a", // periwinkle
  "#4a8a8a", // teal
  "#8a6b4a", // sienna
  "#5a8a4a", // leaf
  "#8a4a7a", // magenta-gray
  "#4a5a8a", // denim
  "#7a8a4a", // moss light
  "#8a8a4a", // mustard
];

const TOPIC_COLOR = USER_ACCENT;
const GENERIC_USER_COLOR = "#999999"; // muted gray for manual user patterns

const ALEXANDER_ID = "christopher-alexander";

// Stable thinker-id → color map. Alexander gets his own slot; everyone else
// is assigned by position in the catalog (minus Alexander).
const THINKER_COLOR_MAP = new Map<string, string>([
  [ALEXANDER_ID, ALEXANDER_COLOR],
  ...THINKERS.filter((t) => t.id !== ALEXANDER_ID).map((t, i) =>
    [t.id, THINKER_PALETTE[i % THINKER_PALETTE.length]] as [string, string],
  ),
]);

export function colorForThinker(thinkerId: string | undefined): string | null {
  if (!thinkerId) return null;
  return THINKER_COLOR_MAP.get(thinkerId) ?? null;
}

/**
 * Node color. Every pattern colors by its author:
 *  - Canonical patterns → Alexander's color
 *  - User patterns with a thinkerId → that thinker's color
 *  - Topic-discovered patterns → project accent (orange)
 *  - Everything else → generic user gray
 */
export function colorForPattern(pattern: Pattern): string {
  if (pattern.isCanonical) return ALEXANDER_COLOR;
  if (pattern.thinkerId) {
    return colorForThinker(pattern.thinkerId) ?? GENERIC_USER_COLOR;
  }
  if (pattern.topic) return TOPIC_COLOR;
  return GENERIC_USER_COLOR;
}

/**
 * Human-readable attribution: "Christopher Alexander", "Jane Jacobs",
 * "Topic: …", or null for plain user patterns.
 */
export function sourceNameForPattern(pattern: Pattern): string | null {
  if (pattern.isCanonical) return "Christopher Alexander";
  if (pattern.thinkerId) {
    return thinkerById(pattern.thinkerId)?.name ?? pattern.thinkerId;
  }
  if (pattern.topic) return `Topic: ${pattern.topic}`;
  return null;
}

/**
 * "From X" for the side panel / permalink. Identical to sourceName but
 * framed as a source label ("From Jane Jacobs"), leaving canonical Alexander
 * implicit (we don't write "From Christopher Alexander" — the book is the
 * project's base).
 */
export function sourceLabelForPattern(pattern: Pattern): string | null {
  if (pattern.isCanonical) return null;
  const name = sourceNameForPattern(pattern);
  if (!name) return "User-added";
  return name.startsWith("Topic:") ? `From ${name.slice(7).trim()}` : `From ${name}`;
}

/**
 * Label used on the graph canvas next to a node. Includes source attribution.
 *   Canonical:  "Christopher Alexander: 89. Corner Grocery"
 *   Thinker:    "Jane Jacobs: Corner Stores"
 *   Topic:      "Topic: Walkability · Short Blocks"
 *   Plain user: "User: Title"
 */
export function labelForPattern(pattern: Pattern): string {
  const num = pattern.number !== null ? `${pattern.number}. ` : "";
  const title = `${num}${pattern.title}`;

  if (pattern.isCanonical) return `Christopher Alexander: ${title}`;
  if (pattern.thinkerId) {
    const name = thinkerById(pattern.thinkerId)?.name ?? pattern.thinkerId;
    return `${name}: ${title}`;
  }
  if (pattern.topic) return `Topic · ${title}`;
  return title;
}

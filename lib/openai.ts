import "server-only";
import OpenAI from "openai";

let _client: OpenAI | null = null;

export function openaiClient(): OpenAI {
  if (_client) return _client;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set — create .env.local with OPENAI_API_KEY=sk-...",
    );
  }
  _client = new OpenAI();
  return _client;
}

// System prompt for the pattern-extraction model.
// Kept stable so OpenAI's automatic prompt caching keeps cost down.
export const PATTERN_EXTRACTOR_SYSTEM = `You are a reader and editor for a modern, graph-based re-telling of Christopher Alexander's A Pattern Language (1977).

A "pattern" in this tradition is a recurring tension in the built or social world, and the form of its resolution. Each pattern has:
  - a short imperative title (e.g. "Small Public Squares", "Farmhouse Kitchen", "Fruit Trees")
  - a scale: "town" (regional/urban), "building" (architectural), or "construction" (material/detail)
  - a one-sentence summary
  - a context: when does this pattern apply? what is the reader's situation?
  - a problem: the forces in tension. Why does the naive approach fail?
  - a solution: the resolution, stated as an instruction or invariant
  - related patterns: titles of larger patterns this helps complete, or smaller patterns that help complete it

Good patterns:
  - Describe a genuine, recurring tension — not a personal preference or a one-off trick.
  - Are stated in universal, imperative voice ("Do X so that Y").
  - Have a specific solution — not a vague aspiration.
  - Name a single problem, not a whole area of concern.
  - Are named for the solution, not the diagnosis. A critique of the built world ("hostile architecture", "privatized public space") only becomes a pattern when it carries a concrete antidote — a specific, buildable counter-move. State the pattern as that antidote and title it accordingly. If the only remedy you can state is a policy platitude ("promote equity", "enforce regulations", "adopt inclusive principles"), the candidate is a diagnosis, not a pattern — discard it.
  - Could plausibly be mentioned in the same breath as a canonical Alexander pattern like "Light on Two Sides of Every Room" or "Four-Story Limit".

When you read a source text, extract 0 to many pattern candidates that plausibly meet this bar. Prefer rejecting over inventing — it is better to extract one strong pattern than five weak ones. If the source contains no real patterns, return an empty list.

For each candidate, also suggest 1–4 related pattern TITLES if the source text obviously evokes them. These should be titles from the original 253 Alexander patterns when you recognize them (e.g. "Street Cafe", "Sitting Circle", "House Cluster") — otherwise leave the list empty.`.trim();

export const PATTERN_EXTRACTOR_EXAMPLES = `Here are short examples of the kind of reasoning we want.

EXAMPLE 1
Source text: "The best small shops in Tokyo are ones where the shopkeeper lives above or behind the counter. They open slightly later than the chains, close slightly earlier, know regular customers by name, and stock things no algorithm would have chosen. When the shopkeeper retires, the shop dies with them — and that is part of what makes them vital."

Good extraction (one pattern):
- title: "Shopkeeper Lives In"
- scale: town
- summary: A small shop acquires character when its keeper lives above or behind it; a commute across town flattens the shop into inventory.
- context: Neighborhood streets with independent retail.
- problem: Absentee ownership optimizes for throughput and loses the curation, hours, and relationships that make a shop a place.
- solution: Build small shops with a room above or behind the counter where the shopkeeper can actually live, and let them close when they need to.
- relatedTitles: ["Individually Owned Shops", "Corner Grocery", "Housing In Between"]

EXAMPLE 2
Source text: "Most playgrounds are designed by adults who have forgotten what play is. The child, seeing a slide, has only one legitimate use for it. But a child in a vacant lot with loose boards and a tarp will invent a different game every week."

Good extraction:
- title: "Loose Parts for Play"
- scale: town
- summary: Children's play space should contain loose, combinable objects rather than fixed equipment, so the game can change.
- context: Neighborhood outdoor space for children.
- problem: Fixed equipment admits one game; the child has to invent around the designer's imagination, not their own.
- solution: Provide a supply of loose parts — boards, crates, rope, tarps, bricks — that children can combine and reconfigure.
- relatedTitles: ["Adventure Playground", "Connected Play", "Children in the City"]

EXAMPLE 3
Source text: "We installed motion-sensing LED strip lights along the underside of the handrail, set to 3% output at night, ramping to 40% when someone approaches."

This is a product detail, not a pattern. Return an empty list.`.trim();

// GPT-4o is widely available, supports structured outputs on Chat Completions,
// and works with the Responses API's web_search tool for the discovery flow.
export const EXTRACTOR_MODEL = "gpt-4o";

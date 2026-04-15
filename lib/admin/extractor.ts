import "server-only";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  openaiClient,
  PATTERN_EXTRACTOR_SYSTEM,
  PATTERN_EXTRACTOR_EXAMPLES,
  EXTRACTOR_MODEL,
} from "../openai";
import type { Thinker } from "./thinkers";

export const CandidateSchema = z.object({
  title: z.string().describe("Short imperative title, 2–5 words"),
  scale: z
    .enum(["town", "building", "construction"])
    .describe("town (regional/urban), building (architectural), or construction (material/detail)"),
  summary: z.string().describe("One sentence summary of the pattern"),
  context: z.string().describe("When does this pattern apply?"),
  problem: z
    .string()
    .describe("The tension — why does the naive approach fail?"),
  solution: z
    .string()
    .describe("The resolution stated as an instruction"),
  relatedTitles: z
    .array(z.string())
    .describe(
      "Titles of 1–4 related patterns (prefer canonical Alexander titles when applicable)",
    ),
});

export const ExtractionResultSchema = z.object({
  candidates: z.array(CandidateSchema),
});

export type Candidate = z.infer<typeof CandidateSchema>;

const FULL_SYSTEM = PATTERN_EXTRACTOR_SYSTEM + "\n\n" + PATTERN_EXTRACTOR_EXAMPLES;

/**
 * Chat Completions + zod structured output. Used for all non-web-search flows
 * (paste text, paste URL, thinker extraction).
 */
async function extractStructured(userContent: string): Promise<Candidate[]> {
  const client = openaiClient();
  const response = await client.chat.completions.parse({
    model: EXTRACTOR_MODEL,
    messages: [
      { role: "system", content: FULL_SYSTEM },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(ExtractionResultSchema, "pattern_extraction"),
    // Give GPT headroom for a long list of candidates.
    max_completion_tokens: 16000,
  });
  return response.choices[0]?.message.parsed?.candidates ?? [];
}

/**
 * Extract pattern candidates from raw source text.
 */
export async function extractPatternsFromText(
  sourceText: string,
  sourceUrl?: string,
): Promise<Candidate[]> {
  const MAX_CHARS = 32_000;
  const trimmed =
    sourceText.length > MAX_CHARS
      ? sourceText.slice(0, MAX_CHARS) + "\n\n[... text truncated ...]"
      : sourceText;

  const userContent = [
    sourceUrl ? `Source URL: ${sourceUrl}` : null,
    "Extract pattern candidates from the following source text. Return { candidates: [...] } — an empty list is valid.",
    "",
    "Source text:",
    "```",
    trimmed,
    "```",
  ]
    .filter(Boolean)
    .join("\n");

  return extractStructured(userContent);
}

/**
 * Discover patterns on a topic. Uses the OpenAI Responses API with the
 * built-in web_search tool so GPT can actually research before synthesizing.
 */
export async function discoverPatternsForTopic(
  topic: string,
): Promise<Candidate[]> {
  const client = openaiClient();

  const prompt = [
    FULL_SYSTEM,
    "",
    `Research the topic: "${topic.trim()}".`,
    "",
    "Use the web_search tool to find 3–6 high-quality pieces — articles, essays, research summaries, or reference entries — that describe concrete design patterns, moves, or principles related to this topic.",
    "",
    "Synthesize an extensive set of pattern candidates from what you find. If the topic supports it, produce 10–20; a narrow or shallow topic might yield fewer. Err on the side of thoroughness — a reviewer will reject any that don't meet the bar. Attribute a source or thinker in the summary when one is clear. Each candidate must still be a specific, durable pattern, not a vague aspiration.",
    "",
    "Return the result as JSON matching this shape:",
    `{ "candidates": [ { "title": string, "scale": "town"|"building"|"construction", "summary": string, "context": string, "problem": string, "solution": string, "relatedTitles": string[] }, ... ] }`,
    "Return only the JSON object, no prose.",
  ].join("\n");

  const response = await client.responses.create({
    model: EXTRACTOR_MODEL,
    input: prompt,
    tools: [{ type: "web_search" }],
    // Without a format, we just parse the JSON out of the final message.
  });

  // The final assistant text is accessible via `output_text`.
  const text = (response as any).output_text as string | undefined;
  if (!text) return [];

  // Strip ```json fences if present, then parse.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    const parsed = ExtractionResultSchema.parse(JSON.parse(cleaned));
    return parsed.candidates;
  } catch (err) {
    // Fall back: try to extract the first {...} JSON block.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return ExtractionResultSchema.parse(JSON.parse(match[0])).candidates;
      } catch {
        /* fall through */
      }
    }
    console.warn("Failed to parse topic-discovery response:", err);
    return [];
  }
}

/**
 * Extract pattern candidates from the work of a canonical thinker.
 * Uses the Chat Completions API + GPT's training knowledge (no web search).
 */
export async function extractPatternsFromThinker(
  thinker: Thinker,
  excludeTitles: string[] = [],
): Promise<Candidate[]> {
  const works = thinker.works.map((w) => `"${w}"`).join(", ");
  const exclusionBlock =
    excludeTitles.length > 0
      ? [
          "",
          "The following pattern titles have ALREADY been extracted from this thinker in previous passes — do not repeat or re-phrase them. Find additional, distinct patterns the thinker articulated that aren't in this list:",
          ...excludeTitles.map((t) => `  - ${t}`),
          "",
          "If you can't find any new ones that meet the quality bar, return an empty candidates list — that signals the thinker is exhausted.",
        ].join("\n")
      : "";

  const userContent = [
    `Extract pattern candidates from the work of ${thinker.name}${
      thinker.years ? ` (${thinker.years})` : ""
    }.`,
    `Draws on: ${works}.`,
    "",
    `Context: ${thinker.blurb}`,
    exclusionBlock,
    "",
    excludeTitles.length === 0
      ? "Produce an extensive set of pattern candidates — aim for 10–20 for thinkers with a substantial published corpus (Jacobs, Gehl, Lynch, Mumford...); fewer (5–10) if their corpus is narrower. Err on the side of thoroughness — a reviewer will reject any that don't meet the bar."
      : "Find as many ADDITIONAL distinct patterns as you can — minor, less-famous, or more specific ones are fine as long as each is a genuine, durable pattern the thinker articulated. Dig into the lesser-known works if the obvious ones are exhausted.",
    "",
    'Attribute the thinker in the summary when appropriate ("Jacobs argues that…", "Whyte observed…"). Prefer patterns the thinker clearly owns over ones they merely endorsed. Avoid restating the same pattern twice under different titles.',
  ].join("\n");

  return extractStructured(userContent);
}

/**
 * Fetch a URL and extract the main article text using @mozilla/readability.
 */
export async function fetchArticleText(url: string): Promise<{
  title: string | null;
  text: string;
}> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  const { JSDOM } = await import("jsdom");
  const { Readability } = await import("@mozilla/readability");
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();
  if (!article) {
    const text = dom.window.document.body?.textContent?.trim() ?? "";
    return { title: dom.window.document.title ?? null, text };
  }
  return {
    title: article.title ?? null,
    text: (article.textContent ?? "").trim(),
  };
}

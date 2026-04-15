# A Pattern Language — Modern Edition

A graph-based reimagining of Christopher Alexander's *A Pattern Language* (1977):
- All 253 canonical patterns as nodes in an interactive force-directed graph
- Connections between patterns as edges — not the book's rigid hierarchy
- A Claude-powered extractor (single user, localhost) that reads articles and
  drafts new patterns for the maintainer to review and approve
- Approved patterns live in git-committed JSON — the repo is the edit history

## Stack

Next.js 15 · TypeScript · Tailwind v4 · `react-force-graph-2d` · OpenAI SDK
(GPT-4o with structured outputs; Responses API + web_search for topic
discovery) · `@mozilla/readability` for article text extraction.

## Architecture

- **Production is read-only**: anyone can browse the graph at `/explore`
  and read pattern permalinks at `/pattern/<slug>`.
- **Admin is dev-only**: `/admin` and every `/api/admin/*` route return 404
  unless `NODE_ENV === "development"`. Only you, running locally, can add
  or approve patterns.
- **Storage is git**: user patterns, review queue, sources, and crawl state
  live in `data/*.json`. To publish a new pattern, commit the JSON.

```
/                   Landing page
/explore            Full-screen interactive graph
/pattern/<slug>     Permalink for a single pattern
/admin              (dev) hub
/admin/extract      (dev) paste text or URL → Claude drafts candidates
/admin/queue        (dev) review queue — approve / edit / reject
/admin/sources      (dev) manage the list of crawler sources
```

## Setup

```bash
npm install

# Configure — set your Anthropic key in .env.local
cp .env.example .env.local
$EDITOR .env.local            # paste your OPENAI_API_KEY

npm run dev                   # → http://localhost:3000
```

Get an OpenAI API key at https://platform.openai.com/api-keys.

## Adding patterns

Three entry points, all localhost-only:

### 1. Paste text

`/admin/extract` → paste an article, essay, or your own notes → Claude drafts
0–6 pattern candidates → they land in the review queue.

### 2. Fetch a URL

Same page, flip the tab. The server fetches the URL, runs
[Readability](https://github.com/mozilla/readability) to get the article
body, then asks Claude to extract candidates.

### 3. Crawler

```bash
npm run crawl
```

Reads `data/sources.json`, walks each enabled source's index page, finds new
article links, and runs them through the extractor. State is tracked in
`data/crawl-state.json` so the same articles aren't reprocessed.

Manage sources at `/admin/sources` (or edit `data/sources.json` directly).
Seed sources include Dezeen, ArchDaily, Strong Towns, CNU Public Square, and
Common Edge — mostly architecture and urbanism writing.

## Publishing

Candidates only enter the graph after you approve them at `/admin/queue`.
Approving a candidate:
- appends it to `data/user-patterns.json`
- appends any resolved edges to `data/user-connections.json`
- removes it from `data/queue.json`

To make changes visible in production, commit and push:

```bash
git add data/
git commit -m "Add N new patterns"
git push
```

## Design

The UI follows a restrained, data-publication aesthetic — white background,
warm orange accent, DM Sans as the closest free alternative to DIN, no dark
mode, minimal shadows. Canonical patterns are colored by scale (town /
building / construction, shades of gray). User-added patterns are orange.

## Notes

- Summaries for the 253 canonical patterns are written fresh for this project —
  titles and cross-reference relationships are factual/public, but the
  book's prose is not transcribed here.
- OpenAI handles prompt caching automatically for repeated identical prefixes;
  the system prompt is kept stable so repeated runs mostly read from cache.
- The crawler caps each source to 3 new articles per run to keep API usage
  modest on the first pass; bump `MAX_ARTICLES_PER_SOURCE` in
  `scripts/crawl.ts` once you're confident.

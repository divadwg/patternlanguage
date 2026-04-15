// JSON-file storage for user patterns, review queue, crawler state, and sources.
// All files live under data/ at the repo root and are git-committed — the
// repo is the edit history.
import { promises as fs } from "fs";
import path from "path";
import type { Pattern, Connection, Scale } from "../types";

const DATA_DIR = path.join(process.cwd(), "data");
const PATTERNS_FILE = path.join(DATA_DIR, "user-patterns.json");
const CONNECTIONS_FILE = path.join(DATA_DIR, "user-connections.json");
const QUEUE_FILE = path.join(DATA_DIR, "queue.json");
const SOURCES_FILE = path.join(DATA_DIR, "sources.json");
const CRAWL_STATE_FILE = path.join(DATA_DIR, "crawl-state.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: any) {
    if (err?.code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

// ── User patterns ──────────────────────────────────────────────────────
export interface UserPattern {
  id: string;
  slug: string;
  title: string;
  scale: Scale;
  summary: string;
  context: string;
  problem: string;
  solution: string;
  sourceUrl?: string;
  /** Set when the pattern was extracted from a canonical thinker. */
  thinkerId?: string;
  /** Set when the pattern came from a topic-discovery run. */
  topic?: string;
  createdAt: string;
}

export async function readUserPatterns(): Promise<UserPattern[]> {
  return readJson<UserPattern[]>(PATTERNS_FILE, []);
}

export async function writeUserPatterns(patterns: UserPattern[]): Promise<void> {
  await writeJson(PATTERNS_FILE, patterns);
}

export async function readUserConnections(): Promise<Connection[]> {
  return readJson<Connection[]>(CONNECTIONS_FILE, []);
}

export async function writeUserConnections(connections: Connection[]): Promise<void> {
  await writeJson(CONNECTIONS_FILE, connections);
}

// ── Review queue ───────────────────────────────────────────────────────
export interface QueueItem {
  id: string;
  candidate: {
    title: string;
    scale: Scale;
    summary: string;
    context: string;
    problem: string;
    solution: string;
    relatedSlugs: string[];
  };
  source: {
    kind: "text" | "url" | "crawler" | "thinker" | "topic";
    url?: string;
    sourceId?: string; // id of entry in sources.json when kind=crawler
    thinkerId?: string; // when kind="thinker"
    topic?: string;     // when kind="topic"
    snippet?: string;   // short excerpt of the raw input
  };
  createdAt: string;
}

export async function readQueue(): Promise<QueueItem[]> {
  return readJson<QueueItem[]>(QUEUE_FILE, []);
}

export async function writeQueue(items: QueueItem[]): Promise<void> {
  await writeJson(QUEUE_FILE, items);
}

export async function addToQueue(items: QueueItem[]): Promise<void> {
  const current = await readQueue();
  await writeQueue([...items, ...current]);
}

// ── Sources ────────────────────────────────────────────────────────────
export interface Source {
  id: string;
  name: string;
  url: string;
  kind: "html_index" | "html_page" | "rss";
  linkSelector?: string;
  enabled: boolean;
  note?: string;
}

export async function readSources(): Promise<Source[]> {
  return readJson<Source[]>(SOURCES_FILE, []);
}

export async function writeSources(sources: Source[]): Promise<void> {
  await writeJson(SOURCES_FILE, sources);
}

// ── Crawl state ────────────────────────────────────────────────────────
interface CrawlState {
  // per-source list of already-fetched article URLs so we don't reprocess
  lastCrawledUrls: Record<string, string[]>;
}

export async function readCrawlState(): Promise<CrawlState> {
  return readJson<CrawlState>(CRAWL_STATE_FILE, { lastCrawledUrls: {} });
}

export async function writeCrawlState(state: CrawlState): Promise<void> {
  await writeJson(CRAWL_STATE_FILE, state);
}

// ── Helpers ────────────────────────────────────────────────────────────
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function userSlug(title: string): string {
  // User patterns prefix with 'u-' to distinguish from canonical ###-slug.
  return `u-${slugify(title)}`;
}

export type { CrawlState };

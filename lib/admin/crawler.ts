import "server-only";
import { randomUUID } from "crypto";
import { JSDOM } from "jsdom";
import {
  readSources,
  readCrawlState,
  writeCrawlState,
  readQueue,
  writeQueue,
  type QueueItem,
  type Source,
} from "./storage";
import { extractPatternsFromText, fetchArticleText } from "./extractor";

const DEFAULT_MAX_ARTICLES_PER_SOURCE = 3;
// Many publications (Dezeen in particular) 403 non-browser UAs. Mimic Chrome.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Path segments that indicate an index / category / admin page, not an article.
const NON_ARTICLE_SEGMENTS = new Set([
  "about", "contact", "category", "categories", "tag", "tags",
  "author", "authors", "archive", "archives", "feed", "rss", "feeds",
  "search", "login", "signup", "register", "subscribe", "privacy", "terms",
  "cart", "checkout", "account", "admin", "wp-admin", "wp-content",
  "wp-json", "wp-includes", "assets", "static", "cdn", "media",
  "sitemap", "sitemap.xml", "robots.txt", "amp", "shop", "store",
  "events", "event", "newsletter", "podcast", "podcasts", "video", "videos",
  "jobs", "donate", "press", "advertising", "advertise", "page",
]);

const FILE_EXT_RE = /\.(pdf|jpe?g|png|gif|svg|webp|zip|mp[34]|webm|mov|css|js|json|xml|txt|ico|woff2?|ttf|rss|atom)$/i;

function looksLikeArticle(url: URL): boolean {
  const segs = url.pathname.split("/").filter(Boolean);
  if (segs.length === 0) return false;
  if (FILE_EXT_RE.test(url.pathname)) return false;
  // Any non-article segment → reject (catches /category/..., /tag/..., /author/...).
  if (segs.some((s) => NON_ARTICLE_SEGMENTS.has(s.toLowerCase()))) return false;
  // Pagination: /page/2, /page/3, ...
  if (/^\d+$/.test(segs[segs.length - 1]) && segs[segs.length - 2] === "page") return false;
  // Require at least one segment that looks like an article slug —
  // contains a hyphen, OR is a 4+ digit id (ArchDaily uses /1020000/slug).
  return segs.some((s) => s.includes("-") || /^\d{4,}$/.test(s));
}

export interface CrawlReport {
  added: number;
  perSource: Array<{
    id: string;
    name: string;
    added: number;
    skipped: number;
    error?: string;
  }>;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function absoluteUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString().split("#")[0];
  } catch {
    return null;
  }
}

async function discoverArticleUrls(source: Source): Promise<string[]> {
  const html = await fetchHtml(source.url);
  const dom = new JSDOM(html, { url: source.url });
  // CSS selector is now optional — when absent we use a URL-shape heuristic,
  // which works across sites regardless of their class names.
  const selector = source.linkSelector?.trim() || "a[href]";
  const anchors = Array.from(
    dom.window.document.querySelectorAll<HTMLAnchorElement>(selector),
  );
  const urls: string[] = [];
  const seen = new Set<string>();
  const sourceOrigin = new URL(source.url).origin;
  const indexPath = new URL(source.url).pathname.replace(/\/$/, "");

  for (const a of anchors) {
    const abs = absoluteUrl(a.getAttribute("href") ?? "", source.url);
    if (!abs) continue;
    let u: URL;
    try {
      u = new URL(abs);
    } catch {
      continue;
    }
    if (u.origin !== sourceOrigin) continue;
    // Skip the index page itself.
    const path = u.pathname.replace(/\/$/, "");
    if (path === indexPath) continue;
    // Heuristic: must look like an article slug.
    if (!looksLikeArticle(u)) continue;
    const normalized = u.origin + u.pathname;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    urls.push(normalized);
  }
  return urls;
}

export interface CrawlOptions {
  maxArticlesPerSource?: number;
  onProgress?: (msg: string) => void;
  sourceIds?: string[]; // optional filter — crawl only these source ids
}

export async function runCrawler(opts: CrawlOptions = {}): Promise<CrawlReport> {
  const limit = opts.maxArticlesPerSource ?? DEFAULT_MAX_ARTICLES_PER_SOURCE;
  const log = opts.onProgress ?? (() => {});

  const allSources = (await readSources()).filter((s) => s.enabled);
  const sources = opts.sourceIds
    ? allSources.filter((s) => opts.sourceIds!.includes(s.id))
    : allSources;

  const report: CrawlReport = { added: 0, perSource: [] };

  if (sources.length === 0) {
    log("No enabled sources.");
    return report;
  }

  const state = await readCrawlState();
  const queue = await readQueue();

  for (const source of sources) {
    const entry = { id: source.id, name: source.name, added: 0, skipped: 0 } as
      CrawlReport["perSource"][number];
    log(`▸ ${source.name}`);
    const processed = new Set(state.lastCrawledUrls[source.id] ?? []);
    let links: string[];
    try {
      links = await discoverArticleUrls(source);
    } catch (err: any) {
      entry.error = err?.message ?? String(err);
      log(`  ! ${entry.error}`);
      report.perSource.push(entry);
      continue;
    }
    const fresh = links.filter((u) => !processed.has(u)).slice(0, limit);
    if (fresh.length === 0) {
      log("  (no new articles)");
      report.perSource.push(entry);
      continue;
    }

    for (const articleUrl of fresh) {
      try {
        log(`  ↓ ${articleUrl}`);
        const { title, text } = await fetchArticleText(articleUrl);
        if (text.length < 400) {
          log(`    skipped — too short (${text.length} chars)`);
          entry.skipped += 1;
          processed.add(articleUrl);
          continue;
        }
        const candidates = await extractPatternsFromText(text, articleUrl);
        log(
          `    ${candidates.length} candidate${candidates.length === 1 ? "" : "s"}${
            title ? ` from “${title}”` : ""
          }`,
        );
        const now = new Date().toISOString();
        const snippet = text.length > 300 ? text.slice(0, 300) + "…" : text;
        for (const c of candidates) {
          queue.unshift({
            id: randomUUID(),
            candidate: {
              title: c.title,
              scale: c.scale,
              summary: c.summary,
              context: c.context,
              problem: c.problem,
              solution: c.solution,
              relatedSlugs: c.relatedTitles,
            },
            source: {
              kind: "crawler",
              url: articleUrl,
              sourceId: source.id,
              snippet,
            },
            createdAt: now,
          } satisfies QueueItem);
          entry.added += 1;
          report.added += 1;
        }
        processed.add(articleUrl);
      } catch (err: any) {
        log(`    ! ${err?.message ?? err}`);
      }
    }

    state.lastCrawledUrls[source.id] = Array.from(processed);
    report.perSource.push(entry);
  }

  await writeCrawlState(state);
  await writeQueue(queue);
  return report;
}

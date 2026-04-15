/**
 * Crawler CLI — run with `npm run crawl`.
 * Thin wrapper around lib/admin/crawler.ts so the same code powers both
 * the CLI and the admin button at /admin.
 */
import "dotenv/config";
import { runCrawler } from "../lib/admin/crawler";

async function main() {
  const report = await runCrawler({
    onProgress: (msg) => console.log(msg),
  });
  console.log(
    `\n✓ Done. Added ${report.added} candidate${report.added === 1 ? "" : "s"} to the queue.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

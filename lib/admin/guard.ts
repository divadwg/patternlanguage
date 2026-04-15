import "server-only";
import { notFound } from "next/navigation";

/**
 * Dev-only guard. The admin UI and all /api/admin/* routes call this at the
 * top of every request so the surface area is literally invisible in
 * production (returns 404). In production the site is read-only —
 * pattern writes happen on the developer's localhost and are committed to
 * the repo via git.
 */
export function requireDev(): void {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
}

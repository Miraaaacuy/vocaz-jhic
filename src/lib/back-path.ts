const DASHBOARDS = ["student", "company", "school", "institution", "admin"];

/**
 * Where "back" leads when there is no in-app history (page opened directly or in a new tab):
 * the section the page belongs to, e.g. /lowongan/123 → /lowongan, /student/career/jobs/9 → /student/career.
 * Returns null on root pages (home, a role's dashboard), which get no back button.
 */
export function parentPath(path: string): string | null {
  const segs = path.split("/").filter(Boolean);
  const root = DASHBOARDS.includes(segs[0]) ? 1 : 0;
  if (segs.length <= root) return null;
  return "/" + segs.slice(0, Math.min(segs.length - 1, root + 1)).join("/");
}

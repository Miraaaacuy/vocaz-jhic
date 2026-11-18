export type ActionResult = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
} | null;

export const ok = (message?: string): ActionResult => ({ ok: true, message });
export const fail = (error: string, fieldErrors?: Record<string, string>): ActionResult => ({ ok: false, error, fieldErrors });

/** Convert a zod error into a flat record of field → first message */
export function zodErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "_");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

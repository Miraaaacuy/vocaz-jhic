import type { Role } from "@prisma/client";
import { ROLE_HOME } from "./constants";

/** Where to land after login: `next` if it belongs to this role (or is a public page), else the role dashboard */
export function homeFor(role: Role, next: string | null | undefined) {
  const home = ROLE_HOME[role];
  if (!next || !next.startsWith("/") || next.startsWith("//")) return home;
  if (next.startsWith(home)) return next;
  return Object.values(ROLE_HOME).some((h) => next.startsWith(h)) ? home : next;
}

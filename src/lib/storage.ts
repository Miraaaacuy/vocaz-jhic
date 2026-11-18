import "server-only";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || "./uploads");

export const UPLOAD_KINDS = {
  avatar: { maxMB: 3, types: ["image/jpeg", "image/png", "image/webp"] },
  logo: { maxMB: 3, types: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] },
  image: { maxMB: 5, types: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
  video: { maxMB: 100, types: ["video/mp4", "video/webm", "video/quicktime"] },
  document: { maxMB: 10, types: ["application/pdf", "image/jpeg", "image/png"] },
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
};

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(Object.entries(EXT).map(([m, e]) => [e, m]));

export class UploadError extends Error {}

/** Save an uploaded file to disk, returns public URL (/api/files/...) */
export async function saveUpload(file: File, kind: UploadKind) {
  const rule = UPLOAD_KINDS[kind];
  if (!file || file.size === 0) throw new UploadError("File kosong");
  if (!(rule.types as readonly string[]).includes(file.type))
    throw new UploadError(`Format file tidak didukung (${file.type || "unknown"})`);
  if (file.size > rule.maxMB * 1024 * 1024) throw new UploadError(`Ukuran file maksimal ${rule.maxMB} MB`);

  const now = new Date();
  const dir = path.join(kind, `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`);
  const name = `${randomUUID()}.${EXT[file.type]}`;
  await mkdir(path.join(UPLOAD_ROOT, dir), { recursive: true });
  await writeFile(path.join(UPLOAD_ROOT, dir, name), Buffer.from(await file.arrayBuffer()));
  return `/api/files/${dir.replace(/\\/g, "/")}/${name}`;
}

/** Helper for server actions: returns URL if a file was provided in the form field */
export async function maybeUpload(form: FormData, field: string, kind: UploadKind) {
  const f = form.get(field);
  if (f instanceof File && f.size > 0) return saveUpload(f, kind);
  return undefined;
}

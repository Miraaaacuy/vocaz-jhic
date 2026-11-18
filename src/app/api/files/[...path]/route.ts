import path from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { MIME_BY_EXT, UPLOAD_ROOT } from "@/lib/storage";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

// Serves uploaded files with HTTP Range support (needed for video seeking)
export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  // legal documents & certificates are only visible to signed-in users
  if (parts[0] === "document" && !(await auth())?.user) return new Response("Unauthorized", { status: 401 });
  const filePath = path.resolve(UPLOAD_ROOT, ...parts);
  if (!filePath.startsWith(UPLOAD_ROOT + path.sep)) return new Response("Not found", { status: 404 });

  let size: number;
  try {
    const s = await stat(filePath);
    if (!s.isFile()) throw new Error();
    size = s.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const type = MIME_BY_EXT[ext] ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  if (ext === "svg") headers["Content-Security-Policy"] = "script-src 'none'";

  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m?.[1] ? parseInt(m[1], 10) : 0;
    const end = m?.[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
}

import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * App-wide Link. Automatic prefetching is off by default: with many links
 * prefetching at once (sidebar + tabs + cards), Next.js 15 sometimes aborts
 * the real navigation request, so a click appears to do nothing.
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}

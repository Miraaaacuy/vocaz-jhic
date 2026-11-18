import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // allows a production build next to a running dev server (NEXT_DIST_DIR=.next-prod)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // always render <title>/<meta> in <head> (default streams them into <body> for regular browsers)
  htmlLimitedBots: /.*/,
  experimental: {
    serverActions: { bodySizeLimit: "110mb" },
  },
  images: { unoptimized: true },
  // optimised static assets are content-stable — let browsers cache them for a year
  async headers() {
    const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/brand/:path*", headers: immutable },
      { source: "/fonts/:path*", headers: immutable },
      { source: "/sponsors/:path*", headers: immutable },
      { source: "/images/:path*", headers: immutable },
    ];
  },
};

export default nextConfig;

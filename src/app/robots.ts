import type { MetadataRoute } from "next";

const BASE = process.env.AUTH_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // role dashboards & APIs are private
      disallow: ["/student", "/company", "/school", "/institution", "/admin", "/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}

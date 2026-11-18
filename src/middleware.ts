import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/student/:path*", "/company/:path*", "/school/:path*", "/institution/:path*", "/admin/:path*"],
};

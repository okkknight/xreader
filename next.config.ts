import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  distDir: process.env.XREADER_DIST_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1"],
  // Low-memory VPS builds run `npx tsc --noEmit` as an explicit release gate,
  // then may skip Next's duplicate typecheck only when this opt-in flag is set.
  typescript: process.env.XREADER_SKIP_NEXT_TYPECHECK === "1" ? { ignoreBuildErrors: true } : undefined,
};

export default nextConfig;

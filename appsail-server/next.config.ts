import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // All API routes are internal Next.js routes — no proxy rewrites needed
};

export default nextConfig;

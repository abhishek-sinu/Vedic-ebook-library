import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/ebooks',
  assetPrefix: '/ebooks',
  trailingSlash: true,
  reactCompiler: true,
  
  experimental: {
    serverActions: {
      allowedOrigins: ["72.60.221.159", "localhost:3001"],
    },
  },
};

export default nextConfig;

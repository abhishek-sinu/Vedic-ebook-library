import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  basePath: isProd ? '/ebooks' : '',
  assetPrefix: isProd ? '/ebooks' : '',
  trailingSlash: true,
  reactCompiler: true,
  
  // Enable CORS and cross-origin access
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // Allow external domains for images and assets
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '72.60.221.159',
      },
      {
        protocol: 'https',
        hostname: '72.60.221.159',
      },
    ],
  },

  // Experimental features for better compatibility
  experimental: {
    serverActions: {
      allowedOrigins: ["72.60.221.159", "localhost:3000", "localhost:3001"],
    },
  },
};

export default nextConfig;
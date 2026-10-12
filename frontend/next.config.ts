import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In local standalone dev (npm run dev without vercel dev), proxy /api/* to local backend
    if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;

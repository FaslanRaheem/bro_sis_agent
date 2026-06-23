import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Disable server-side image optimization in production to avoid
  // requiring a Cloud Function on Firebase Hosting.
  images: {
    unoptimized: true,
  },
  // Rewrites only apply in local development to proxy API requests
  // to the FastAPI backend. In production, NEXT_PUBLIC_API_URL is used.
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:8000/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;

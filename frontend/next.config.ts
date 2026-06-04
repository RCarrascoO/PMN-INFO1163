import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  env: {
    NEXT_PUBLIC_API_URL: "http://localhost:8000",
  },
};

export default nextConfig;

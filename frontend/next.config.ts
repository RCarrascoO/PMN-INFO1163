import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  allowedDevOrigins: ['lsanehost.zapto.org'], // <- Línea agregada
  env: {
    NEXT_PUBLIC_API_URL: "http://lsanehost.zapto.org:8000",
  },
};

export default nextConfig;

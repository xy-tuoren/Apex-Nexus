import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    // Next 16 默认开启；损坏的 .next/dev 缓存会触发 Turbopack panic
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;

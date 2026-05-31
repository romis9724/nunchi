import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@noonchi/shared", "@noonchi/llm"],
};

export default nextConfig;

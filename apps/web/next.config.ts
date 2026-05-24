import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nunchi/shared", "@nunchi/llm"],
};

export default nextConfig;

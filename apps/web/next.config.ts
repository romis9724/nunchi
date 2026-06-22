import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM 컨텍스트에서 __dirname 복원 (모노레포 트레이싱 루트 계산용)
const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Docker 배포용 standalone 출력 (server.js + 최소 node_modules)
  output: "standalone",
  // 모노레포: 트레이싱 루트를 저장소 루트(apps/web 기준 2단계 위)로 지정
  outputFileTracingRoot: path.join(dirname, "../../"),
  transpilePackages: ["@noonchi/shared", "@noonchi/llm"],
};

export default nextConfig;

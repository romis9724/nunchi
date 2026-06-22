# syntax=docker/dockerfile:1
# Noonchi — Next.js 16 standalone 멀티스테이지 빌드 (pnpm 모노레포)
# 빌드는 CI(GitHub Actions)에서 수행하고 EC2는 pull만 한다.

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# ── builder: 전체 워크스페이스 설치 + standalone 빌드 ──
FROM base AS builder
# 모노레포 전체 복사 (.dockerignore로 node_modules·.next·시크릿 제외)
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter web build

# ── runner: standalone 산출물만 (최소 런타임) ──
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# outputFileTracingRoot=저장소 루트 → standalone 내부에 모노레포 구조(apps/web/server.js) 보존
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

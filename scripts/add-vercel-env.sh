#!/bin/bash
# Vercel nunchi 프로젝트에 환경변수 추가
# 실행: bash scripts/add-vercel-env.sh

ENV_FILE="$(dirname "$0")/../.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env.local not found at $ENV_FILE"
  exit 1
fi

echo "Reading from: $ENV_FILE"
echo ""

# 각 변수를 읽어서 Vercel에 추가
while IFS= read -r line; do
  # 빈 줄, 주석 건너뜀
  [[ -z "$line" || "$line" == \#* ]] && continue
  # KEY=VALUE 형식만 처리
  if [[ "$line" =~ ^([A-Z_][A-Z0-9_]*)=(.+)$ ]]; then
    KEY="${BASH_REMATCH[1]}"
    VALUE="${BASH_REMATCH[2]}"
    echo "Adding $KEY ..."
    echo "$VALUE" | vercel env add "$KEY" production --yes 2>/dev/null || \
    echo "$VALUE" | vercel env add "$KEY" production 2>&1 | tail -1
  fi
done < "$ENV_FILE"

echo ""
echo "Done. Redeploy with: vercel --prod --yes"

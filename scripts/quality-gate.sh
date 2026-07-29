#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
PASS=0
FAIL=0
TOTAL=0

check() {
  local name=$1
  local cmd=$2
  TOTAL=$((TOTAL + 1))
  echo -e "\n${YELLOW}━━━ [$((TOTAL))] $name ━━━${NC}"
  if eval "$cmd"; then
    echo -e "${GREEN}✅ PASS: $name${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}❌ FAIL: $name${NC}"
    FAIL=$((FAIL + 1))
  fi
}

echo "=========================================="
echo "   🏗️  TGP Quality Gate"
echo "   $(date)"
echo "=========================================="

check "Secret Scanning" "bash scripts/detect-secrets.sh --all"
check "Formatting (Prettier)" "npx prettier --check 'src/**/*.{ts,tsx,css,json}'"
check "Linting (ESLint + Security)" "npm run lint"
check "TypeScript Check" "npx tsc --noEmit"
check "Unit Tests + Coverage" "npx vitest run --coverage --reporter=verbose"
check "Build" "npm run build"
check "Security Audit" "npm audit --audit-level=high"

echo ""
echo "=========================================="
echo -e "   Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, $TOTAL total"
echo "=========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

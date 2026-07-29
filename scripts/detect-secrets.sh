#!/usr/bin/env bash
# detect-secrets.sh - git-based secret scanner for TGP
# Scans staged (pre-commit) or all tracked (pre-push) files for
# potential secrets, keys, tokens, and credential leaks.
#
# Usage:
#   bash scripts/detect-secrets.sh          # pre-commit (staged only)
#   bash scripts/detect-secrets.sh --all    # pre-push  (all tracked)
#
# Exit code: 0 if clean, 1 if secrets detected
set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
HAS_ERROR=0
SCAN_TARGET="${1:---staged}"

# Combined extended regex for all secret patterns
PATTERN="(api[_-]?key|apikey|secret|token|password|passwd|credential)[[:space:]]*[:=][[:space:]]*['\"]?[A-Za-z0-9_\/\-=+]{20,}|BEGIN (RSA |EC |DSA |PGP |OPENSSH |PRIVATE )?PRIVATE KEY|eyJ[A-Za-z0-9_\-+\/]{20,}\.[A-Za-z0-9_\-+\/]{20,}\.[A-Za-z0-9_\-+\/]{20,}|AKIA[0-9A-Z]{16}|(ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}|xox[baprs]-[0-9A-Za-z\-]{10,}|DefaultEndpointsProtocol=https.*AccountKey=[a-zA-Z0-9+\/]{40,}|npm_[A-Za-z0-9]{36}|https?:\/\/[A-Za-z0-9_\-]+:[A-Za-z0-9_\-]+@[a-zA-Z0-9.-]+"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
IGNORE_FILE="$PROJECT_DIR/.secretsignore"

# Determine files to scan
if [ "$SCAN_TARGET" = "--all" ]; then
  FILES=$(git ls-files --cached --others --exclude-standard \
    | grep -vE '\.(png|jpg|jpeg|gif|ico|svg|woff2?|eot|ttf|pdf|zip|gz|lock)$|coverage/|\.secretsignore$|node_modules/' || true)
  SCOPE="all tracked files"
else
  FILES=$(git diff --cached --name-only --diff-filter=ACMR \
    | grep -vE '\.(png|jpg|jpeg|gif|ico|svg|woff2?|eot|ttf|pdf|zip|gz|lock)$|coverage/|\.secretsignore$' || true)
  SCOPE="staged files"
fi

if [ -z "$FILES" ]; then
  echo -e "${CYAN}No files to scan ($SCOPE).${NC}"
  exit 0
fi

echo -e "${CYAN}Scanning $SCOPE for secrets...${NC}"

# Build grep ignore file (global pattern matching)
if [ -f "$IGNORE_FILE" ]; then
  GREP_IGNORE=$(grep -vE '^\s*(#|$)' "$IGNORE_FILE" | tr '\n' '|' | sed 's/|$//')
else
  GREP_IGNORE=""
fi

# Scan with grep -n for speed (one pass per file)
while IFS= read -r file; do
  [ -z "$file" ] && continue
  [ ! -f "$file" ] && continue

  CONTENT=$(git show :"$file" 2>/dev/null || cat "$file" 2>/dev/null) || continue

  MATCHES=$(echo "$CONTENT" | grep -nE "$PATTERN" 2>/dev/null || true)
  if [ -z "$MATCHES" ]; then
    continue
  fi

  while IFS=: read -r line_num match_line; do
    [ -z "$line_num" ] && continue
    if [ -n "$GREP_IGNORE" ]; then
      if echo "$match_line" | grep -qE "$GREP_IGNORE" 2>/dev/null; then
        continue
      fi
    fi
    echo -e "${RED}  Potential secret in ${file}:${line_num}${NC}"
    echo "    $(echo "$match_line" | sed 's/^[[:space:]]*//' | head -c 120)"
    HAS_ERROR=1
  done <<< "$MATCHES"
done <<< "$FILES"

if [ "$HAS_ERROR" -eq 1 ]; then
  echo ""
  echo -e "${RED}SECRETS DETECTED. Commit blocked.${NC}"
  echo -e "${YELLOW}  Remove or replace with environment variables.${NC}"
  echo -e "${YELLOW}  False positive? Add to .secretsignore${NC}"
  exit 1
else
  echo -e "${CYAN}No secrets found in $SCOPE.${NC}"
  exit 0
fi

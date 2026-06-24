#!/bin/bash
# =============================================================================
# ClaimFlow CI Code Review Pipeline
# Demonstrates: non-interactive mode, staged prompts, split passes,
#               independent review instance, CLAUDE.md, structured JSON output
# =============================================================================

set -e

SRC_DIR="./src"
OUTPUT_DIR="./review-output"
PROMPT_FILE="./ci-review/prompts/v3-few-shot.txt"
SCHEMA_FILE="./ci-review/schemas/findings.schema.json"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$OUTPUT_DIR/findings_${TIMESTAMP}.json"

if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: prompt file not found: $PROMPT_FILE" >&2
  exit 1
fi
PROMPT=$(cat "$PROMPT_FILE")

FILES=(
  "src/auth/login.js"
  "src/middleware/authMiddleware.js"
  "src/db/connection.js"
  "src/routes/userRoutes.js"
  "src/services/userService.js"
  "src/services/emailService.js"
  "src/config/config.js"
  "src/models/User.js"
  "src/jobs/cleanupJob.js"
  "src/utils/pagination.js"
  "src/tests/unit/userService.test.js"
  "src/tests/integration/auth.test.js"
  "src/types/index.js"
  "src/scripts/seedDb.js"
)

echo "=============================================="
echo "  ClaimFlow CI Review Pipeline"
echo "  Files: ${#FILES[@]} | Timestamp: $TIMESTAMP"
echo "  Prompt: $PROMPT_FILE"
echo "=============================================="
echo ""

# Temp workspace for per-file JSON arrays; merged into one array at the end.
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

# ==============================================================================
# PASS 1: Per-file review (catches local bugs — null deref, SQL injection, etc.)
# Non-interactive: -p flag ensures Claude exits after each run.
# Independent instance: fresh `claude -p` call per file = no memory of prior files.
# Each call returns a JSON array of findings matching findings.schema.json.
# ==============================================================================

echo "--- PASS 1: Per-File Review (JSON) ---"

i=0
for FILE in "${FILES[@]}"; do
  if [ ! -f "$FILE" ]; then
    echo "SKIP: $FILE not found"
    continue
  fi

  echo "Reviewing: $FILE"

  # Staged prompt (v3 few-shot) + the file under review. JSON array out only.
  claude -p "
$PROMPT

## File to Review (path: $FILE):
$(cat "$FILE")
" --output-format text 2>/dev/null > "$WORK_DIR/finding_$i.json" || true

  i=$((i + 1))
done

# ==============================================================================
# PASS 2: Cross-file review (catches architectural issues spanning files)
# Separate Claude invocation; emits findings in the same JSON schema so the
# combined report is a single valid array.
# ==============================================================================

echo "--- PASS 2: Cross-File Architectural Review (JSON) ---"

CROSS_FILE_INPUT=""
for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    CROSS_FILE_INPUT+="

=== FILE: $FILE ===
$(cat "$FILE")
"
  fi
done

claude -p "
You are a senior architect reviewing a multi-file pull request for cross-cutting issues.

## What to look for (cross-file only — issues that span multiple files):
- API contract mismatches (route returns data the model doesn't expose correctly)
- Error propagation gaps (service throws, route doesn't catch)
- Inconsistent authorization patterns across routes
- Shared type definitions that contradict actual usage
- Missing fields in responses that callers depend on

## DO NOT FLAG:
- Per-file local bugs (assume those were caught in per-file review)
- Style or formatting

## Output Format:
Respond with ONLY a JSON array (no preamble, no markdown fences). Each element is an
object with exactly these fields: \"file\", \"line\", \"severity\"
(\"Critical\"|\"Major\"|\"Minor\"), \"issue\", \"fix\". Name the involved files inside
the \"issue\" text. If there are no findings, respond with [].

## All files in this PR:
$CROSS_FILE_INPUT
" --output-format text 2>/dev/null > "$WORK_DIR/finding_cross.json" || true

# ==============================================================================
# Combine every per-file + cross-file JSON array into one valid array.
# jq -s flattens the array-of-arrays; malformed/empty responses are dropped.
# ==============================================================================

if command -v jq >/dev/null 2>&1; then
  cat "$WORK_DIR"/finding_*.json 2>/dev/null \
    | jq -s 'map(select(type == "array")) | add // []' \
    > "$REPORT_FILE"
else
  echo "WARN: jq not found — concatenating raw responses without validation." >&2
  cat "$WORK_DIR"/finding_*.json 2>/dev/null > "$REPORT_FILE"
fi

COUNT=0
if command -v jq >/dev/null 2>&1; then
  COUNT=$(jq 'length' "$REPORT_FILE" 2>/dev/null || echo 0)
fi

echo ""
echo "=============================================="
echo "  Review complete. Findings: $COUNT"
echo "  Report: $REPORT_FILE"
echo "  Schema: $SCHEMA_FILE"
echo "=============================================="

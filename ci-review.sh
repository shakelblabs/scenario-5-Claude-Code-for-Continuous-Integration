#!/bin/bash
# =============================================================================
# ClaimFlow CI Code Review Pipeline
# Demonstrates: non-interactive mode, staged prompts, split passes,
#               independent review instance, CLAUDE.md, structured output
# =============================================================================

set -e

SRC_DIR="./src"
OUTPUT_DIR="./review-output"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$OUTPUT_DIR/review_${TIMESTAMP}.txt"

FILES=(
  "src/auth/login.js"
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
) "src/middleware/authMiddleware.js"
 

echo "=============================================="
echo "  ClaimFlow CI Review Pipeline"
echo "  Files: ${#FILES[@]} | Timestamp: $TIMESTAMP"
echo "=============================================="
echo ""

# ==============================================================================
# PASS 1: Per-file review (catches local bugs — null deref, SQL injection, etc.)
# Non-interactive: -p flag ensures Claude exits after each run
# Independent instance: fresh claude -p call per file = no memory of prior files
# ==============================================================================

echo "--- PASS 1: Per-File Review ---" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

for FILE in "${FILES[@]}"; do
  if [ ! -f "$FILE" ]; then
    echo "SKIP: $FILE not found"
    continue
  fi

  echo "Reviewing: $FILE" | tee -a "$REPORT_FILE"
  echo "---" | tee -a "$REPORT_FILE"

  # STEP 2 (Staged prompt): Explicit criteria + few-shot example baked in
  # STEP 4 (Independent instance): Fresh `claude -p` per file, no shared context
  claude -p "
You are a senior code reviewer. Review the file below for REAL bugs only.

## Explicit Review Criteria (flag ONLY these):
- SQL injection via string interpolation
- Null/undefined dereference without guard
- Unhandled promise rejection in async functions
- Plaintext password storage or comparison
- Missing auth/authorization on protected routes
- JWT tokens with no expiry
- Hardcoded secrets in source code
- DB connection pool missing max/timeout/error handler

## DO NOT FLAG:
- Code style, formatting, whitespace
- Naming conventions
- Refactoring suggestions with no functional impact

## Few-Shot Example of a REAL bug to flag:
BAD (flag this):
  const user = await db.query('SELECT * FROM users WHERE id = ' + id);
REASON: SQL injection — use parameterized query instead.

## Few-Shot Example of a NON-issue to skip:
BAD style (do NOT flag):
  const foo = x => x + 1   // could use function keyword
REASON: Arrow function vs function keyword is cosmetic — skip.

## Output Format (findings only, no preamble):
File: <path>
Line: <number>
Severity: <Critical | Major | Minor>
Issue: <one sentence>
Fix: <concrete fix>

## File to Review:
$(cat "$FILE")
" 2>/dev/null >> "$REPORT_FILE"

  echo "" | tee -a "$REPORT_FILE"
done

# ==============================================================================
# PASS 2: Cross-file review (catches architectural issues spanning multiple files)
# Sends summaries of all files — avoids attention dilution of dumping full code
# ==============================================================================

echo "" | tee -a "$REPORT_FILE"
echo "--- PASS 2: Cross-File Architectural Review ---" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Build a condensed multi-file summary for cross-file pass
CROSS_FILE_INPUT=""
for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    CROSS_FILE_INPUT+="

=== FILE: $FILE ===
$(cat "$FILE")
"
  fi
done

# STEP 3: Cross-file pass — separate Claude invocation, looks across all files
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
File: <file where issue manifests>
Line: <line>
Severity: <Critical | Major | Minor>
Issue: <describe the cross-file contract/propagation problem>
AffectedFiles: <comma-separated list of involved files>
Fix: <concrete fix>

## All files in this PR:
$CROSS_FILE_INPUT
" 2>/dev/null >> "$REPORT_FILE"

echo ""
echo "=============================================="
echo "  Review complete. Report: $REPORT_FILE"
echo "=============================================="

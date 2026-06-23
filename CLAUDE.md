# CLAUDE.md — ClaimFlow Code Review Standards

## Project Overview
ClaimFlow is a Node.js + Express API service. Reviews must be security-aware, production-focused, and actionable.

---

## Review Criteria — Flag These (Real Bugs Only)

### 🔴 Critical (must fix before merge)
- SQL injection via string interpolation (use parameterized queries only)
- Plaintext password storage or comparison (must use bcrypt)
- Missing authentication/authorization on protected routes
- Null/undefined dereference without guard (e.g. `rows[0].field` without checking `rows[0]`)
- Unhandled promise rejections in route handlers (must have try/catch)
- Secrets or credentials hardcoded in source code
- JWT tokens missing expiry (`expiresIn`)

### 🟠 Major (should fix)
- Missing input validation on API endpoints
- DB connection pool misconfiguration (no max, no timeout, no error handler)
- Race conditions in background jobs
- Error handlers that swallow exceptions silently
- API responses that expose password fields
- CORS set to `*` in non-development environments

### 🟡 Minor (worth noting)
- Missing test cases for error/null paths
- `process.exit()` before cleanup
- Hardcoded credentials in test files
- Missing fields in shared type definitions

---

## Do NOT Flag (Skip These)
- Cosmetic formatting or whitespace
- Arrow function vs regular function style preference
- Variable naming style (camelCase vs other)
- Comment density or documentation length
- Import ordering
- Code that "could be refactored" with no functional impact

---

## Severity Definitions
| Severity | Meaning |
|----------|---------|
| Critical | Security vulnerability or data loss risk — block merge |
| Major | Reliability or correctness issue — fix before ship |
| Minor | Code quality issue — fix in follow-up |

---

## Output Format Required
Every finding must follow this exact structure:

```
File: <relative path>
Line: <line number or range>
Severity: <Critical | Major | Minor>
Issue: <one-sentence description of the actual problem>
Fix: <concrete suggested fix>
```

Only output findings. No preamble, no summary paragraphs, no section headers.

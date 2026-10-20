# /security-review

Runs a structured security review against the current diff or a specified path.
Checks against OWASP Top 10 and common API/web vulnerabilities. Produces
documented findings that become permanent evidence on the PR.

## When to run

- Required on any PR touching: authentication, authorization, payments,
  user data, file uploads, external API calls, or environment config
- Recommended on every PR (add to /pr-ready checklist for your project)
- Before any deployment to production

## Usage

```
/security-review              — review current git diff
/security-review src/auth/    — review a specific path
/security-review PROJ-123     — review changes for a specific ticket
```

## Checklist

Work through every category. Report each finding with file, line, severity,
and a specific fix — not just a label.

---

### A01 — Broken Access Control

- [ ] Every endpoint checks authorization before returning data
- [ ] Authorization checks use a consistent pattern (not ad-hoc per route)
- [ ] No direct object references without ownership verification
      (e.g. `/api/users/{id}` checks that the caller owns `{id}`)
- [ ] Admin or privileged routes have explicit role checks
- [ ] No sensitive routes accidentally exposed as public

### A02 — Cryptographic Failures

- [ ] Passwords hashed with bcrypt, argon2, or scrypt — not MD5/SHA1/plain
- [ ] Sensitive data (SSN, payment card, health data) encrypted at rest
- [ ] TLS used for all external communications — no HTTP endpoints in prod
- [ ] Secrets not hardcoded; loaded from environment or secrets manager
- [ ] JWTs: algorithm is `RS256` or `ES256`, not `none` or `HS256` with a weak secret

### A03 — Injection

- [ ] All database queries use parameterized statements or an ORM — no string concatenation
- [ ] Shell commands use argument arrays, not interpolated strings
- [ ] File paths validated and constrained to an allowed directory (path traversal)
- [ ] Template engines: user input escaped before rendering
- [ ] XML/HTML input: sanitized before parsing or rendering

### A04 — Insecure Design

- [ ] Rate limiting on authentication endpoints and public APIs
- [ ] Sensitive operations (password reset, email change) require re-authentication
- [ ] Bulk data endpoints paginated and scoped — no "return all users" endpoints
- [ ] Error messages do not reveal stack traces, file paths, or internal structure

### A05 — Security Misconfiguration

- [ ] No debug mode, verbose logging, or development flags enabled in production paths
- [ ] CORS policy is explicit — no `Access-Control-Allow-Origin: *` on authenticated routes
- [ ] Security headers present: `Content-Security-Policy`, `X-Frame-Options`,
      `X-Content-Type-Options`, `Strict-Transport-Security`
- [ ] No default credentials, example configs, or unused dependencies

### A06 — Vulnerable and Outdated Components

- [ ] No new dependency added without checking for known CVEs
      (check: `npm audit`, `pip-audit`, `trivy`, or Snyk)
- [ ] No dependency on a package that is abandoned or has open critical CVEs
- [ ] No pinning to a version with a known vulnerability just to avoid upgrading

### A07 — Authentication Failures

- [ ] Session tokens have expiry; refresh tokens rotate on use
- [ ] Failed login attempts rate-limited and logged
- [ ] Password reset tokens: single-use, time-limited, invalidated on use
- [ ] Multi-factor authentication not bypassable via API (no MFA-skipping endpoints)
- [ ] Logout invalidates the token server-side — not just client-side deletion

### A08 — Software and Data Integrity

- [ ] No `eval()`, `exec()`, `Function()`, `pickle.loads()` on user-supplied input
- [ ] Deserialization of external data uses strict schema validation (e.g. zod, pydantic)
- [ ] Webhook payloads verified with HMAC signature before processing
- [ ] File uploads: type validated server-side (not just by extension), stored outside webroot

### A09 — Logging and Monitoring

- [ ] Authentication events logged: login, logout, failed attempts, password reset
- [ ] Authorization failures logged with user ID and attempted resource
- [ ] No passwords, tokens, or PII written to logs
- [ ] Errors logged with enough context to diagnose — not swallowed silently

### A10 — Server-Side Request Forgery (SSRF)

- [ ] URLs from user input validated against an allowlist before making HTTP requests
- [ ] Internal network ranges blocked from user-supplied URL targets
      (169.254.x.x, 10.x.x.x, 172.16-31.x.x, 192.168.x.x)
- [ ] Redirects from external URLs not followed blindly

---

## Output format

```
/security-review findings — [scope] — [timestamp]
==================================================

CRITICAL (block merge — fix before this branch goes anywhere)
--------------------------------------------------------------
[file]:[line] — [vulnerability type]
  Finding: [what the problem is]
  Risk: [what an attacker could do]
  Fix: [specific code change]

HIGH (must fix before production deployment)
--------------------------------------------
[file]:[line] — [vulnerability type]
  Finding: [what the problem is]
  Fix: [specific code change]

MEDIUM (fix in a follow-up ticket before next release)
-------------------------------------------------------
[file]:[line] — [observation]
  Fix: [recommendation]

PASSED CHECKS
-------------
[list every category that was reviewed and found clean]

Summary: N critical, N high, N medium
Reviewed: [files or diff range]
```

Attach this output as a comment on the PR. It becomes the security evidence
in the deployment trust chain.

## Severity definitions

- **CRITICAL**: exploitable without authentication, or exposes PII/credentials directly
- **HIGH**: exploitable by an authenticated user, or enables privilege escalation
- **MEDIUM**: defense-in-depth gap, increases risk but not directly exploitable alone
- **INFO**: best-practice suggestion, no direct security impact

## What this skill does NOT do

- Does not perform penetration testing or dynamic analysis
- Does not scan infrastructure, only application code
- Does not replace a dedicated security audit for high-risk systems
- Does not verify runtime behavior — only static code analysis
- Does not check third-party service configurations (e.g. AWS IAM policies, Cloudflare rules)

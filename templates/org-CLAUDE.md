# [Organization Name] — AI Development Standards

This file defines the organization-wide AI development standards inherited by all
project CLAUDE.md files. Every AI session across every pod reads these rules.

Project-level CLAUDE.md files extend this content — they never override it.
If a project needs an exception, it requires a written ADR and team lead approval.

---

## AI autonomy tiers

Three tiers define what AI can do without a human in the loop.
Every team member must understand which tier applies to each action.

### Tier 1 — Suggest
AI generates output; a human reviews and applies it manually.

- In-editor code completions (Copilot)
- PR description drafts
- Test generation suggestions
- Documentation drafts from `/spec-check`
- Diagnosis from `/diagnose-pipeline`

**Human gate:** Review and decide before anything is committed or pushed.

### Tier 2 — Execute
AI runs and applies changes; a human reviews the result via PR.

- `/spec-check` — edits documentation files, reviewed in PR
- `/code-review` — posts findings, developer decides which to address
- `/feature-start` — produces dev brief, developer approves before coding
- `/onboard` — generates orientation guide, no code changes
- `/release-notes` — generates draft, human reviews before sending to client

**Human gate:** All Tier 2 changes go through a PR with at least one reviewer.

### Tier 3 — Deploy
AI acts autonomously on live systems without prior human review.

Permitted **only** for the triage agent, **only** in dev/staging, **only** for:
- `config` failures: missing or wrong environment variables
- `dependency` failures: lockfile inconsistencies (`npm ci`, `pip install`)

**Permanent restrictions — never Tier 3 regardless of environment:**
- Production deployments
- Infrastructure changes (Terraform, Kubernetes, cloud resources)
- Auth, IAM, secrets management
- Database migrations
- Any change affecting more than one pod's API contract
- Any failure the agent is not confident about

---

## Approved AI tools

| Tool | Permitted uses | Tier |
|------|---------------|------|
| Claude Code | Development sessions, skills, planning, review | 1–2 |
| GitHub Copilot | In-editor autocomplete only | 1 |
| Triage agent | Config/dependency auto-fix in dev/staging | 3 |

Adding a new AI tool to a project requires a written ADR and team lead sign-off.

---

## Global coding standards

All projects follow these standards unless an ADR explicitly overrides them.

**Security**
- No secrets or credentials in source code or commit history — ever
- All user inputs validated at system boundaries
- Dependencies checked for known CVEs before adding (`npm audit`, `pip-audit`, Snyk)
- `/security-review` required on any PR touching auth, payments, or user data

**Quality gates (every PR)**
- `/preflight` passed: build, lint, type check, unit tests
- `/spec-check` passed: no documentation gaps
- `/code-review` passed: no BLOCKING findings
- Human reviewer approved
- CI pipeline green

**Commit discipline**
- Every commit includes the JIRA ticket ID: `PROJ-123: description`
- No `.env` files committed — `.env.example` with placeholder values only
- No secrets in commit messages or PR descriptions

**Documentation**
- Every feature ships with updated documentation — no exceptions
- CLAUDE.md files reviewed when architecture changes
- ADRs written for all significant technical decisions

---

## Cross-pod rules

- Any change to a shared API contract requires an ADR and sign-off from affected pods
- Shared dependencies (libraries, services) managed through a designated pod owner
- Breaking changes announced to all pod leads at least one sprint in advance
- Cross-pod incidents escalate to the project tech lead within one business day

---

## Human ownership requirements

These decisions are never delegated to AI regardless of confidence level:

1. Final approval on every production deployment
2. All architecture decisions affecting multiple pods
3. All changes to authentication, authorization, or encryption
4. All data migrations
5. All exceptions to any rule in this document
6. All new AI tool introductions

---

## Context maintenance

- Every CLAUDE.md file has a named owner (see `CONTEXT-OWNERS.md`)
- Monthly context audit: owners review their files against current code
- CLAUDE.md updates are required when: architecture changes, patterns change,
  new conventions are adopted, or deprecated patterns are removed
- Stale CLAUDE.md files are a defect — treat them like bugs

---

## References

- Skills library: `.claude/skills/`
- Skill authoring guide: `docs/skill-authoring.md`
- JIRA MCP setup: `docs/setup-jira-mcp.md`
- CI/CD MCP setup: `docs/setup-ci-mcp.md`
- Triage agent setup: `docs/setup-triage-agent.md`
- Cross-pod process: `docs/cross-pod-process.md`
- Context audit: `docs/context-audit.md`

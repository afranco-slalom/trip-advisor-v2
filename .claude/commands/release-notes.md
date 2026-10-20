# /release-notes

Generates release notes from completed JIRA tickets. Produces two versions:
a client-facing summary in plain language and an internal technical changelog.

## When to run

- At the end of a sprint before the client demo
- Before any production deployment
- When a stakeholder asks "what's in this release?"

## Usage

```
/release-notes                        — current sprint
/release-notes sprint:42              — specific sprint by number
/release-notes since:2024-10-01       — everything since a date
/release-notes since:v1.3.0           — everything since a release tag
```

## Process

**Step 1 — Fetch completed tickets**

Use the JIRA MCP to fetch tickets that are:
- Status: Done (or your team's equivalent "complete" status)
- In the specified sprint, or resolved since the specified date/tag
- Exclude: sub-tasks, internal tasks labeled `no-release-notes`, spike tickets

Group tickets by type:
- **Feature** (Story, Feature): new capability
- **Fix** (Bug): something that was broken is now fixed
- **Improvement** (Task, Improvement): enhancement to existing functionality
- **Infrastructure** (Ops, DevOps, Tech Debt): internal — include in technical changelog only

**Step 2 — Generate client-facing release notes**

Write for a non-technical client stakeholder. Focus on outcomes, not implementation.
Do not mention file names, library versions, or internal architecture.

```
Release Notes — [Version or Sprint Name] — [Date]
==================================================

## What's new

### [Feature category or epic name]
- [What the user can now do, stated as a capability]
- [Another new capability]

### [Another category]
- [Capability]

## Improvements
- [Something that was slow is now faster, stated as the user experience]
- [Something that was confusing is now clearer]

## Bug fixes
- [What was happening that shouldn't have been, fixed]
- [Another fix — write from the user's perspective, not the code's]

---
Questions? Contact [project lead] at [email from CLAUDE.md]
```

**Step 3 — Generate internal technical changelog**

Write for the development team. Include implementation detail, affected services,
migration steps, and anything relevant to operations or future development.

```
Technical Changelog — [Version or Sprint] — [Date]
====================================================

## Features
- [PROJ-123] [Title]: [implementation summary — what changed, where]
- [PROJ-124] [Title]: [implementation summary]

## Bug fixes
- [PROJ-130] [Title]: root cause was [X], fixed by [Y] in [file:line]

## Infrastructure / internal
- [PROJ-140] [Title]: [what changed and operational impact]

## Breaking changes
[List any changes that require action from other teams or consumers]
- [What changed] → [What callers need to do]

## Migration steps
[List any steps required during or after deployment]
1. [Step]
2. [Step]

## Affected services
[Which services need to be redeployed and in what order]
```

**Step 4 — Post to JIRA**

Post both versions to the JIRA release (if a Fix Version is configured) or
as a comment on the sprint epic.

## Output

Save both versions locally:
- `docs/releases/[version]-client.md` — client-facing version
- `docs/releases/[version]-internal.md` — technical changelog

Print the client-facing version to the session for immediate use
(pasting into the client email or demo notes).

## What this skill does NOT do

- Does not deploy or tag releases in git — it only generates documentation
- Does not update JIRA ticket statuses
- Does not include tickets that are not in "Done" status
- Does not write notes for tickets labeled `no-release-notes` or `internal-only`

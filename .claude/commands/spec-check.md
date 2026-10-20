# /spec-check

Finds gaps between what the code does and what the documentation says.
Runs a fresh scan to surface gaps without bias, then applies fixes.

## When to run

- Before opening any PR that changes logic, APIs, or data models
- After a refactor that touched interfaces or behavior
- Whenever you suspect docs have drifted from code

## What it checks

- Feature specs and requirements docs vs. implemented behavior
- API documentation vs. actual endpoints, params, and response shapes
- Data model documentation vs. schema definitions
- README setup steps vs. current project structure
- Inline comments that describe behavior that no longer exists

## Process

**Step 1 — Fresh scan (read-only, no prior context)**

Spawn an Explore subagent with these instructions:

> You are a documentation auditor. Your only job is to find gaps between
> the code and the documentation. You have no prior context about this project.
> Read the docs first, then read the code, then report every place they disagree.
> Do not fix anything. Do not suggest improvements. Only report gaps.
>
> For each gap, output:
> - File: the doc file that is wrong or missing
> - Location: line number or section
> - Gap: one sentence describing what the doc says vs. what the code does
> - Severity: BLOCKING (wrong info that would mislead a developer) or MINOR (missing info)

The subagent should read:
- All files in `docs/`, `README.md`, any `*.md` spec files
- The source files most relevant to what the docs describe
- API route definitions, schema files, config files

**Step 2 — Review the gap report**

Present the gap report to the user before proceeding.
Ask: "Found N gaps. Proceed with fixes? (or select specific ones to fix)"

**Step 3 — Apply fixes**

For each approved gap:
- Update the doc file to match what the code actually does
- Do not change code to match docs — docs follow code, not the other way around
- Exception: if a gap reveals the code is wrong relative to a requirement,
  flag it as a code issue and do not touch the doc

**Step 4 — Output**

Produce a summary:
```
spec-check results
==================
Scanned: [list of doc files checked]
Gaps found: N (X blocking, Y minor)
Fixed: N
Skipped: N (list reasons)

Remaining issues requiring human decision:
- [any gaps that could not be resolved automatically]
```

Save this summary as a comment on the PR or as `spec-check-output.txt` if no PR is open.

## What this skill does NOT do

- Does not change source code (only docs)
- Does not rewrite docs for style or clarity — only corrects factual gaps
- Does not run tests or validate runtime behavior
- Does not modify API contracts (flags them as gaps for human review)

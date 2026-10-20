# /pr-ready

A pre-PR self-review checklist. Confirms the change is complete and reviewable
before a PR is opened or a review is requested.

Run this yourself before requesting human review — it is not a replacement for
/code-review, it is the gate before you ask others to spend time on your PR.

## Checklist

Work through each item in order. Report status for each one.

**Completeness**
- [ ] The change implements what the linked JIRA ticket requires
- [ ] All acceptance criteria in the ticket are addressed
- [ ] No commented-out code or debug statements left in
- [ ] No TODO comments added without a linked ticket

**Quality**
- [ ] /preflight passed (build, lint, type check, unit tests)
- [ ] /code-review run — all BLOCKING findings resolved
- [ ] /spec-check run — no documentation gaps remaining
- [ ] New logic has tests; new endpoints have integration tests

**PR hygiene**
- [ ] PR title follows the team's convention (check CLAUDE.md)
- [ ] PR description explains WHY, not just what changed
- [ ] PR description links to the JIRA ticket
- [ ] Acceptance criteria from the ticket are listed and checked off
- [ ] Diff is scoped to the ticket — no unrelated changes bundled in

**Review readiness**
- [ ] The change is small enough to review in one session
  (if over 400 lines of meaningful diff, consider splitting)
- [ ] Complex or non-obvious logic has an inline explanation
- [ ] Migration steps or deployment notes are in the PR description if needed

## Output format

```
/pr-ready results
=================
JIRA ticket: [ticket ID and title]

[PASS] Completeness (4/4)
[FAIL] Quality (2/4)
  → /code-review has 1 unresolved BLOCKING finding
  → /spec-check not yet run

[PASS] PR hygiene (5/5)
[PASS] Review readiness (3/3)

Not ready. Resolve the 2 quality issues above, then re-run /pr-ready.
```

If all pass:
```
/pr-ready results
=================
[PASS] Completeness (4/4)
[PASS] Quality (4/4)
[PASS] PR hygiene (5/5)
[PASS] Review readiness (3/3)

Ready for review. Attach this output to the PR description.
```

Paste the output into the PR description before requesting review. It tells
reviewers what was already checked so they can focus on judgment, not mechanics.

## What this skill does NOT do

- Does not open the PR (that is a human action)
- Does not run /code-review or /spec-check on your behalf — those must have
  been run already; this skill checks that they were
- Does not approve the change — it confirms it is reviewable

# /adr — Architecture Decision Record

**When to run:** Anytime a significant technical decision needs to be recorded.
Required for: cross-pod API changes, new AI tool adoption, major dependency
changes, auth/security design choices, and any exception to org standards.
Also useful for capturing any non-obvious decision you want future developers
to understand.

**Usage:**
```
/adr <one-line description of the decision>
```

Example: `/adr Migrate from session cookies to JWT for the auth service`

---

## Process

### Step 1 — Determine the next ADR number

List files in `docs/decisions/` and find the highest ADR-NNNN number.
The new ADR gets the next sequential number. Create the directory if it
does not exist.

### Step 2 — Read the codebase for context

Use a fresh Explore subagent to:
- Find all files relevant to the decision (the code it affects)
- Identify which pods or modules are involved
- Find any existing ADRs that are related (to link them)

This must be a **read-only** scan — do not modify any files in this step.

### Step 3 — Draft the ADR

Create `docs/decisions/ADR-NNNN-[short-title].md` using this exact structure:

```markdown
# ADR-NNNN: [Decision title]

**Date:** [YYYY-MM-DD]
**Status:** Proposed
**Author:** [session context or "unknown"]
**Affected pods:** [list all pods that must act on this decision]

---

## Context

[2-4 sentences: what situation or problem led to this decision?
What constraints or requirements shaped the options?]

## Decision

[1-3 sentences: what exactly was decided?
Be specific: library name + version, API shape, process step.
Avoid vague language like "we will improve X".]

## Consequences

### What changes
[Bulleted list of what will be different after this decision is implemented.]

### What each pod must do
[Per-pod: what action they need to take, and by when if known.]

### Rollback plan
[If this goes wrong, how do we revert? Or: "No rollback possible — justify here."]

## Alternatives considered

### [Alternative A]
**Pros:** [one line]
**Cons:** [one line — the reason it was not chosen]

### [Alternative B]
**Pros:** [one line]
**Cons:** [one line — the reason it was not chosen]

## References

- [Link to related ADRs, tickets, or documentation if applicable]
```

### Step 4 — Fill in the ADR content

Using the codebase scan from Step 2:
- Context: explain the current state and why it is not adequate
- Decision: be precise — if it is a library migration, name the old and new library
- Consequences: list every affected pod with a concrete action item
- Alternatives: include at least two alternatives with honest pros and cons

### Step 5 — Present to the user

Print the full ADR content in the response.
State which files are affected and which pod leads need to review.

Ask: "Should I save this to `docs/decisions/ADR-NNNN-[title].md`?"

Only save the file after explicit confirmation.

---

## What this skill does NOT do

- Does not open the PR or notify pod leads — that is a human action
- Does not execute the decision — the ADR documents it; implementation is separate
- Does not overwrite an existing ADR — each ADR is a permanent record
- Does not approve changes across pods — approval requires the cross-pod process

---

## Output format

The ADR is saved as a Markdown file in `docs/decisions/`.

After saving, print:
```
ADR saved: docs/decisions/ADR-NNNN-[title].md
Status: Proposed

Next steps:
1. Open a PR with this file
2. Tag affected pod leads for 48-hour async review (see docs/cross-pod-process.md)
3. Schedule the change once all pod leads have signed off
```

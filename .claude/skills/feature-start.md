# /feature-start

Reads a JIRA ticket and produces a development brief before any code is written.
Confirms requirements are clear, complete, and implementable — surfaces ambiguities
early when they are cheap to fix, not after implementation.

## When to run

- At the very start of every feature, before opening an editor
- When picking up a ticket someone else wrote
- When a ticket's scope is unclear

## Usage

```
/feature-start PROJ-123          # with JIRA — fetches ticket automatically
/feature-start                   # without JIRA — paste your requirements when prompted
```

## Process

**Step 1 — Read the requirements**

**If JIRA MCP is configured:**
Use the JIRA MCP server to fetch the full ticket:
- Title and description
- Acceptance criteria (all of them)
- Linked tickets (dependencies, parent epic)
- Attachments or linked design files if referenced
- Comments (especially any with clarifications from the requester)

**If no JIRA MCP is configured (or no ticket ID given):**
Ask the developer to provide the feature requirements directly:
```
No JIRA connection found. Please describe what you need to build:
- What is the feature?
- Who uses it and what problem does it solve?
- What are the acceptance criteria (how do you know it's done)?
- Are there any hard constraints (things that must not change)?
```
Proceed with the pasted requirements as the source of truth.
The brief will note that requirements came from a manual description,
not a tracked ticket.

**Step 2 — Assess completeness**

For each acceptance criterion, determine:
- Is it testable? Can you write a test that proves it passes?
- Is it unambiguous? Could two developers implement it differently and both be "correct"?
- Are there missing cases? (error states, empty states, permission boundaries, mobile vs desktop)

Flag each gap as:
- BLOCKING — cannot start without resolving this
- CLARIFY — implementable with a reasonable assumption, but should be confirmed
- ASSUMPTION — will proceed with stated assumption, document it

**Step 3 — Scan the codebase for impact**

Before proposing an approach, understand what already exists:
- Which files, modules, or services will this change touch?
- Are there existing patterns to follow (look in CLAUDE.md for conventions)?
- Are there other tickets open that touch the same area?
- What tests already exist that this feature must not break?

**Step 4 — Produce the development brief**

Output a structured brief the developer reviews before writing code:

```
Development Brief — [TICKET-ID]: [Title]
=========================================

JIRA: [link]
Epic: [parent epic if applicable]

## What to build
[Concrete description of the feature from the acceptance criteria — what
the system will do when this is done, in plain terms]

## Acceptance criteria
[ ] [criterion 1]
[ ] [criterion 2]
[ ] [criterion 3 — with any clarifying assumption noted inline]

## What NOT to build
[Explicitly scope out anything adjacent that is NOT in this ticket — prevents scope creep]

## Files likely affected
- [file or module] — [why it will change]
- [file or module] — [why it will change]

## Approach
[Proposed implementation approach — one paragraph. Flag if an architecture
decision is required before starting.]

## Gaps requiring clarification (resolve before coding)
BLOCKING:
  - [question] → suggested default if no answer by [timeframe]

CLARIFY:
  - [assumption being made] — confirm with [person/team] before PR

## Definition of done
- All acceptance criteria checked off
- /spec-check passes
- /code-review passes (no BLOCKING findings)
- /preflight passes
- Integration test covers [specific scenario]
```

**Step 5 — Gate before proceeding**

If there are BLOCKING gaps:
- Do not proceed with implementation
- Post the brief to the JIRA ticket as a comment
- Assign the blockers to the appropriate person

If there are only CLARIFY or ASSUMPTION items:
- Present the brief to the developer
- Ask: "Proceed with these assumptions? (yes / adjust)"
- On yes: save the brief as `docs/briefs/TICKET-ID.md` and start coding

## What this skill does NOT do

- Does not write any code
- Does not modify the JIRA ticket (read-only via MCP)
- Does not make architecture decisions — flags them for human resolution
- Does not guarantee the ticket is correctly scoped — that is the PM's responsibility

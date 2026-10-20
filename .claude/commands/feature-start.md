# /feature-start

Figures out the next task to work on and produces a development brief before
any code is written. Works with or without JIRA, with or without a ticket ID.
Surfaces ambiguities early — when they're cheap to fix, not after implementation.

## When to run

- At the very start of every feature, before opening an editor
- When you're not sure what to work on next
- When picking up a ticket someone else wrote
- When a ticket's scope is unclear

## Usage

```
/feature-start             # figures out the next task automatically
/feature-start PROJ-123    # jump straight to a specific JIRA ticket
```

## Process

**Step 1 — Determine what to work on**

Run this step only when no ticket ID was given. Goal: identify the single
best next task for the developer to work on.

**If JIRA MCP is configured:**
1. Query JIRA for tickets in the current sprint assigned to the current user
   with status "To Do" or "In Progress", ordered by priority
2. If one ticket: proceed with it automatically — state which ticket was selected
3. If multiple: present the list and ask the developer which to pick up:
   ```
   Found 3 tickets in your sprint:
     1. PROJ-45 [High] Add user authentication (To Do)
     2. PROJ-52 [Medium] Fix date formatting on itinerary view (To Do)
     3. PROJ-38 [Low] Update onboarding copy (In Progress)
   Which would you like to work on? (Enter number or ticket ID)
   ```
4. If none assigned: show unassigned "To Do" tickets in the sprint and ask

**If no JIRA MCP is configured:**
1. Check for `docs/backlog.md` — a prioritized list of features to build.
   If it doesn't exist, check `docs/product-requirements.md` for user flows or features.
2. Scan git log (`git log --oneline -50`) and existing source files to understand
   what has already been implemented
3. Cross-reference the feature list against implemented code to find the next
   unbuilt feature
4. Present the finding and ask for confirmation before proceeding:
   ```
   Based on your docs and git history, the next unimplemented feature appears to be:

   → [Feature name]: [one-sentence description]
   Source: docs/backlog.md, line N

   Already implemented (skipped):
   ✓ [Feature A] — found in src/...
   ✓ [Feature B] — found in src/...

   Proceed with this feature? (yes / pick a different one)
   ```
5. If the developer picks a different feature, ask them to name it or show the full list

**If no docs and no JIRA:**
Ask the developer to describe what to build:
```
No task list or JIRA connection found. Please describe the feature:
- What should it do?
- Who uses it?
- How do you know it's done (acceptance criteria)?
- Any hard constraints?
```

---

**Step 2 — Read the full requirements**

Once the task is identified, gather the complete requirements:

- **JIRA**: fetch title, description, all acceptance criteria, linked tickets,
  attachments, and clarifying comments
- **docs/backlog.md**: read the full entry for this feature including any
  sub-tasks, acceptance criteria, and notes
- **Manual description**: use what the developer provided

---

**Step 3 — Assess completeness**

For each acceptance criterion, determine:
- Is it testable? Can you write a test that proves it passes?
- Is it unambiguous? Could two developers implement it differently?
- Are there missing cases? (error states, empty states, permissions, mobile)

Flag each gap as:
- **BLOCKING** — cannot start without resolving this
- **CLARIFY** — implementable with an assumption, but should be confirmed
- **ASSUMPTION** — proceeding with a stated assumption, documented in the brief

---

**Step 4 — Scan the codebase for impact**

Before proposing an approach:
- Which files, modules, or services will this change touch?
- Are there existing patterns to follow? (check CLAUDE.md conventions)
- What tests already exist that this feature must not break?

---

**Step 5 — Produce the development brief**

```
Development Brief — [ID or short title]: [Feature name]
=========================================================

Source: [JIRA link | docs/backlog.md line N | manual description]

## What to build
[Concrete description of the feature — what the system does when this is done]

## Acceptance criteria
[ ] [criterion 1]
[ ] [criterion 2]
[ ] [criterion 3 — with any assumption noted inline]

## What NOT to build
[Explicitly scope out adjacent work not in this task]

## Files likely affected
- [file or module] — [why it will change]

## Approach
[Proposed implementation — one paragraph. Flag if an ADR is required first.]

## Gaps requiring clarification
BLOCKING:
  - [question] → suggested default if no answer by [timeframe]
CLARIFY:
  - [assumption] — confirm with [person] before PR

## Definition of done
- All acceptance criteria checked off
- /spec-check passes
- /code-review passes (no BLOCKING findings)
- /preflight passes
```

---

**Step 6 — Gate before proceeding**

If there are BLOCKING gaps:
- Do not proceed
- If JIRA is configured: post the brief as a comment on the ticket so the PM sees the blockers
- Tell the developer who to contact to resolve each blocker

If only CLARIFY or ASSUMPTION items:
- Present the brief to the developer
- Ask: "Proceed with these assumptions? (yes / adjust)"
- On yes:
  1. Save the brief as `docs/briefs/[ID].md`
  2. **If JIRA is configured**, update the ticket — do all three steps, but if any call
     fails treat it as a warning (log what failed) and continue; never block
     implementation because of a JIRA write error:
     - Query available transitions: `GET /rest/api/3/issue/{key}/transitions`
     - Find the transition named "In Progress" or "In Development" (match case-insensitively)
     - If found: `POST /rest/api/3/issue/{key}/transitions` with that transition ID
     - Assign to current user (ATLASSIAN_EMAIL from .mcp.json):
       `PUT /rest/api/3/issue/{key}/assignee`
     - Post the dev brief as a comment on the ticket
     - Confirm to the developer:
       ```
       ✓ PROJ-123 assigned to you and moved to In Progress
       ✓ Dev brief posted as JIRA comment
       ```
     - If JIRA is not configured or any call fails:
       ```
       ⚠ JIRA not configured — skipping ticket update (set up .mcp.json to enable)
       ```
  3. Start coding

---

## docs/backlog.md format (recommended for non-JIRA projects)

If your project doesn't use JIRA, keep a simple ordered backlog file.
The skill reads this file to determine what to work on next.

```markdown
# Backlog

## Ready to build (in priority order)

### [Feature name]
What: [one paragraph description]
Acceptance criteria:
- [ ] [criterion]
- [ ] [criterion]
Notes: [any constraints or decisions]

### [Next feature]
...

## Done
- [Feature name] — completed [date]
- [Feature name] — completed [date]
```

Move features from "Ready to build" to "Done" when they ship.
The skill uses the "Done" section to understand what's already implemented.

---

## What this skill does NOT do

- Does not write any code
- Does not close or delete JIRA tickets
- Does not make architecture decisions — flags them for human resolution
- Does not guarantee the ticket is correctly scoped — that is the PM's responsibility
- Does not assign tickets or change their status in JIRA

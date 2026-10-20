# /onboard

Walks a new developer through a module or codebase. Reads the code and
CLAUDE.md context, then produces a guided orientation — what exists, why it
exists, and where to start.

## When to run

- First day on a new project or module
- After being assigned to an area you have never touched
- When picking up a ticket in unfamiliar code

## Usage

```
/onboard                    — onboard to the current project root
/onboard src/api/           — onboard to a specific module or directory
/onboard src/api/ PROJ-42   — onboard to a module AND a specific first ticket
```

## Process

**Step 1 — Read the context**

Read in this order:
1. CLAUDE.md at the project root (or nearest parent)
2. CLAUDE.md inside the target module if one exists
3. The module's main entry point and directory structure

**Step 2 — Produce the orientation**

```
Onboarding: [module or project name]
======================================

## What this does
[One paragraph in plain language — what this module's job is and
 why it exists in the system]

## How it fits in
[Where this module sits relative to other parts of the system —
 what calls it, what it calls, what data it owns]

## Key files to know
[file or directory] — [what it does, why it matters]
[file or directory] — [what it does, why it matters]
[file or directory] — [one place you will spend a lot of time]

## Patterns used here
[Pattern name]: [brief explanation with an example file/line]
[Pattern name]: [brief explanation]

## Things that might surprise you
- [A non-obvious convention or decision that differs from the norm]
- [A known quirk, workaround, or historical decision worth understanding]
- [Any areas flagged as needing improvement — so you don't accidentally continue a bad pattern]

## How to run this locally
[Exact commands to get the module running, including any required env vars
 not already covered by .env.example]

## How to run its tests
[Exact command — unit tests and integration tests separately if applicable]
```

**Step 3 — First ticket orientation (if a ticket ID was given)**

Read the JIRA ticket via MCP, then add:

```
## Your first ticket: [TICKET-ID] — [title]
[Link]

What this ticket is asking for, in context of the module you just learned.
Which files you will likely touch. Which patterns apply.

Suggested starting point:
  1. [First concrete action — a specific file to read or function to understand]
  2. [Second step]
  3. [Where to write your first line of code]

Run /feature-start [TICKET-ID] to get the full development brief.
```

**Step 4 — Offer next steps**

Always end with:

```
Next steps:
- Run /feature-start [first ticket ID] to get the full development brief
- Run /preflight to confirm your local environment is set up correctly
- Ask [team lead name from CLAUDE.md] if anything above is unclear
```

## What this skill does NOT do

- Does not make code changes
- Does not generate tests or boilerplate
- Does not replace a human pairing session — it prepares you for one
- Does not cover areas outside the requested module scope

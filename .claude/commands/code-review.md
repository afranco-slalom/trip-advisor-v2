# /code-review

Reviews the current diff or a specified path for correctness bugs, standards
violations, test coverage gaps, and security issues. Produces structured findings
a human reviewer can act on directly.

## When to run

- Before opening a PR (run yourself before requesting review)
- As an automated gate on every PR (CI triggers this via the review hook)
- After a large AI-generated change before committing

## Scope

Default: review the current git diff (`git diff main...HEAD`).
With a path argument: review only files at that path.
Example: `/code-review src/api/payments.py`

## Review checklist

**Correctness**
- Logic errors: off-by-one, wrong conditionals, incorrect operator precedence
- Unhandled edge cases: null/undefined inputs, empty collections, zero values
- Error paths: exceptions caught and handled, not silently swallowed
- Async issues: race conditions, missing awaits, unhandled promise rejections
- Data mutation: unexpected side effects on shared state

**Standards (check against CLAUDE.md in scope)**
- Naming conventions followed
- No forbidden patterns used
- Dependencies on the approved list
- Architecture layer boundaries respected (e.g. no DB calls from UI layer)

**Test coverage**
- New logic has corresponding tests
- Edge cases identified in correctness check have test coverage
- Tests are not just happy-path — failure cases covered
- No tests deleted without explanation

**Security (baseline)**
- No secrets, tokens, or credentials in code or comments
- User inputs validated before use
- No SQL string concatenation (use parameterized queries)
- No `eval()` or equivalent dynamic execution of untrusted input
- Dependencies added are not known-vulnerable versions

## Output format

Report findings grouped by severity. Be specific: file, line number, what is wrong,
and what the fix should be. Do not pad the report with observations that are not
actionable.

```
/code-review findings
=====================
Reviewed: [files or diff range]

BLOCKING (must fix before merge)
---------------------------------
[file]:[line] — [what is wrong]
  Fix: [specific change to make]

RECOMMENDED (should fix, not blocking)
---------------------------------------
[file]:[line] — [what is wrong]
  Fix: [specific change to make]

INFORMATIONAL (consider for a follow-up)
-----------------------------------------
[file]:[line] — [observation]

Summary: N blocking, N recommended, N informational
```

If there are zero findings in a category, omit that section.
If there are zero findings total, say so explicitly: "No issues found."

## What this skill does NOT do

- Does not reformat or restyle code (that is a linter's job)
- Does not rewrite working code for preference reasons
- Does not flag issues already tracked in open tickets (check JIRA context if available)
- Does not review generated migration files, lock files, or auto-generated code
- Does not guarantee security — this is a baseline check, not a security audit

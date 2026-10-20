# /preflight

Validates the project locally before anything reaches CI. Catches the majority
of pipeline failures at zero CI cost — no waiting for a pipeline to spin up and fail.

## When to run

- Before every push (enforced automatically by the pre-push git hook)
- Manually before opening a PR on a complex change
- After switching branches or pulling a large merge

## What it checks

Run each check in order. Stop and report on first BLOCKING failure — do not
continue past a build failure.

**1. Dependency integrity**
- Lock file is consistent with the dependency manifest
  (package-lock.json matches package.json, poetry.lock matches pyproject.toml, etc.)
- No dependency added to code that is not in the manifest

**2. Environment variables**
- All env vars the app reads at startup are present in the local environment
  or in the `.env` file
- Read the app's startup code and config files to determine what is required
- If `.env.example` exists, verify every key in it has a value set locally

**3. Build**
- Run the project's build command (check CLAUDE.md for the correct command)
- Report the full error output if it fails — do not summarize

**4. Lint and type check**
- Run the project's lint command
- Run the type checker if the project uses one (tsc, mypy, pyright, etc.)
- Report each violation with file and line number

**5. Fast tests**
- Run unit tests only (skip integration tests that require external services)
- If the project has a test:unit or test:fast script, use that
- Report failures with the test name and failure message

## Output format

```
/preflight results — [timestamp]
================================
[PASS] Dependency integrity
[PASS] Environment variables
[FAIL] Build
  → Error: [first error line]
  → File: [file]:[line]
  → Full output: [...]

Stopped after first blocking failure.
Fix the build error and re-run /preflight.
```

If all checks pass:
```
/preflight results — [timestamp]
================================
[PASS] Dependency integrity
[PASS] Environment variables
[PASS] Build
[PASS] Lint (0 errors, 2 warnings)
[PASS] Unit tests (47 passed)

All checks passed. Safe to push.
```

## What this skill does NOT do

- Does not run integration tests or tests requiring a database or external API
- Does not deploy or push anything
- Does not fix errors — only reports them
- Does not check test coverage thresholds (that is /pr-ready's job)

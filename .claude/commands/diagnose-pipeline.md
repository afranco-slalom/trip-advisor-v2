# /diagnose-pipeline

Reads CI/CD pipeline failure logs directly and produces a structured diagnosis.
Eliminates the copy-paste loop — Claude reads the logs, you read the fix.

## When to run

- Any time a pipeline fails
- Before retrying a failed pipeline (understand why it failed first)
- When a failure message is cryptic and you need context from the full log

## Usage

```
/diagnose-pipeline
/diagnose-pipeline [run-id]
/diagnose-pipeline [branch-name]
```

With no argument: fetches the most recent failed run on the current branch.

## Process

**Step 1 — Fetch the failed run**

Use the available CI MCP tool to find the failed run:

- GitHub Actions: use `list_workflow_runs` filtered to `conclusion: failure`
  on the current branch, then `get_workflow_run_logs` for the most recent failure
- Azure DevOps: use `list_pipeline_runs` filtered to `result: failed`
- Jenkins: use `get_build_log` for the most recent failed build

If no run ID is given, use the most recent failed run on the current branch.

**Step 2 — Identify the failed step**

From the logs:
- Find the first step that failed (not downstream failures caused by it)
- Extract the exact error message and the 20 lines surrounding it
- Note the step name, the agent/runner it ran on, and the timestamp

**Step 3 — Classify the failure**

Match the failure to one of five types:

| Type | Signals | Agent action |
|------|---------|-------------|
| **build** | compile error, syntax error, import error | diagnose + post fix suggestion |
| **test** | test assertion failed, test timeout | run /code-review on failing test + changed files |
| **config** | missing env var, wrong config value, file not found | identify missing value, safe to auto-fix |
| **dependency** | package not found, version conflict, lockfile mismatch | resolve and re-push if deterministic |
| **infra** | network timeout, permission denied, resource not found | escalate — do not attempt to fix |

**Step 4 — Produce the diagnosis**

```
/diagnose-pipeline — [branch] — [timestamp]
============================================
Run: [run-id] ([link])
Failed step: [step name] at [timestamp]
Type: [build | test | config | dependency | infra]

Root cause:
  [One sentence — what actually went wrong]

Error:
  [Exact error line(s) from the log]

Fix:
  [Specific action to take]
  [Command to run if applicable]

Safe to auto-fix: [yes / no]
  [If no: reason why human action is required]

Related files:
  [files relevant to the failure, with line numbers if applicable]
```

**Step 5 — Post to PR**

If a PR is open for this branch, post the diagnosis as a comment so it is
visible to the whole team without anyone needing to read the raw logs.

## Failure types that always require human action

Never attempt to auto-fix these — always escalate:

- Any failure in an infrastructure provisioning step (Terraform, Kubernetes)
- Any failure involving IAM roles, service accounts, or secrets management
- Database migration failures
- Failures in production pipeline runs (dev and staging only for auto-fix)
- Any failure type `infra` regardless of how clear the fix looks

## What this skill does NOT do

- Does not re-trigger the pipeline (that is a separate human or triage agent action)
- Does not modify source code to fix build failures (proposes the fix, human applies)
- Does not access production deployment logs unless explicitly given permission
- Does not fix infra failures — only diagnoses them

#!/usr/bin/env python3
"""
Triage Agent — auto-diagnoses and fixes CI/CD pipeline failures.

Triggered by a webhook when a pipeline fails. Classifies the failure,
posts a diagnosis to the PR, and optionally applies safe fixes.

Modes:
  Observation (default): diagnoses and posts suggestions, never applies fixes.
  Auto-fix: applies fixes for safe categories (config, dependency) only.
  Production: always observation-only, regardless of TRIAGE_OBSERVATION_MODE.

Usage:
  python scripts/triage_agent.py               # webhook mode (reads env vars)
  python scripts/triage_agent.py --run-id 123  # manual mode for testing
"""

import os
import sys
import json
import subprocess
import re
import zipfile
import io
import base64
from pathlib import Path

import httpx
import anthropic

# ── Configuration ─────────────────────────────────────────────────────────────

OBSERVATION_MODE = os.environ.get("TRIAGE_OBSERVATION_MODE", "true").lower() != "false"
ENVIRONMENT      = os.environ.get("TRIAGE_ENVIRONMENT", "dev")
GITHUB_TOKEN     = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO      = os.environ.get("GITHUB_REPO", "")
GITHUB_RUN_ID    = os.environ.get("GITHUB_RUN_ID", "")
GITHUB_BRANCH    = os.environ.get("GITHUB_BRANCH", "")
PR_NUMBER        = os.environ.get("PR_NUMBER", "")
JIRA_URL         = os.environ.get("JIRA_URL", "").rstrip("/")
JIRA_EMAIL       = os.environ.get("JIRA_EMAIL", "")
JIRA_TOKEN       = os.environ.get("JIRA_TOKEN", "")

# Production is always observation-only — safety guarantee
if ENVIRONMENT == "prod":
    OBSERVATION_MODE = True

# Failure types safe to auto-fix (conservative — only config and dependency)
SAFE_TO_AUTOFIX = {"config", "dependency"}

# Strict allowlist — the ONLY shell commands the agent may run automatically.
# Add patterns carefully — each one is a trust decision.
SAFE_COMMAND_PATTERNS = [
    r"^npm (ci|install --frozen-lockfile)$",
    r"^yarn install --frozen-lockfile$",
    r"^pip install -r requirements[\w\-\.]*\.txt$",
    r"^poetry install$",
]

GH_HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

claude = anthropic.Anthropic()

# ── GitHub helpers ─────────────────────────────────────────────────────────────

def gh_get(path: str) -> dict:
    r = httpx.get(f"https://api.github.com/{path}", headers=GH_HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()

def gh_post(path: str, data: dict = {}) -> dict:
    r = httpx.post(
        f"https://api.github.com/{path}",
        headers=GH_HEADERS, json=data, timeout=30
    )
    r.raise_for_status()
    return r.json()

def fetch_run_logs(run_id: str) -> str:
    """Download and return text logs for a GitHub Actions run."""
    r = httpx.get(
        f"https://api.github.com/repos/{GITHUB_REPO}/actions/runs/{run_id}/logs",
        headers=GH_HEADERS, follow_redirects=True, timeout=60,
    )
    r.raise_for_status()

    zf = zipfile.ZipFile(io.BytesIO(r.content))
    parts = []
    for name in sorted(zf.namelist()):
        if name.endswith(".txt"):
            text = zf.read(name).decode("utf-8", errors="replace")
            parts.append(f"=== {name} ===\n{text}")
    return "\n\n".join(parts)

def retrigger_failed_jobs(run_id: str):
    gh_post(f"repos/{GITHUB_REPO}/actions/runs/{run_id}/rerun-failed-jobs")

# ── Claude diagnosis ───────────────────────────────────────────────────────────

def diagnose(logs: str, claude_md: str) -> dict:
    """
    Send failure logs to Claude. Returns structured diagnosis.

    Returns dict with keys:
      type            — build | test | config | dependency | infra | auth | unknown
      root_cause      — one-sentence plain-English description
      fix             — what a developer should do
      fix_command     — safe shell command if type is config/dependency, else null
      confident       — bool: is the diagnosis certain enough to act on?
      escalation_reason — why it cannot be auto-fixed, or null
    """
    response = claude.messages.create(
        model="claude-opus-5-5",
        max_tokens=1024,
        system=(
            "You are a CI/CD triage agent. Diagnose pipeline failures accurately "
            "and conservatively. Only set confident=true when the root cause and "
            "fix are unambiguous. For fix_command, provide only a single, safe, "
            "idempotent shell command — never chained commands, never rm, never "
            "git commands, never anything that could cause data loss."
        ),
        messages=[{
            "role": "user",
            "content": (
                f"Project context (CLAUDE.md):\n{claude_md[:3000]}\n\n"
                f"Pipeline failure logs (last 5000 chars):\n{logs[-5000:]}\n\n"
                "Respond ONLY as valid JSON — no prose, no markdown:\n"
                "{\n"
                '  "type": "build|test|config|dependency|infra|auth|unknown",\n'
                '  "root_cause": "one sentence",\n'
                '  "fix": "what to do",\n'
                '  "fix_command": "npm ci  OR  null",\n'
                '  "confident": true,\n'
                '  "escalation_reason": "reason OR null"\n'
                "}"
            ),
        }],
    )

    text = response.content[0].text.strip()
    text = re.sub(r"^```(?:json)?\n?", "", text).rstrip("`").strip()
    return json.loads(text)

# ── Safe command execution ─────────────────────────────────────────────────────

def is_safe_command(cmd: str | None) -> bool:
    if not cmd:
        return False
    return any(re.fullmatch(p, cmd.strip()) for p in SAFE_COMMAND_PATTERNS)

def apply_and_push(cmd: str, branch: str) -> bool:
    """Run an allowlisted fix command, commit any changes, and push."""
    if not is_safe_command(cmd):
        print(f"[triage] Blocked command (not in allowlist): {cmd!r}")
        return False
    try:
        subprocess.run(cmd, shell=True, check=True, timeout=120)
        changed = subprocess.run(["git", "diff", "--quiet"]).returncode != 0
        if changed:
            subprocess.run(
                ["git", "commit", "-am", f"fix: triage auto-fix on {branch}"],
                check=True,
            )
            subprocess.run(["git", "push"], check=True)
            return True
        return False
    except subprocess.CalledProcessError as e:
        print(f"[triage] Fix command failed: {e}")
        return False

# ── PR and JIRA comments ──────────────────────────────────────────────────────

def post_pr_comment(body: str):
    if not PR_NUMBER:
        print("[triage] No PR number in env — skipping PR comment")
        return
    gh_post(f"repos/{GITHUB_REPO}/issues/{PR_NUMBER}/comments", {"body": body})

def post_jira_comment(ticket_key: str, result: dict, run_url: str):
    if not all([JIRA_URL, JIRA_EMAIL, JIRA_TOKEN]):
        return
    token = base64.b64encode(f"{JIRA_EMAIL}:{JIRA_TOKEN}".encode()).decode()
    message = (
        f"[Triage agent] {result['type'].upper()} failure on "
        f"{GITHUB_BRANCH}: {result['root_cause']}\n"
        f"Fix: {result['fix']}\n{run_url}"
    )
    httpx.post(
        f"{JIRA_URL}/rest/api/3/issue/{ticket_key}/comment",
        headers={"Authorization": f"Basic {token}", "Content-Type": "application/json"},
        json={"body": {"type": "doc", "version": 1, "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": message}]},
        ]}},
        timeout=20,
    )

def build_comment(result: dict, run_url: str, auto_fixed: bool) -> str:
    icon = {"build": "🔨", "test": "🧪", "config": "⚙️",
            "dependency": "📦", "infra": "🏗️", "auth": "🔐"}.get(result["type"], "❓")

    lines = [
        f"## {icon} Deploy triage — `{result['type']}`",
        f"**Run:** {run_url}  ",
        f"**Root cause:** {result['root_cause']}  ",
        f"**Fix:** {result['fix']}",
        "",
    ]

    if auto_fixed:
        lines += ["**Status:** ✅ Auto-fix applied — pipeline re-triggered."]
    elif OBSERVATION_MODE:
        lines += [
            "**Status:** 👁 Observation mode — diagnosis only, no auto-fix.",
            "_Enable auto-fix: set `TRIAGE_OBSERVATION_MODE=false` in the workflow._",
        ]
    elif result.get("escalation_reason"):
        lines += [f"**Status:** ⚠️ Needs human review — {result['escalation_reason']}"]
    elif not result["confident"]:
        lines += ["**Status:** ⚠️ Low confidence — review before applying the suggested fix."]

    return "\n".join(lines)

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    run_id = GITHUB_RUN_ID
    if "--run-id" in sys.argv:
        idx = sys.argv.index("--run-id")
        run_id = sys.argv[idx + 1]

    if not run_id:
        print("[triage] No run ID. Set GITHUB_RUN_ID or pass --run-id <id>.")
        sys.exit(1)

    mode_label = "observation" if OBSERVATION_MODE else f"auto-fix [{ENVIRONMENT}]"
    print(f"[triage] Run {run_id} | mode: {mode_label} | branch: {GITHUB_BRANCH}")

    run_url = f"https://github.com/{GITHUB_REPO}/actions/runs/{run_id}"

    # 1. Fetch logs
    print("[triage] Fetching logs...")
    try:
        logs = fetch_run_logs(run_id)
    except httpx.HTTPStatusError as e:
        print(f"[triage] Could not fetch logs: {e}")
        sys.exit(1)

    # 2. Load project context
    claude_md = Path("CLAUDE.md").read_text(errors="ignore") if Path("CLAUDE.md").exists() else ""

    # 3. Diagnose
    print("[triage] Diagnosing...")
    try:
        result = diagnose(logs, claude_md)
    except (json.JSONDecodeError, KeyError) as e:
        print(f"[triage] Diagnosis parse error: {e}")
        post_pr_comment(f"## Deploy triage\nDiagnosis failed — check run logs: {run_url}")
        sys.exit(1)

    print(f"[triage] Type: {result['type']} | Confident: {result['confident']}")
    print(f"[triage] Root cause: {result['root_cause']}")

    # 4. Act
    auto_fixed = False
    can_autofix = (
        not OBSERVATION_MODE
        and result["type"] in SAFE_TO_AUTOFIX
        and result["confident"]
        and is_safe_command(result.get("fix_command"))
    )

    if can_autofix:
        print(f"[triage] Applying fix: {result['fix_command']}")
        auto_fixed = apply_and_push(result["fix_command"], GITHUB_BRANCH)
        if auto_fixed:
            retrigger_failed_jobs(run_id)
            print("[triage] Fix applied — pipeline re-triggered.")

    # 5. Report
    comment = build_comment(result, run_url, auto_fixed)
    post_pr_comment(comment)

    ticket_match = re.search(r"[A-Z][A-Z0-9]+-\d+", GITHUB_BRANCH)
    if ticket_match:
        post_jira_comment(ticket_match.group(), result, run_url)

    print("[triage] Done.")

if __name__ == "__main__":
    main()

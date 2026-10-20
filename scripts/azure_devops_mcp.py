#!/usr/bin/env python3
"""
Azure DevOps MCP Server — read-only pipeline access for Claude.

Exposes pipeline run status and logs so Claude can diagnose failures
without copy-pasting from the Azure DevOps UI.

Usage:
  AZURE_ORG_URL=https://dev.azure.com/your-org \
  AZURE_PROJECT=your-project \
  AZURE_PAT=your-pat \
  python scripts/azure_devops_mcp.py

Add to .mcp.json:
  "azure-devops": {
    "command": "python",
    "args": ["scripts/azure_devops_mcp.py"],
    "env": {
      "AZURE_ORG_URL": "https://dev.azure.com/your-org",
      "AZURE_PROJECT": "your-project",
      "AZURE_PAT": "your-pat"
    }
  }

Install dependency: pip install mcp httpx
"""

import os
import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("azure-devops", description="Read-only Azure DevOps pipeline access")

ORG_URL  = os.environ["AZURE_ORG_URL"].rstrip("/")
PROJECT  = os.environ["AZURE_PROJECT"]
PAT      = os.environ["AZURE_PAT"]
API_VER  = "api-version=7.1"
AUTH     = httpx.BasicAuth("", PAT)


def _get(path: str, params: dict = {}) -> dict:
    url = f"{ORG_URL}/{PROJECT}/_apis/{path}?{API_VER}"
    r = httpx.get(url, auth=AUTH, params=params, timeout=20)
    r.raise_for_status()
    return r.json()


@mcp.tool()
def list_pipeline_runs(pipeline_id: int, limit: int = 10) -> dict:
    """
    List recent runs for a pipeline.

    Args:
        pipeline_id: The numeric pipeline definition ID (visible in the URL).
        limit: Number of runs to return (default 10, max 50).
    """
    data = _get(f"pipelines/{pipeline_id}/runs", {"$top": min(limit, 50)})
    runs = []
    for r in data.get("value", []):
        runs.append({
            "id":         r["id"],
            "name":       r["name"],
            "state":      r["state"],
            "result":     r.get("result", "unknown"),
            "created":    r["createdDate"],
            "finished":   r.get("finishedDate"),
            "branch":     r.get("resources", {}).get("repositories", {})
                           .get("self", {}).get("refName", ""),
            "url":        r["_links"]["web"]["href"],
        })
    return {"runs": runs}


@mcp.tool()
def get_pipeline_run(pipeline_id: int, run_id: int) -> dict:
    """
    Get details of a specific pipeline run — stages, jobs, tasks, and result.

    Args:
        pipeline_id: The numeric pipeline definition ID.
        run_id: The specific run ID to inspect.
    """
    run   = _get(f"pipelines/{pipeline_id}/runs/{run_id}")
    timeline = _get(f"build/builds/{run_id}/timeline")

    failed_steps = []
    for record in timeline.get("records", []):
        if record.get("result") == "failed":
            failed_steps.append({
                "name":       record["name"],
                "type":       record["type"],
                "startTime":  record.get("startTime"),
                "finishTime": record.get("finishTime"),
                "errorCount": record.get("errorCount", 0),
                "issues":     [i["message"] for i in record.get("issues", [])
                               if i.get("type") == "error"][:5],
            })

    return {
        "id":          run["id"],
        "result":      run.get("result"),
        "state":       run["state"],
        "branch":      run.get("resources", {}).get("repositories", {})
                        .get("self", {}).get("refName", ""),
        "created":     run["createdDate"],
        "url":         run["_links"]["web"]["href"],
        "failed_steps": failed_steps,
    }


@mcp.tool()
def get_run_logs(pipeline_id: int, run_id: int, failed_only: bool = True) -> str:
    """
    Get logs from a pipeline run.

    Args:
        pipeline_id: The numeric pipeline definition ID.
        run_id: The specific run ID.
        failed_only: If True (default), return only logs from failed tasks.
                     Set to False to get all task logs (can be large).
    """
    timeline = _get(f"build/builds/{run_id}/timeline")
    log_list = _get(f"build/builds/{run_id}/logs")

    # Map log IDs to their task names
    log_id_to_name = {}
    for record in timeline.get("records", []):
        if record.get("log") and record["type"] == "Task":
            log_id_to_name[record["log"]["id"]] = {
                "name":   record["name"],
                "result": record.get("result", "unknown"),
            }

    output_parts = []
    for log in log_list.get("value", []):
        log_id = log["id"]
        meta   = log_id_to_name.get(log_id, {})
        result = meta.get("result", "unknown")

        if failed_only and result != "failed":
            continue

        name = meta.get("name", f"log-{log_id}")
        log_url = f"{ORG_URL}/{PROJECT}/_apis/build/builds/{run_id}/logs/{log_id}?{API_VER}"
        log_r = httpx.get(log_url, auth=AUTH, timeout=20)
        log_r.raise_for_status()

        lines = log_r.text.strip().splitlines()
        # Keep last 100 lines per task to stay within context limits
        excerpt = "\n".join(lines[-100:]) if len(lines) > 100 else log_r.text

        output_parts.append(f"=== [{result.upper()}] {name} ===\n{excerpt}")

    return "\n\n".join(output_parts) if output_parts else "No matching logs found."


@mcp.tool()
def list_pipelines(limit: int = 20) -> dict:
    """
    List pipeline definitions in the project.

    Args:
        limit: Number of pipelines to return (default 20).
    """
    data = _get("pipelines", {"$top": min(limit, 100)})
    return {
        "pipelines": [
            {"id": p["id"], "name": p["name"], "folder": p.get("folder", "\\")}
            for p in data.get("value", [])
        ]
    }


if __name__ == "__main__":
    mcp.run()

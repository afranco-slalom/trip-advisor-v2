# Context Owners

Every CLAUDE.md file has a named owner. The owner is responsible for:
- Keeping the file accurate as the codebase evolves
- Running the pre-audit review each month (see `docs/context-audit.md`)
- Being the decision-maker when the file's content is disputed

One file, one owner. If the owner changes, update this table and commit it.

---

## Ownership table

Fill this in when you set up the project. Add rows as new modules are added.

| CLAUDE.md file | Module / scope | Owner | Last reviewed |
|----------------|---------------|-------|--------------|
| `CLAUDE.md` (root) | Whole project, AI dev standards | [Tech lead name] | [YYYY-MM-DD] |
| `[module]/CLAUDE.md` | [What the module does] | [Pod lead name] | [YYYY-MM-DD] |

---

## Escalation path

If the owner is unavailable for more than one sprint:
1. The pod lead assumes temporary ownership
2. A new owner is assigned and this table is updated
3. The tech lead is notified

If two people disagree about what a CLAUDE.md should say:
1. The owner's judgment is final for style and wording
2. For factual disputes (does this pattern exist in the code?), check the code
3. For policy disputes (should this pattern be used?), file an ADR

---

## Adding a new module

When a new module or service is added to the project:
1. Create a `CLAUDE.md` in that module's directory using `templates/CLAUDE.md`
2. Add a row to this table with a named owner
3. The owner reviews the file at the next monthly audit

Do not leave a module without a CLAUDE.md owner. Unowned context files drift.

---

## Shared context files

These files are owned at the project level and reviewed by the tech lead:

| File | Purpose | Owner |
|------|---------|-------|
| `docs/ai-usage-policy.md` | AI autonomy tiers and rules | [Tech lead] |
| `docs/cross-pod-process.md` | Cross-pod change process | [Tech lead] |
| `docs/context-audit.md` | Monthly ceremony guide | [Tech lead] |
| `templates/org-CLAUDE.md` | Org-level standards template | [Framework owner] |

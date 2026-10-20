# [Project Name]

<!-- Replace everything in [brackets] with your project's specifics.
     Delete sections that don't apply. Keep this file tight — every line
     is loaded into every AI session. -->

## Project overview

<!-- One paragraph: what this project does, who it serves, what problem it solves. -->
[Description]

## Tech stack

- **Frontend**: [e.g. React 18, Next.js 14, TypeScript]
- **Backend**: [e.g. Node.js 20, Express / FastAPI / Django]
- **Database**: [e.g. PostgreSQL 15, Redis for caching]
- **Infrastructure**: [e.g. AWS ECS, Azure App Service, Docker]
- **CI/CD**: [e.g. GitHub Actions, Azure DevOps]

## Architecture

<!-- How the system is structured. Key boundaries, layers, services. -->
[e.g. "Three-layer: React frontend → Express API → PostgreSQL. The API layer
never accesses the DB directly — all queries go through a repository pattern
in src/repositories/."]

## Key directories

```
src/
  [describe main directories and what lives there]
```

## Conventions

**Naming**
- [e.g. Components: PascalCase. Functions: camelCase. Constants: SCREAMING_SNAKE]
- [e.g. API routes: kebab-case, plural nouns. /users, /user-profiles]
- [e.g. Database tables: snake_case, plural. users, user_profiles]

**Patterns to follow**
- [e.g. Always use the repository pattern for DB access — no raw queries in routes]
- [e.g. API responses follow the standard envelope: { data, error, meta }]
- [e.g. All errors extend AppError from src/errors/AppError.ts]

**Patterns to avoid**
- [e.g. No any in TypeScript — use unknown and narrow it]
- [e.g. No console.log in production code — use the logger in src/lib/logger]
- [e.g. No direct process.env access — use src/config/env.ts]

## Approved dependencies

<!-- List packages the team has vetted. AI should not add new dependencies
     without a human decision. -->
[e.g. HTTP: axios. Dates: date-fns (not moment). Validation: zod. Testing: vitest.]

## Forbidden dependencies

[e.g. lodash (use native JS). moment.js (use date-fns). jquery.]

## Environment variables

<!-- List required vars so AI can check for them during /preflight. -->
```
[VAR_NAME]        [what it is]
[VAR_NAME]        [what it is]
```

## JIRA project

- Board: [URL]
- Ticket prefix: [e.g. PROJ]
- Commit format: `PROJ-123: description`

## Development workflow

1. Start with `/feature-start` — reads JIRA ticket, confirms requirements
2. Code the feature
3. Run `/spec-check` — fix any doc gaps before opening PR
4. Run `/code-review` — resolve all BLOCKING findings
5. Run `/pr-ready` — confirms checklist before requesting review
6. Open PR with `/pr-ready` output pasted in description

## PR review gates (required before merge)

- [ ] /preflight passed
- [ ] /code-review: no BLOCKING findings
- [ ] /spec-check: no gaps
- [ ] Human reviewer approved
- [ ] CI pipeline green

## Pods and owners

<!-- Who owns what — so AI can flag cross-pod changes correctly. -->
| Pod | Area | Contact |
|-----|------|---------|
| [Pod name] | [e.g. API, auth, payments] | [name] |

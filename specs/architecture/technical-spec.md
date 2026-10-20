# Travel AI Advisor: Technical Architecture Spec

**Status:** Draft for review  
**Scope:** Initial public prototype and boundaries for later phases  
**Source:** [Product plan](../../docs/PRODUCT-PLAN.md)
**Prototype behavior:** [Trip Intake prototype spec](../prototype/spec.md)

This document records the architecture direction gathered so far. Items marked **Open** need a decision or validation before implementation. A prototype architecture decision must not be treated as approval for a production travel-data or persistence design.

## 1. Goals

- Deploy a public, responsive Next.js prototype on AWS.
- Support trip-intake prompts through Amazon Bedrock, returning a validated, editable trip brief.
- Keep model calls and AWS credentials on the server.
- Fail clearly when the model, validation, or configured usage limits prevent a request.
- Keep traveler prompts and model responses out of application and hosting logs.
- Avoid storing trip briefs, prompts, model responses, accounts, or analytics in the prototype.
- Keep the hosting and model integrations small enough to change after evaluation.

## 2. Scope

### In scope

- Next.js and TypeScript web application.
- Public access without sign-in.
- Trip-intake request and response flow.
- Server-side Bedrock integration with Claude Haiku 5.5 as the initial model candidate.
- Validation of model output and deterministic identification of missing or ambiguous fields.
- AWS hosting evaluation, GitHub Actions deployment, privacy controls, and request-cost protections.

### Out of scope for this architecture slice

- Booking, payments, reservations, or live travel availability.
- Production travel-data integrations.
- Persistent trip plans, user accounts, saved drafts, or share links.
- Final database choice.
- Final AWS region selection.
- A production-grade multi-region or high-availability design.

The product plan's destination recommendation, itinerary, and budget flow is outside this Trip Intake prototype. If a later prototype slice uses curated sample data, it must be labeled as sample and unverified. The [Trip Intake prototype spec](../prototype/spec.md) defines arbitrary AI-backed prompts, replacing the earlier exact-Chicago-example-only intake assumption.

## 3. Decisions captured

| Area | Direction |
|---|---|
| Application | TypeScript end-to-end, using Next.js server routes for server-side operations |
| Cloud | AWS |
| Hosting | Amplify Hosting is the baseline to validate; ECS Express Mode is the comparison alternative |
| Source and CI | GitHub and GitHub Actions |
| Access | Public prototype; no sign-in |
| Trip state | In-session only; no server-side trip persistence |
| AI provider | Amazon Bedrock |
| Model | Claude Haiku 5.5 candidate; verify structured-output support, regional availability, and projected spend before enabling |
| Model responsibilities | Extract a structured brief; application code validates fields and selects the next clarification |
| Model abstraction | Small provider-neutral adapter; do not build a broad orchestration framework |
| Region | Open; inference must stay within the selected region |
| User data | No analytics, and no prompt or response content in application/hosting logs |
| Provider privacy | Require no model training on prompts and the shortest available retention; disclose provider processing |
| Abuse limits | 2,000-character prompt limit, five AI requests per minute per IP, and a hard $25/month Bedrock spend ceiling |
| Limit behavior | Fail closed when a limit is reached; explain the limit and do not silently switch to sample results |
| Hosting budget | Minimize AWS infrastructure cost and estimate it; no hard AWS infrastructure cap set |
| Storage | No trip persistence; database decision deferred |

## 4. Proposed runtime architecture

```text
Traveler's browser
  ├─ Next.js interface and in-memory trip-intake state
  └─ POST /api/trip-intake
       ├─ Validate request size and shape
       ├─ Enforce shared rate/spend controls
       ├─ Call Bedrock through a server-only adapter and AWS IAM role
       ├─ Validate structured output and trip-field semantics
       └─ Return a typed result or an explicit error
```

The browser should retain the current prompt and brief only for the active session. Reloading or closing the page may discard them. The API must not persist submitted prompts or model responses.

**Open:** Choose the exact Next.js version and confirm that the selected Amplify or ECS Express Mode deployment supports the required server routes, runtime, and Bedrock SDK operations. Do not assume static export is sufficient.

## 5. Intake request flow

1. The user enters a prompt of no more than 2,000 characters. The interface displays a concise notice that prompt text is processed by Amazon Bedrock.
2. The server validates the request format and size. It rejects malformed or oversized input before calling the model.
3. The server applies the per-IP rate limit and reserves sufficient capacity against the monthly Bedrock budget.
4. A server-only adapter sends the prompt to Claude Haiku 5.5 in the selected AWS region using the Bedrock runtime API and a server-side IAM role.
5. The model returns structured trip fields. It does not choose which clarifying question to ask or declare a trip feasible.
6. Application code validates the response schema and business semantics, identifies unresolved fields, and chooses at most one clarification question at a time.
7. The client renders the validated brief for review or the next clarification. The user explicitly confirms the completed brief before proceeding.
8. The server records only the minimum non-content usage metadata needed to enforce limits. It never stores the prompt or response.
9. On model, provider, limit, or validation failure, the app shows an explicit error and retry option where appropriate. It never silently returns sample output.

**Open:** Define the precise schema, field-level validation, clarification ordering, and response/error payloads in the Trip Intake technical spec.

## 6. AWS hosting evaluation

### Baseline: Amplify Hosting

Evaluate first because the stated priority is fast setup and low operational effort for a Next.js app.

### Alternative: ECS Express Mode

Compare as managed container hosting if Amplify does not meet runtime, IAM, rate-limiting, or deployment requirements. Standard ECS/Fargate remains a possible later alternative if Express Mode lacks needed controls.

### Required deployment spike

Before adopting either option, verify:

- Supported Next.js version and server-route behavior.
- Server-side Bedrock access using a least-privilege IAM role; no static AWS credentials.
- Safe configuration of model ID, region, and spend limits.
- Ability to exclude prompt/response bodies from application, platform, and provider logs.
- A viable shared rate limiter and atomic monthly spend-control mechanism.
- GitHub Actions deployment, preview behavior, rollback, and estimated monthly cost.
- Region availability and data-location behavior.

The AWS hosting service remains a provisional choice until this spike passes.

## 7. Bedrock integration and structured output

- Use the Bedrock runtime from the server only.
- Keep Bedrock-specific request and response handling inside a small adapter.
- Pin the model ID through server-side configuration; do not allow clients to select a model.
- Prefer Bedrock structured outputs if supported by the selected model and region.
- Validate the response again in application code; schema-conforming output is not proof that a value is correct or that a required trip field is resolved.
- Bound input and output tokens to limit latency and spend.
- Disable prompt/response invocation logging and any other content capture.
- Do not send prompts through cross-region inference; confirm the chosen region supports the selected model and structured-output feature.
- Treat prompt content as untrusted input. The model must extract fields, not follow instructions embedded in traveler text that attempt to change system behavior.

AWS documentation indicates Claude Haiku 5.5 supports Bedrock structured outputs. Confirm current model, region, API, quota, terms, and price details as part of implementation readiness:

- [Bedrock structured outputs](https://docs.aws.amazon.com/bedrock/latest/userguide/structured-output.html)
- [Claude Haiku 5.5 model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-haiku-5-5.html)
- [Bedrock pricing](https://aws.amazon.com/bedrock/pricing/)

## 8. Privacy and data handling

### Data that may be processed

- The travel prompt and extracted trip fields are sent to Bedrock for the requested intake operation.
- The browser may hold the prompt and current brief in memory for the active session.
- Operational metadata may include request outcome, latency, token usage, and limit status, subject to the minimum needed for cost and abuse controls.

### Data that must not be retained

- No prompt or model-response text in application logs, hosting logs, analytics, or persistent trip storage.
- No saved trip brief, draft, account, or share link in this prototype.
- No analytics or behavioral tracking.

### User-facing disclosure

Show a concise notice beside the prompt box explaining that prompts are processed by Amazon Bedrock. Do not imply that prompts remain only on the app's infrastructure. A privacy notice and any required legal review remain necessary before public launch.

### Open verification

- Verify AWS and model-provider data retention, training, and abuse-monitoring terms against the stated requirement before launch.
- Verify all logging surfaces, including hosting/platform logs and Bedrock invocation logging, are configured not to capture prompt or response content.
- Decide the retention period for operational usage metadata and rate-limit identifiers.

## 9. Abuse and spend controls

The selected limits are requirements; the exact implementation remains open.

- Reject prompts over 2,000 characters before any provider call.
- Limit an IP to five AI requests per minute.
- Enforce a hard monthly Bedrock spend ceiling of $25; after the ceiling is reached, stop accepting AI requests and explain that service will resume after reset.
- Do not use a billing alarm alone as the hard-cap mechanism. A notification that arrives after inference charges accrue is not enforcement.
- Bound model output tokens and reserve spend before starting inference.
- Fail closed if the mechanism needed to enforce a limit is unavailable.
- Avoid storing prompt content as part of rate-limit or spend records.

### Open design constraint

Reliable per-IP limits across multiple server instances and an atomic monthly spend ceiling require shared enforcement state or an AWS edge/service control with equivalent guarantees. This is **not trip persistence**, but it is persistent operational state and may involve an IP-derived key. Select the mechanism, retention, and privacy treatment before implementation. The $25 ceiling must include a safety margin for in-flight/concurrent requests and any pricing uncertainty.

## 10. Error handling

Return explicit, typed outcomes for:

- Invalid or oversized request.
- Rate limit exceeded.
- Monthly Bedrock spend ceiling reached.
- Bedrock throttling, timeout, or service failure.
- Model response not parseable or invalid against the application schema.
- Model unavailable in the selected region or lacking a required capability.
- Internal enforcement-state failure.

The interface must not present an error as a completed trip brief. Retry only when safe and bounded; never silently retry in a way that can exceed the spend ceiling. Do not fall back to sample data unless a future requirement explicitly adds a labeled demo mode.

## 11. Testing and verification

### Automated tests

- Request size and shape validation.
- Structured response parsing and semantic validation.
- Missing/ambiguous fields result in one application-selected clarification at a time.
- Confirmed brief is required before continuing.
- Prompt and response content do not appear in application logs or error telemetry.
- Five-per-minute rate limit and monthly spend ceiling, including concurrent requests and enforcement-store failures.
- Provider timeout, throttling, malformed output, and unavailable-model behavior.
- No persistence of trip data across reloads or server requests.

### Deployment checks

- Smoke-test the AI route through the selected AWS hosting service.
- Verify IAM permissions are least-privilege and no credentials reach the browser bundle.
- Verify region pinning and no cross-region inference.
- Verify platform logging configuration and usage-limit behavior in the deployed environment.
- Measure representative prompt cost and latency before enabling public access.

## 12. Open decisions and gates

| Item | Gate |
|---|---|
| AWS hosting service | Deployment spike: Amplify baseline versus ECS Express Mode |
| AWS region | Choose one where the selected hosting, Claude Haiku 5.5, structured outputs, and required privacy controls are available |
| Bedrock model and cost | Test representative prompts; project monthly cost under the $25 cap with headroom |
| Shared rate/spend controls | Select a design that supports distributed enforcement without retaining trip text |
| Operational metadata retention | Choose minimal retention for spend accounting and rate limiting |
| Exact intake contract | Specify typed request, trip-brief schema, validation rules, and error responses |
| Next.js version and runtime | Pin after checking compatibility with hosting and server-side Bedrock SDK |
| Infrastructure as code | Decide whether the prototype requires Terraform, AWS CDK, CloudFormation, or documented console setup |
| Public-use disclosure | Review privacy notice wording and applicable launch requirements |

## 13. Implementation readiness

Do not start public deployment until:

- The intake product spec reflects arbitrary AI-backed prompts and is approved.
- The AWS deployment spike verifies the chosen hosting path.
- The model and region meet the structured-output, privacy, and spend requirements.
- The hard spend cap and shared rate limiter have an enforceable design.
- Logging and user-facing provider disclosure have been verified end to end.
- Automated tests cover the acceptance criteria in this document and the Trip Intake spec.

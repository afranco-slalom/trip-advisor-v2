# Bedrock-Backed Trip Intake Prototype: Jira Ticket Draft

**Status:** Published to Jira space `TAV` on 2026-10-20  
**Source specs:** [Prototype spec](../../specs/prototype/spec.md) and [architecture spec](../../specs/architecture/technical-spec.md)  
**Parent:** All seven work items are children of [TAV-1](https://slalom-team-zhxx4q21.atlassian.net/browse/TAV-1).

This backlog is deliberately limited to the Bedrock-backed Trip Intake prototype. It does not include destination recommendations, curated sample itineraries, live travel data, bookings, persistence, accounts, or analytics.

## Created Jira issues

| Draft ID | Jira key | Jira type | Summary | Depends on |
|---|---|---|---|---|
| EPIC | [TAV-1](https://slalom-team-zhxx4q21.atlassian.net/browse/TAV-1) | Epic | Build Bedrock-backed Trip Intake prototype | — |
| ARCH-1 | [TAV-3](https://slalom-team-zhxx4q21.atlassian.net/browse/TAV-3) | Task | Validate AWS hosting, Bedrock region, and enforcement design | — |
| APP-1 | [TAV-7](https://slalom-team-zhxx4q21.atlassian.net/browse/TAV-7) | Task | Bootstrap the Next.js prototype and deployment pipeline | ARCH-1 |
| INTAKE-1 | [TAV-2](https://slalom-team-zhxx4q21.atlassian.net/browse/TAV-2) | Story | Implement trip brief schema and deterministic validation | — |
| UI-1 | [TAV-8](https://slalom-team-zhxx4q21.atlassian.net/browse/TAV-8) | Story | Build the responsive Trip Intake conversation and review UI | INTAKE-1 |
| AI-1 | [TAV-5](https://slalom-team-zhxx4q21.atlassian.net/browse/TAV-5) | Story | Add server-side Bedrock trip extraction | ARCH-1, INTAKE-1 |
| LIMITS-1 | [TAV-4](https://slalom-team-zhxx4q21.atlassian.net/browse/TAV-4) | Task | Enforce request, rate, spend, and content-logging controls | ARCH-1 |
| E2E-1 | [TAV-6](https://slalom-team-zhxx4q21.atlassian.net/browse/TAV-6) | Task | Verify and release the public Trip Intake prototype | APP-1, UI-1, AI-1, LIMITS-1 |

Tickets may be implemented in parallel only after their listed prerequisites are complete. UI work can use the approved intake contract and mocked API responses while the Bedrock integration is developed.

---

## EPIC — Build Bedrock-backed Trip Intake prototype

### Goal

Validate whether travelers can describe a trip in their own words, resolve missing details through a short interaction, and confirm an accurate, editable trip brief.

### Scope

- Public responsive Next.js application; no sign-in.
- Arbitrary traveler prompts processed by Amazon Bedrock.
- Editable and explicitly confirmed trip brief.
- In-session state only; no persistence or analytics.
- No prompt/response content in logs.
- No destination recommendation or live travel data.

### Epic acceptance criteria

- All child issues are complete and their acceptance criteria pass.
- The deployed application satisfies the prototype completion criteria in the [prototype spec](../../specs/prototype/spec.md).
- No screen presents sample travel data as live, current, or verified.

---

## ARCH-1 — Validate AWS hosting, Bedrock region, and enforcement design

**Type:** Spike / Task  
**Priority:** Blocker for public deployment  
**Dependencies:** None  
**Spec traceability:** Architecture spec sections 6–9 and 12

### Description

Run a bounded architecture validation for deploying a Next.js server-rendered application on AWS and invoking Claude Haiku 5.5 through Amazon Bedrock. Compare Amplify Hosting (baseline) with ECS Express Mode. Confirm a supported single AWS region and propose a shared design for the five-requests-per-minute-per-IP limit and hard $25/month Bedrock cap.

Compare operational effort, Next.js/server-route support, GitHub Actions deployment, IAM access, logging controls, region support, rollback, and estimated infrastructure cost. Do not implement the production application in this spike.

### Acceptance criteria

- [ ] A documented comparison of Amplify Hosting and ECS Express Mode covers every criterion in the description.
- [ ] One hosting recommendation is made, with evidence from a minimal deployment spike or explicit documented limitations.
- [ ] The proposed AWS region is verified to support the selected hosting approach, Claude Haiku 5.5, Bedrock structured outputs, and single-region inference.
- [ ] The Bedrock model/API and regional structured-output capability are exercised with representative trip-intake schema examples.
- [ ] Representative prompt costs and token bounds are estimated against the $25/month cap, including concurrency headroom.
- [ ] A concrete shared rate-limit and monthly-spend enforcement design is documented; it fails closed and does not store prompt or response text.
- [ ] IAM access, provider/hosting logging behavior, data-location behavior, and retention terms are documented for public-launch review.
- [ ] The outcome records remaining risks and implementation-ready decisions in the architecture spec.

### Out of scope

- Building the user interface or production API.
- Choosing a database or designing trip persistence.
- Enabling cross-region inference.

---

## APP-1 — Bootstrap the Next.js prototype and deployment pipeline

**Type:** Story / Task  
**Priority:** High  
**Dependencies:** ARCH-1  
**Spec traceability:** Architecture spec sections 2, 4, 6, and 12

### Description

Create the smallest deployable Next.js/TypeScript application and GitHub Actions workflow using the approved ARCH-1 hosting recommendation. Set up server-side runtime configuration and environment separation without adding trip persistence, analytics, or provider credentials to the client.

### Acceptance criteria

- [ ] The application builds and runs locally using documented commands.
- [ ] A GitHub Actions workflow runs the agreed build, lint, type-check, and unit-test commands.
- [ ] The application deploys to a non-production environment using the approved AWS hosting approach.
- [ ] Runtime configuration for Bedrock region/model is server-only and validated at startup or request time.
- [ ] No static AWS credentials or Bedrock credentials are present in source control, build artifacts, or browser bundles.
- [ ] A minimal health/readiness response exposes no trip or provider content.
- [ ] The deployment and rollback steps are documented.

### Out of scope

- Implementing trip-intake behavior or Bedrock calls.
- Adding persistence, authentication, analytics, or live travel data.

---

## INTAKE-1 — Implement trip brief schema and deterministic validation

**Type:** Story / Task  
**Priority:** High  
**Dependencies:** None  
**Spec traceability:** Prototype spec sections 5 and 8; PTI-001–PTI-008, PTI-011

### Description

Define the typed trip-brief contract and implement deterministic validation for required fields, conditional child details, date/duration consistency, budget basis/coverage, optional preferences, and confirmation state. The model supplies candidate values only; application logic determines unresolved fields and the next single clarification.

### Acceptance criteria

- [ ] A typed schema covers all fields in prototype spec section 5.1 and distinguishes required, conditional, optional, derived, and unresolved values.
- [ ] Invalid dates, departure dates not after arrival, and inconsistent duration are rejected or marked unresolved.
- [ ] “Five days in May” does not result in invented exact dates or year.
- [ ] Budget amount, currency, party/per-person basis, and coverage are independently represented; missing coverage remains unresolved.
- [ ] Child age/age range is requested only when a child is included; names and birth dates are not fields in the contract.
- [ ] A deterministic clarification selector asks one question at a time and skips already resolved fields.
- [ ] The system requires explicit confirmation when required fields are complete and invalidates confirmation after an edit.
- [ ] Unit tests cover the relevant PTI acceptance scenarios and edge cases.

### Out of scope

- Bedrock SDK integration, UI, storage, and destination feasibility checks.

---

## UI-1 — Build the responsive Trip Intake conversation and review UI

**Type:** Story / Task  
**Priority:** High  
**Dependencies:** INTAKE-1  
**Spec traceability:** Prototype spec sections 3, 5, 6, and PTI-002–PTI-008, PTI-010–PTI-013

### Description

Build the traveler-facing prompt entry, clarification, editable brief, and confirmation flow. Integrate through the agreed typed intake API contract; use mocked responses until AI-1 is ready. Keep current trip state in memory only.

### Acceptance criteria

- [ ] The interface works at mobile and desktop viewport sizes and is keyboard operable.
- [ ] The prompt field enforces the 2,000-character limit and displays the Bedrock processing and no-save notice.
- [ ] Loading, one-at-a-time clarification, editable brief, incomplete, confirmed, changed-since-confirmation, and error/limit states are represented.
- [ ] The user can edit the brief and must reconfirm it after edits before proceeding.
- [ ] The interface does not claim that a confirmed brief is feasible, priced, available, or booked.
- [ ] Provider, validation, rate-limit, and monthly-limit errors are explicit; the UI never displays fabricated success or silent sample fallback.
- [ ] No trip data is written to local storage, cookies, analytics, or server persistence.
- [ ] Component and interaction tests cover the acceptance scenarios in the description.

### Out of scope

- Choosing the visual brand system beyond a clear, accessible prototype UI.
- Generating destination recommendations or itineraries.

---

## AI-1 — Add server-side Bedrock trip extraction

**Type:** Story / Task  
**Priority:** High  
**Dependencies:** ARCH-1, INTAKE-1  
**Spec traceability:** Architecture spec sections 4, 5, 7, and 10; prototype spec sections 6–8

### Description

Implement a server-only Bedrock adapter and trip-intake endpoint. Invoke the approved Claude Haiku 5.5 model in the approved region. Extract candidate trip fields into the INTAKE-1 schema; keep validation, clarification choice, and completion decisions deterministic in application code.

### Acceptance criteria

- [ ] The browser calls a server route; it never calls Bedrock directly or receives AWS credentials/model secrets.
- [ ] The model ID and region are server-side configuration; inference cannot route cross-region.
- [ ] Structured output is used if verified for the selected model, API, and region; the result is still validated against INTAKE-1's schema and semantics.
- [ ] Arbitrary prompts up to 2,000 characters are accepted for extraction; unsupported/ambiguous values are marked unresolved rather than invented.
- [ ] The application, not the model, selects the next clarification and determines whether the brief is complete.
- [ ] Provider timeout, throttling, malformed output, and unavailable-model errors return typed failures; no sample data fallback occurs.
- [ ] Prompt and response bodies are excluded from application logs, traces, and Bedrock invocation logging.
- [ ] Tests use a mocked Bedrock client and cover PTI-001–PTI-004, PTI-011, and PTI-012.

### Out of scope

- Destination search, itinerary generation, autonomous tool use, and provider switching.

---

## LIMITS-1 — Enforce request, rate, spend, and content-logging controls

**Type:** Story / Task  
**Priority:** Blocker for public deployment  
**Dependencies:** ARCH-1  
**Spec traceability:** Architecture spec sections 8–10; prototype spec sections 7–8, PTI-009–PTI-013

### Description

Implement the approved distributed enforcement mechanism for request size, five AI requests per minute per IP, and a hard $25/month Bedrock ceiling. The mechanism must account for concurrent/in-flight requests and fail closed if enforcement state is unavailable. Keep only the minimum operational metadata needed; do not retain prompt or response text.

### Acceptance criteria

- [ ] Requests exceeding 2,000 characters are rejected before Bedrock invocation.
- [ ] More than five AI requests in a rolling minute from an IP are blocked before Bedrock invocation.
- [ ] A monthly spend reservation/cap mechanism prevents new requests once the $25 cap, including agreed safety margin, is reached.
- [ ] Concurrent requests cannot overspend the configured ceiling through a check-then-invoke race.
- [ ] When the cap is reached, the API returns a typed limit result and the UI can explain retry after reset.
- [ ] If shared enforcement state is unavailable, the API fails closed before invoking Bedrock.
- [ ] IP-derived identifiers and operational usage metadata have an explicit retention policy; prompt/response content is never stored.
- [ ] Tests cover boundary, concurrent, reset, and enforcement-store failure cases.

### Out of scope

- User accounts, persistent trips, analytics, or a general-purpose billing platform.

---

## E2E-1 — Verify and release the public Trip Intake prototype

**Type:** Story / Task  
**Priority:** High  
**Dependencies:** APP-1, UI-1, AI-1, LIMITS-1  
**Spec traceability:** Prototype spec sections 8–10; architecture spec sections 11 and 13

### Description

Run the end-to-end acceptance suite in the approved AWS environment, verify deployment privacy and security controls, and release the Trip Intake prototype publicly only after all required launch gates pass.

### Acceptance criteria

- [ ] End-to-end tests cover example extraction, month-only date clarification, budget coverage, child details, edit/reconfirm, invalid model output, provider failure, rate limiting, and monthly cap behavior.
- [ ] Tests confirm no prompt/response content appears in application, hosting, analytics, or Bedrock invocation logs.
- [ ] Tests confirm trip details do not persist across reloads or server requests.
- [ ] Browser inspection confirms no AWS credentials or Bedrock secrets are exposed.
- [ ] Deployed inference is region-pinned and uses the approved model and structured-output capability.
- [ ] Privacy notice, Bedrock terms/retention verification, and public access behavior pass review.
- [ ] Public release is blocked if any architecture readiness criterion remains unmet.
- [ ] Deployment, rollback, and service-cap/reset behavior are documented for the operator.

### Out of scope

- Live destination, price, routing, venue, or lodging integrations.
- Sample recommendation/itinerary screens unless separately specified and ticketed.

---

## Jira publication notes

- The epic and seven child work items were created in the `TAV` space.
- Every child issue is parented to `TAV-1`.
- Jira `Blocks` issue links record the dependencies shown in the table.
- The Jira project currently supports Epic, Story, and Task; the architecture spike and test/release work were created as Tasks.
- Issue descriptions identify the repository-local specs by path. Add repository web links if/when a remote repository is configured.
- Issues were not assigned to AI agents. Jira issue creation does not itself dispatch an agent; agent assignment/dispatch requires a configured automation or orchestration workflow.

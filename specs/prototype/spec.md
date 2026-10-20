# Prototype Spec: Bedrock-Backed Trip Intake

**Status:** Draft for review  
**Product source:** [Product plan](../../docs/PRODUCT-PLAN.md)  
**Technical source:** [Architecture spec](../architecture/technical-spec.md)

## 1. Purpose

Validate whether travelers can describe a trip in their own words, resolve the important missing details through a short conversation, and confirm an accurate, editable trip brief.

The prototype uses Amazon Bedrock for prompt extraction. It does not claim that destinations, prices, routes, or itineraries are live or verified. If any such content is shown, it must be explicitly identified as curated sample data.

## 2. User and example

The user is a leisure traveler planning a single-destination trip.

Example prompt:

> We're two adults traveling from Chicago for five days in May. Our budget is $2,500 total. We like food, nature, and walkable places, and we don't want to rent a car.

The prototype accepts arbitrary trip prompts within the request-size limit. It is not restricted to the example prompt.

## 3. In scope

- Public responsive web prototype; no sign-in.
- Free-text prompt entry and Bedrock-backed extraction.
- Reviewable, editable trip brief.
- One-at-a-time clarification of missing or ambiguous required details.
- Explicit confirmation before the user proceeds.
- Reconfirmation after edits to a confirmed brief.
- Optional interests, transportation preferences, accessibility needs, and child age or age range when relevant.
- Loading, validation, provider-error, rate-limit, and monthly-limit states.
- In-session state only; page reload or session end may discard the trip.
- Curated destination or itinerary sample content only if separately included in the UI; label it as sample, not live or verified.

## 4. Out of scope

- Destination recommendations generated from live flight, lodging, routing, or venue inventory.
- Claims that a sample destination or budget is currently bookable or verified.
- Itinerary generation or refinement powered by live travel data.
- Booking, payments, accounts, saved drafts, plan sharing, or server-side trip persistence.
- Analytics, prompt logging, response logging, or retention of trip details.
- Provider fallback to sample results when Bedrock is unavailable.
- Autonomous agent behavior, tool use, or multi-step travel research.

## 5. Trip brief behavior

### 5.1 Fields

| Field | Requirement | Intake behavior |
|---|---|---|
| Origin | Required | Accept city or region. Ask for a specific airport only when a later feature needs it. |
| Arrival date | Required | Ask for an exact date; a month-only answer such as “May” is unresolved. |
| Departure date | Required | Ask for an exact date and validate it occurs after arrival. |
| Duration | Derived | Calculate trip length in nights as the calendar-date difference between departure and arrival. Keep any user-stated day count separate; never invent dates to make the values match. |
| Travelers | Required | Capture count and adult/child composition. |
| Child age or age range | Conditional | Ask only when a child is included; explain it helps assess suitability and cost. Do not request names or birth dates. |
| Total budget | Required | Record amount, currency, and whether it is per-person or for the party when stated or clarified. |
| Budget coverage | Required | Confirm whether it includes transportation, lodging, food, and activities. |
| Interests | Optional | Capture if offered; do not block completion when omitted. |
| Transportation preferences | Optional | Capture if offered; do not block completion when omitted. |
| Accessibility needs | Optional | Provide an optional field; do not require an answer. |

### 5.2 Required-field and clarification rules

- The application, not the model, determines which fields are required and which clarification to ask next.
- Ask one clarification question at a time.
- Ask only about unresolved information that affects intake completion.
- Do not silently assume a year, exact dates, budget coverage, or whether budget is per traveler or party.
- Derive nights from the exact arrival and departure dates. A user-stated duration in days is a separate value and does not override the date-derived night count.
- If the prompt says “five days in May” without exact dates, ask for exact arrival and departure dates. Do not mark the brief complete.
- If the traveler cannot answer a required question, keep intake incomplete. The prototype does not save an incomplete draft or proceed to recommendations.

Suggested clarification priority:
1. Exact arrival and departure dates.
2. Origin.
3. Traveler count and adult/child composition.
4. Child ages or age ranges when children are included.
5. Total budget amount, currency, party/per-person basis, and coverage.

Adjust the order to avoid asking for information already clearly supplied.

## 6. Interaction flow

1. The page explains that the prototype uses AI to process trip descriptions and that it does not save trip details.
2. The traveler enters a free-text prompt up to 2,000 characters and submits it.
3. The server validates request shape and size, then enforces rate and spend limits before invoking Bedrock.
4. Bedrock extracts candidate structured fields. The application validates the output and identifies unresolved fields.
5. If a required detail is missing or ambiguous, the UI asks one focused clarification question and incorporates the answer into the current in-memory brief.
6. The UI displays an editable brief. The traveler can correct fields and optional preferences.
7. The traveler confirms the completed brief.
8. After any edit to the confirmed brief, mark it as changed and require confirmation again before continuing.
9. Do not imply that confirmation means a trip is feasible, priced, available, or booked.

## 7. Bedrock, privacy, and abuse requirements

- Use Amazon Bedrock; Claude Haiku 5.5 is the selected initial model candidate.
- Use Bedrock from a server route only; AWS credentials and model selection never reach the browser.
- Pin inference to the selected AWS region; do not use cross-region inference.
- Use structured output when supported by the chosen model and region, then validate schema and field semantics in application code.
- Require that prompts are not used for model training and select the shortest available retention, subject to verification before public launch.
- Show a concise notice beside the prompt box that prompt text is processed by Amazon Bedrock.
- Do not log prompt or response content in application, hosting, analytics, or provider invocation logs.
- Do not persist prompts or trip briefs.
- Reject prompts above 2,000 characters before any provider call.
- Limit AI requests to five per minute per IP.
- Enforce a hard $25 monthly Bedrock spend ceiling. When reached, stop AI requests and show a retry-after-reset message; do not fall back to sample output.
- Fail closed if a control required to enforce the limits is unavailable.
- Show a clear provider or validation error with retry where appropriate. Do not present errors as completed trip briefs.

## 8. Acceptance scenarios

### PTI-001: Extract the example prompt

**Given** the traveler submits the example prompt  
**When** Bedrock returns a valid structured response  
**Then** the brief contains Chicago as origin, two adults, a five-day duration, $2,500 as the stated total budget, food/nature/walkability interests, and no rental car  
**And** exact arrival/departure dates and budget coverage remain unresolved  
**And** the system does not invent a year or date.

### PTI-002: Clarify month-only dates

**Given** the prompt says “five days in May” without exact dates  
**When** the application evaluates required fields  
**Then** it asks for exact arrival and departure dates in one clarification  
**And** the brief remains incomplete until those dates are supplied and validated.

### PTI-014: Derive trip length in nights

**Given** the traveler supplies valid exact arrival and departure dates  
**When** the application calculates trip length  
**Then** it uses the calendar-date difference in nights  
**And** any user-stated day count remains separate  
**And** the application does not change dates or infer a year to force the values to match.

### PTI-003: Ask one question at a time

**Given** multiple required fields are unresolved  
**When** the application requests clarification  
**Then** it asks one focused question  
**And** it does not combine unrelated required questions into one prompt.

### PTI-004: Confirm budget coverage

**Given** the traveler supplies a total budget without stating what it covers  
**When** the application evaluates the brief  
**Then** it asks whether transportation, lodging, food, and activities are included  
**And** it does not mark the budget scope as resolved before the answer.

### PTI-005: Optional preferences

**Given** required fields are resolved but interests, transport preferences, or accessibility needs are omitted  
**When** the brief is reviewed  
**Then** those optional fields do not block confirmation.

### PTI-006: Child in party

**Given** the traveler includes a child  
**When** child age is missing  
**Then** the application asks for age or age range and explains why  
**And** it does not request the child's name or birth date.

### PTI-007: Review and confirm

**Given** all required fields are resolved  
**When** the review screen is shown  
**Then** the traveler can edit the brief  
**And** must explicitly confirm before proceeding.

### PTI-008: Reconfirm after an edit

**Given** the traveler has confirmed a brief  
**When** the traveler edits any field  
**Then** the brief is marked changed  
**And** further progression requires confirmation of the updated brief.

### PTI-009: Oversized prompt

**Given** a prompt exceeds 2,000 characters  
**When** it is submitted  
**Then** the request is rejected before Bedrock invocation  
**And** the traveler is told the allowed limit.

### PTI-010: Rate and spend limits

**Given** the per-IP request limit or monthly Bedrock ceiling is reached  
**When** another request is submitted  
**Then** no Bedrock request is made  
**And** the UI explains the temporary limit  
**And** no sample result is substituted.

### PTI-011: Invalid provider output

**Given** Bedrock returns malformed or semantically invalid data  
**When** the server validates the response  
**Then** the application does not mark intake complete  
**And** the UI reports an error and offers a safe retry where appropriate.

### PTI-012: Provider failure

**Given** Bedrock is unavailable or times out  
**When** a prompt is submitted  
**Then** the UI shows an explicit provider error  
**And** it does not fabricate a brief or fall back to sample output.

### PTI-013: Privacy and session state

**Given** the traveler submits a prompt and receives a brief  
**When** the request is processed  
**Then** prompt and response content are not written to application or provider invocation logs  
**And** trip details are not stored server-side  
**And** a page reload may discard the in-memory trip.

## 9. Prototype completion criteria

- The full intake interaction works on mobile and desktop.
- All acceptance scenarios above are covered by automated tests or documented manual checks where platform behavior cannot be unit tested.
- Model and server failures are visible and do not produce success-shaped output.
- Browser bundles and network responses do not expose AWS credentials.
- Hosting and Bedrock region, model availability, and structured-output compatibility are verified before public deployment.
- Shared rate limiting and the hard monthly spend ceiling are tested under concurrent requests.
- Any destination, cost, or itinerary material shown in the UI is identified as curated sample data and is not presented as live or verified.

## 10. Open decisions

- Final AWS hosting service and region.
- Exact shared mechanism for rate limits and atomic monthly spend enforcement.
- Monthly operational-metadata retention period.
- Exact Bedrock API invocation shape and model ID validation in the selected region.
- Whether the prototype includes sample destination screens after intake; if so, their specific scope and content source.
- Final privacy notice wording and public-launch review.

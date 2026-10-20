# Travel AI Advisor: Product Requirements and Implementation Plan

## 1. Product goal

Turn travel inspiration into an explainable, feasible trip plan through a short conversation.

The advisor should help travelers answer:
- Where can we realistically go?
- What fits our total budget and available time?
- How will we get around?
- What will each day feel like?
- How does the plan change when our needs change?

Success means producing a useful plan without disguising estimates as confirmed prices, ignoring constraints, or making the traveler complete a lengthy questionnaire.

## 2. Working assumptions

- Initial audience: leisure travelers planning a single-destination trip.
- Initial launch scope: departures from US airports, USD budgets, English-language interface.
- MVP supports adults and children, but not complex multi-city or group-booking workflows.
- The advisor assists with planning; it does not make reservations or guarantee availability.
- Trip-intake prototype: Amazon Bedrock processes arbitrary traveler prompts; no prompt or trip brief is persisted.
- Hosting remains an AWS decision; Amplify Hosting and ECS Express Mode are candidates to validate.
- Destination suggestions, prices, and itineraries shown before live travel-data integrations exist must be labeled as curated sample data, not current availability or verified prices.

These are proposed scope decisions, not requirements supplied by the traveler.

## 3. Primary user journey

### Step 1: Describe the trip

Example:

> We're two adults traveling from Chicago for five days in May. Our budget is $2,500 total. We like food, nature, and walkable places, and we don't want to rent a car.

Extract a visible, editable trip brief:

| Field | Initial interpretation |
|---|---|
| Origin | Chicago; specific airport preferences unresolved |
| Travelers | Two adults |
| Duration | Five days; confirm whether this includes travel days |
| Dates | May; year and date flexibility unresolved |
| Budget | $2,500 total for the party; confirm included expenses |
| Interests | Food, nature, walkable neighborhoods |
| Transportation | No rental car |

Do not silently assume that May refers to the next occurrence, that five days means five nights, or that the budget is per person.

### Step 2: Ask useful questions

Prioritize questions that could materially change feasibility:

1. Which year and dates in May, and how flexible are they?
2. Does five days include arrival and departure, and does $2,500 include transportation, lodging, food, and activities?
3. Are international destinations acceptable, or should options stay domestic?

Ask one question at a time. Skip anything already answered. Show why a question matters when helpful.

Target no more than three clarification turns before the first useful shortlist. If essential information remains missing, offer a clearly labeled provisional comparison rather than inventing an answer or claiming feasibility. Ask further questions when necessary for a specific destination, accessibility need, or requested change.

### Step 3: Compare destinations

Return three candidates when three meet the constraints. Return fewer, with an explanation, when they do not.

Each candidate includes:
- Why it matches the traveler's interests.
- An estimated total cost range for the entire party.
- Transportation time and usable time at the destination.
- A practical airport-to-lodging and local car-free transportation strategy.
- Seasonal considerations and meaningful trade-offs.
- Source freshness, price assumptions, and unresolved feasibility checks.

Prioritize hard constraints before ranking preferences. Explain rankings in plain language rather than displaying an opaque suitability score.

If no candidate fits, identify the conflicting constraints and offer explicit choices such as changing dates, destination, duration, or budget. Never silently relax a constraint.

### Step 4: Build an itinerary

After destination selection, generate:
- Arrival and departure plans that account for travel time.
- Day-by-day morning, afternoon, and evening blocks.
- Activity duration, neighborhood, approximate cost, and transfer time.
- Meal allowances and optional food suggestions.
- Rest and unscheduled time.
- A budget breakdown, assumptions, and items that still require verification.

Account for opening hours, reservation requirements, geography, and seasonal restrictions when data is available. Clearly flag unknowns; do not fabricate specific hours or availability.

### Step 5: Refine the plan

Treat edits as changes to the saved trip state, not isolated chat replies.

| Request | Required behavior |
|---|---|
| "Make the second day less busy." | Reduce scheduled activity and transit time; preserve other days unless a dependency requires a change; explain any moved or removed activities. |
| "What changes if we bring our child?" | Ask age and whether this is a hypothetical comparison or an update; assess fares, lodging occupancy, pacing, and age suitability without assuming discounts. |
| "Keep one afternoon completely free." | Ask which afternoon or propose one; remove all scheduled activities and transfers from that block; prevent later regeneration from filling it. |

Show the resulting schedule and budget differences before replacing the current plan. Allow accepting, rejecting, and undoing revisions.

## 4. MVP functional requirements

### Trip brief

- Capture dates or date windows, origin, party composition, duration, total budget, interests, transportation constraints, and accessibility requirements when supplied.
- Distinguish hard constraints, soft preferences, assumptions, and unanswered questions.
- Let users correct extracted information directly.
- Revalidate recommendations and itineraries when relevant brief fields change.

### Recommendation and planning

- Shortlist destinations with comparable costs and trade-offs.
- Build one selected destination into a coherent itinerary.
- Support pacing, party-composition, and protected-free-time revisions.
- Save the accepted plan and its revision history.
- Provide a printable/shareable plan summary.
- Clearly distinguish selected options from actual bookings.

### Interface

- Pair conversational input with a persistent trip brief, destination comparison, itinerary, and budget view.
- Show loading, unavailable-data, validation-error, and retry states.
- Make all controls keyboard accessible and target WCAG 2.2 AA.
- Work on mobile and desktop.

### Not included in MVP

- Booking, payments, ticket issuance, or reservation management.
- Guaranteed fares, availability, or automatic price monitoring.
- Complex multi-city routing.
- Autonomous purchases or changes to external reservations.
- Definitive immigration, medical, or travel-safety advice.

## 5. Feasibility and trust rules

### Budget

Calculate totals in application code, not solely in generated prose:

`trip total = intercity transportation + lodging + local transportation + food + activities + known fees/taxes + contingency`

- Record quantities, currencies, per-person versus party pricing, and nightly versus total costs.
- Derive nights from the actual itinerary; do not infer four nights solely from "five days."
- Include a visible, adjustable contingency allowance; propose 10% as an initial default.
- Avoid double-counting taxes or included meals.
- State currency-conversion assumptions when necessary.
- If the high end of an estimated range, including contingency, fits within budget, label the plan "estimated within budget."
- If the range crosses the budget, label it "budget at risk." If its low end exceeds the budget, label it "over budget."
- Use "insufficient cost data" when major components are missing; do not classify the plan as within budget.
- A budget fit does not imply that transport, lodging, or activities are bookable.

### Time and transportation

- Validate activity intervals, transfers, arrival/departure buffers, and local time zones.
- For a no-rental-car trip, account for every required airport transfer and itinerary leg.
- Ask whether occasional taxis or rideshares are acceptable before relying on them.
- Do not treat a city as car-free feasible merely because it has public transportation.
- Flag missing service schedules, impractical connections, and unavailable opening-hour information.

### Evidence and uncertainty

- Attach a source reference, retrieval time, and estimate/verified status to externally sourced claims.
- Treat cached or static guidance as dated information, not live availability.
- Label weather guidance as seasonal expectations, not a forecast outside the forecast window.
- Surface provider failures explicitly; offer retry or clearly labeled sample mode rather than silently substituting fabricated results.
- Direct travelers to official sources for entry requirements and travel advisories.
- Never invent links, reservations, or confirmation numbers.

### Privacy and security

- Collect child age only when needed; do not request names, birth dates, passport numbers, or payment information for planning.
- Keep provider credentials server-side.
- Make saved-plan retention and deletion controls explicit.
- Use unguessable, revocable share links; disclose that anyone with the link can view the shared content.
- Treat external content and model responses as untrusted input.

## 6. Proposed technical design

Select the exact stack after confirming team preferences and deployment constraints.

### Components

1. Web client: conversation, structured brief, comparison cards, itinerary editor, budget, and revision review.
2. Application API: session handling, persistence, validation, orchestration, and rate limits.
3. AI adapter: structured extraction, clarification, explanation, and proposed plan changes.
4. Travel-data adapters: transport, lodging, places, and routing behind provider-specific interfaces.
5. Deterministic planning rules: budget arithmetic, scheduling conflicts, constraint checks, and revision protections.
6. Persistent store: trip briefs, accepted plans, revisions, and evidence metadata.

The model proposes structured data; application rules validate it before persistence or display as an accepted plan. Invalid outputs produce an explicit error or bounded retry, never a success-shaped fallback.

### Core records

| Record | Key information |
|---|---|
| TripBrief | Origin, dates, travelers, budget, preferences, constraints, unresolved fields |
| DestinationCandidate | Match rationale, cost range, transport strategy, evidence, feasibility status |
| Itinerary | Destination, dated days, scheduled items, protected free blocks, budget, version |
| ScheduledItem | Start/end, local time zone, location, duration, transfer, cost, booking requirement |
| CostItem | Category, quantity, unit basis, currency, range, tax treatment, evidence |
| Evidence | Source URL/provider, retrieval time, validity window if known, verification status |
| PlanRevision | Base version, requested change, proposed differences, validation findings, acceptance state |

Use version checks to prevent a late AI response from overwriting a newer accepted plan.

### Request flow

1. Load the current brief and accepted plan version.
2. Extract a validated intent and structured field changes.
3. Ask clarification when a blocking field is unresolved.
4. Fetch relevant travel evidence when available.
5. Generate candidate recommendations or a proposed revision.
6. Run deterministic constraint, schedule, and cost validation.
7. Display results with uncertainty and validation findings.
8. Persist only the revision the traveler accepts.

## 7. Implementation phases

### Phase 1: Validate the interaction

Build a responsive prototype with Bedrock-backed trip intake. Any destination suggestions, prices, or itinerary details shown before travel-data integrations are available must come from a curated dataset and be labeled as sample information.

Deliver:
- Free-text trip intake, editable brief, one-at-a-time clarifications, and explicit brief confirmation.
- Destination comparison, itinerary, and budget are outside the Trip Intake prototype. If added as a later sample-data slice, label all such content as curated and unverified.
- Empty, loading, and error states.

Exit: travelers can submit an arbitrary prompt, review and confirm a validated trip brief, and understand that intake confirmation does not mean a trip is feasible, priced, available, or booked.

### Phase 2: Add persistent planning

Deliver:
- Persistent trip storage and accepted-plan revision history.
- Clarification and constraint validation.
- Budget calculation and schedule checks.
- Accepted revisions, concurrency protection, print/share, and deletion.

Exit: stored plans survive reload, invalid model output is rejected, and regression tests pass.

### Phase 3: Ground recommendations in travel data

Evaluate providers for supported geographies, licensing, pricing coverage, update frequency, routing quality, rate limits, and operating cost before selection.

Deliver:
- Evidence-backed transport, lodging, places, and routing integrations.
- Caching and freshness policies appropriate to each provider.
- Explicit partial-data and provider-failure handling.
- Car-free leg validation and dated seasonal guidance.

Exit: factual claims are traceable, estimates remain labeled, and missing data cannot produce a misleading feasibility claim.

### Phase 4: Pilot and harden

Deliver:
- Accessibility and responsive-interface checks.
- Privacy controls, rate limits, observability, and cost monitoring.
- Evaluation dataset and user testing across budget and party scenarios.
- Failure recovery and deployment/rollback procedures.

Exit: pilot users can complete and revise plans, and operational failures are diagnosable without retaining unnecessary personal data.

## 8. Acceptance tests

| Scenario | Acceptance criterion |
|---|---|
| Initial Chicago request | Extracts two adults, five days, May, $2,500 party budget, interests, and no rental car; leaves unspecified year and date details unresolved. |
| Missing information | Asks only unanswered, decision-relevant questions; provisional results display unresolved assumptions. |
| No feasible candidates | Explains the constraint conflict and requests permission before relaxation. |
| Budget calculation | Displayed total equals the sum of itemized costs after rounding, within $0.01; shared lodging is not multiplied by traveler count. |
| Budget boundary | An upper estimate of exactly $2,500 fits a $2,500 budget; a range extending to $2,500.01 is "budget at risk" when its lower bound fits. |
| Missing costs | Missing major transport or lodging costs prevents an "estimated within budget" classification. |
| No rental car | Every required leg has an allowed mode and explicit verification status; unresolved legs prevent a fully validated car-free claim. |
| Scheduling | No overlaps; transfer time and arrival/departure buffers are included; unavailable hours are flagged. |
| Less busy second day | Scheduled activity-plus-transfer minutes decrease on day two; all changes are shown; unrelated days stay unchanged unless dependencies are explained. |
| Child comparison | Requests age and change intent; hypothetical analysis does not mutate the accepted party or plan. |
| Free afternoon | Chosen afternoon has zero scheduled items or transfers and stays empty after later refinements; block boundaries are visible and editable. |
| Revision safety | Rejecting leaves the accepted plan unchanged; accepting creates a version; undo restores the prior accepted version. |
| Concurrent revisions | A proposal based on an outdated version cannot silently overwrite the current plan. |
| Provider failure | Shows the unavailable data and recovery option; no invented price or silent fallback. |
| Persistence | Reload restores the accepted brief and plan; deletion removes access to the plan and its share link. |

Use unit tests for arithmetic and validation, integration tests for AI/provider contracts and persistence, and end-to-end tests for the complete journey. Test travel-provider behavior with controlled fixtures; separately verify real provider contracts without asserting unstable live prices.

## 9. Measurement

Track, with privacy-conscious instrumentation:
- Time and clarification turns to the first useful shortlist.
- Share of users selecting a destination and accepting a plan.
- Rate of hard-constraint violations in accepted plans.
- Cost-data and transport-leg evidence coverage.
- Revision acceptance, rejection, and undo rates.
- Provider failure rate, latency, and AI/provider cost per completed plan.
- User-rated confidence in feasibility and clarity of trade-offs.

Set launch targets after prototype testing establishes a baseline. Hard constraints must have zero known violations in a plan presented as fully validated.

## 10. Decisions before production implementation

- Supported destinations and domestic versus international launch scope.
- Meaning and policy for verified feasibility versus provisional recommendations.
- Travel-data provider coverage, licensing, and commercial budget.
- Travel-data integrations and the conditions for replacing curated sample data with sourced travel information.
- AWS hosting service, region, and infrastructure operating-cost limits.
- Anonymous versus authenticated persistence and retention duration.
- How accessibility needs and family-specific accommodation requirements will be verified.

Recommended next step: validate the Bedrock-backed trip-intake prototype with travelers; keep any unsourced destination, price, and itinerary content clearly labeled as curated sample data until live travel-data integrations are added.

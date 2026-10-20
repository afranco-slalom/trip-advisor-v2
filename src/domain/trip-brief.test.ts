import assert from "node:assert/strict";
import test from "node:test";
import {
  confirmTripBrief,
  createEmptyTripBrief,
  createTripIntakeState,
  editTripBrief,
  getMissingRequiredFields,
  getNextClarification,
  getTripLengthNights,
  parseTripBrief,
  type TripBrief,
} from "./trip-brief.ts";

function completeBrief(): TripBrief {
  return {
    origin: "Chicago",
    arrivalDate: "2027-05-10",
    departureDate: "2027-05-15",
    statedDurationDays: 5,
    travelers: { adults: 2, children: [] },
    budget: {
      amount: 2500,
      currency: "USD",
      basis: "party",
      coverage: {
        transportation: true,
        lodging: true,
        food: true,
        activities: true,
      },
    },
    interests: ["food", "nature", "walkable"],
    transportationPreferences: ["no rental car"],
    accessibilityNeeds: null,
  };
}

test("parses an incomplete example prompt without inventing dates or coverage", () => {
  const result = parseTripBrief({
    origin: " Chicago ",
    arrivalDate: null,
    departureDate: null,
    statedDurationDays: 5,
    travelers: { adults: 2, children: [] },
    budget: {
      amount: 2500,
      currency: "USD",
      basis: "party",
      coverage: {
        transportation: null,
        lodging: null,
        food: null,
        activities: null,
      },
    },
    interests: ["food", "nature", "walkable"],
    transportationPreferences: ["no rental car"],
    accessibilityNeeds: null,
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.brief.origin, "Chicago");
  assert.equal(result.brief.arrivalDate, null);
  assert.equal(result.brief.departureDate, null);
  assert.deepEqual(getMissingRequiredFields(result.brief), [
    "dates",
    "budgetCoverage",
  ]);
  assert.equal(getNextClarification(result.brief)?.field, "dates");
});

test("rejects impossible dates and month-only dates", () => {
  const invalid = parseTripBrief({
    arrivalDate: "2027-02-29",
    departureDate: "May",
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    assert.deepEqual(
      invalid.issues.map((issue) => issue.field),
      ["arrivalDate", "departureDate"],
    );
  }
});

test("derives trip length in nights without treating stated days as nights", () => {
  const brief = completeBrief();
  assert.equal(getTripLengthNights(brief), 5);
  brief.departureDate = "2027-05-14";
  assert.equal(getTripLengthNights(brief), 4);
  assert.equal(brief.statedDurationDays, 5);
});

test("date difference handles leap day and year boundaries", () => {
  const brief = completeBrief();
  brief.arrivalDate = "2028-02-28";
  brief.departureDate = "2028-03-01";
  assert.equal(getTripLengthNights(brief), 2);
});

test("rejects departure date equal to or before arrival date", () => {
  for (const departureDate of ["2027-05-10", "2027-05-09"]) {
    const result = parseTripBrief({
      arrivalDate: "2027-05-10",
      departureDate,
    });
    assert.equal(result.ok, false);
  }
});

test("rejects non-positive or non-finite budget amounts", () => {
  const result = parseTripBrief({
    budget: { amount: 0, currency: "USD", basis: "party" },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.issues.some((issue) => issue.field === "budget.amount"));
  }
});

test("requires budget currency, basis, and every coverage answer", () => {
  const brief = completeBrief();
  brief.budget.currency = null;
  brief.budget.basis = null;
  brief.budget.coverage.food = null;
  assert.deepEqual(getMissingRequiredFields(brief), [
    "budgetCurrency",
    "budgetBasis",
    "budgetCoverage",
  ]);
  assert.equal(getNextClarification(brief)?.field, "budgetCurrency");
});

test("preserves false as an explicit budget coverage answer", () => {
  const brief = completeBrief();
  brief.budget.coverage.activities = false;
  assert.ok(!getMissingRequiredFields(brief).includes("budgetCoverage"));
});

test("requires child age or age range only when a child is included", () => {
  const noChildren = completeBrief();
  noChildren.travelers = { adults: 2, children: [] };
  assert.ok(!getMissingRequiredFields(noChildren).includes("childAges"));

  const withUnknownChild = completeBrief();
  withUnknownChild.travelers = { adults: 2, children: [null] };
  assert.ok(getMissingRequiredFields(withUnknownChild).includes("childAges"));

  const withChildAge = completeBrief();
  withChildAge.travelers = {
    adults: 2,
    children: [{ kind: "age", years: 8 }],
  };
  assert.ok(!getMissingRequiredFields(withChildAge).includes("childAges"));
});

test("accepts ordered child age ranges and rejects invalid ranges", () => {
  const valid = parseTripBrief({
    travelers: { adults: 2, children: [{ kind: "range", minYears: 5, maxYears: 8 }] },
  });
  assert.equal(valid.ok, true);

  const invalid = parseTripBrief({
    travelers: { adults: 2, children: [{ kind: "range", minYears: 9, maxYears: 8 }] },
  });
  assert.equal(invalid.ok, false);
});

test("at least one traveler is required", () => {
  const result = parseTripBrief({
    travelers: { adults: 0, children: [] },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.issues.some((issue) => issue.field === "travelers"));
  }
});

test("malformed provider data is rejected with field-specific issues", () => {
  const result = parseTripBrief({
    origin: 9,
    travelers: "two adults",
    budget: { amount: "2500", currency: "US dollars" },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.issues.some((issue) => issue.field === "origin"));
    assert.ok(result.issues.some((issue) => issue.field === "travelers"));
    assert.ok(result.issues.some((issue) => issue.field === "budget.amount"));
  }
});

test("unknown provider fields are discarded rather than retained", () => {
  const result = parseTripBrief({
    ...completeBrief(),
    children: [{ name: "private name", birthDate: "2018-01-01" }],
    privateNotes: "should not persist",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal("children" in result.brief, false);
    assert.equal("privateNotes" in result.brief, false);
  }
});

test("clarification order skips fields already resolved", () => {
  const brief = createEmptyTripBrief();
  brief.arrivalDate = "2027-05-10";
  brief.departureDate = "2027-05-15";
  assert.equal(getNextClarification(brief)?.field, "origin");
});

test("cannot confirm an incomplete brief", () => {
  const result = confirmTripBrief(createTripIntakeState());
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.clarification.field, "dates");
  }
});

test("confirms a complete brief and any edit clears confirmation", () => {
  const confirmed = confirmTripBrief(createTripIntakeState(completeBrief()));
  assert.equal(confirmed.ok, true);
  if (!confirmed.ok) return;

  const edited = editTripBrief(confirmed.state, {
    ...confirmed.state.brief,
    origin: "Milwaukee",
  });
  assert.equal(edited.confirmed, false);
  assert.equal(edited.brief.origin, "Milwaukee");
});

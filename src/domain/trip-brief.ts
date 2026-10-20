export type DateOnly = string;

export type BudgetBasis = "party" | "per_person";

export interface BudgetCoverage {
  transportation: boolean | null;
  lodging: boolean | null;
  food: boolean | null;
  activities: boolean | null;
}

export interface TripBudget {
  amount: number | null;
  currency: string | null;
  basis: BudgetBasis | null;
  coverage: BudgetCoverage;
}

export type ChildAge =
  | { kind: "age"; years: number }
  | { kind: "range"; minYears: number; maxYears: number };

export interface Travelers {
  adults: number | null;
  children: Array<ChildAge | null> | null;
}

export interface TripBrief {
  origin: string | null;
  arrivalDate: DateOnly | null;
  departureDate: DateOnly | null;
  statedDurationDays: number | null;
  travelers: Travelers | null;
  budget: TripBudget;
  interests: string[] | null;
  transportationPreferences: string[] | null;
  accessibilityNeeds: string | null;
}

export interface TripBriefIssue {
  field: string;
  message: string;
}

export type ParseTripBriefResult =
  | { ok: true; brief: TripBrief }
  | { ok: false; issues: TripBriefIssue[] };

export type MissingTripField =
  | "dates"
  | "origin"
  | "travelers"
  | "childAges"
  | "budgetAmount"
  | "budgetCurrency"
  | "budgetBasis"
  | "budgetCoverage";

export interface Clarification {
  field: MissingTripField;
  question: string;
}

export interface TripIntakeState {
  brief: TripBrief;
  confirmed: boolean;
}

const COVERAGE_FIELDS = [
  "transportation",
  "lodging",
  "food",
  "activities",
] as const;

const REQUIRED_FIELD_ORDER: MissingTripField[] = [
  "dates",
  "origin",
  "travelers",
  "childAges",
  "budgetAmount",
  "budgetCurrency",
  "budgetBasis",
  "budgetCoverage",
];

const CLARIFICATION_QUESTIONS: Record<MissingTripField, string> = {
  dates: "What are your exact arrival and departure dates?",
  origin: "What city or region are you traveling from?",
  travelers: "How many adults and children are traveling?",
  childAges: "What is the age or age range of each child?",
  budgetAmount: "What is your total trip budget?",
  budgetCurrency: "What currency is that budget in?",
  budgetBasis: "Is that budget for the whole party or per person?",
  budgetCoverage:
    "Does your budget include transportation, lodging, food, and activities?",
};

export function createEmptyTripBrief(): TripBrief {
  return {
    origin: null,
    arrivalDate: null,
    departureDate: null,
    statedDurationDays: null,
    travelers: null,
    budget: {
      amount: null,
      currency: null,
      basis: null,
      coverage: {
        transportation: null,
        lodging: null,
        food: null,
        activities: null,
      },
    },
    interests: null,
    transportationPreferences: null,
    accessibilityNeeds: null,
  };
}

export function parseTripBrief(input: unknown): ParseTripBriefResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      issues: [{ field: "brief", message: "Expected a trip brief object." }],
    };
  }

  const issues: TripBriefIssue[] = [];
  const origin = readNullableString(input.origin, "origin", issues);
  const arrivalDate = readDate(input.arrivalDate, "arrivalDate", issues);
  const departureDate = readDate(input.departureDate, "departureDate", issues);
  const statedDurationDays = readNullablePositiveInteger(
    input.statedDurationDays,
    "statedDurationDays",
    issues,
  );
  const travelers = readTravelers(input.travelers, issues);
  const budget = readBudget(input.budget, issues);
  const interests = readNullableStringArray(input.interests, "interests", issues);
  const transportationPreferences = readNullableStringArray(
    input.transportationPreferences,
    "transportationPreferences",
    issues,
  );
  const accessibilityNeeds = readNullableString(
    input.accessibilityNeeds,
    "accessibilityNeeds",
    issues,
  );

  const brief: TripBrief = {
    origin,
    arrivalDate,
    departureDate,
    statedDurationDays,
    travelers,
    budget,
    interests,
    transportationPreferences,
    accessibilityNeeds,
  };
  issues.push(...getTripBriefIssues(brief));

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, brief };
}

export function getTripLengthNights(brief: TripBrief): number | null {
  if (
    !brief.arrivalDate ||
    !brief.departureDate ||
    !isValidDateOnly(brief.arrivalDate) ||
    !isValidDateOnly(brief.departureDate) ||
    brief.departureDate <= brief.arrivalDate
  ) {
    return null;
  }

  const arrival = Date.parse(`${brief.arrivalDate}T00:00:00Z`);
  const departure = Date.parse(`${brief.departureDate}T00:00:00Z`);
  return (departure - arrival) / 86_400_000;
}

export function getTripBriefIssues(brief: TripBrief): TripBriefIssue[] {
  const issues: TripBriefIssue[] = [];

  if (brief.origin !== null && brief.origin.trim().length === 0) {
    issues.push({ field: "origin", message: "Origin cannot be blank." });
  }

  if (brief.arrivalDate !== null && !isValidDateOnly(brief.arrivalDate)) {
    issues.push({ field: "arrivalDate", message: "Arrival date is invalid." });
  }
  if (brief.departureDate !== null && !isValidDateOnly(brief.departureDate)) {
    issues.push({ field: "departureDate", message: "Departure date is invalid." });
  }
  if (
    brief.arrivalDate &&
    brief.departureDate &&
    isValidDateOnly(brief.arrivalDate) &&
    isValidDateOnly(brief.departureDate) &&
    brief.departureDate <= brief.arrivalDate
  ) {
    issues.push({
      field: "departureDate",
      message: "Departure date must be after arrival date.",
    });
  }

  if (
    brief.statedDurationDays !== null &&
    (!Number.isInteger(brief.statedDurationDays) ||
      brief.statedDurationDays <= 0)
  ) {
    issues.push({
      field: "statedDurationDays",
      message: "Stated duration must be a positive whole number of days.",
    });
  }

  if (brief.travelers) {
    if (
      brief.travelers.adults !== null &&
      (!Number.isInteger(brief.travelers.adults) || brief.travelers.adults < 0)
    ) {
      issues.push({
        field: "travelers.adults",
        message: "Adult count must be a non-negative whole number.",
      });
    }
    if (
      brief.travelers.children !== null &&
      brief.travelers.children.length === 0 &&
      brief.travelers.adults === 0
    ) {
      issues.push({
        field: "travelers",
        message: "At least one traveler is required.",
      });
    }
    brief.travelers.children?.forEach((child, index) => {
      if (child && !isValidChildAge(child)) {
        issues.push({
          field: `travelers.children.${index}`,
          message: "Child age must be between 0 and 17 years.",
        });
      }
    });
  }

  if (brief.budget.amount !== null && (
    !Number.isFinite(brief.budget.amount) ||
    brief.budget.amount <= 0
  )) {
    issues.push({
      field: "budget.amount",
      message: "Budget amount must be a positive finite number.",
    });
  }
  if (
    brief.budget.currency !== null &&
    !/^[A-Z]{3}$/.test(brief.budget.currency)
  ) {
    issues.push({
      field: "budget.currency",
      message: "Currency must be a three-letter uppercase code.",
    });
  }
  if (
    brief.budget.basis !== null &&
    brief.budget.basis !== "party" &&
    brief.budget.basis !== "per_person"
  ) {
    issues.push({ field: "budget.basis", message: "Budget basis is invalid." });
  }
  for (const field of COVERAGE_FIELDS) {
    const value = brief.budget.coverage[field];
    if (value !== null && typeof value !== "boolean") {
      issues.push({
        field: `budget.coverage.${field}`,
        message: "Coverage must be true, false, or unresolved.",
      });
    }
  }

  return issues;
}

export function getMissingRequiredFields(
  brief: TripBrief,
): MissingTripField[] {
  const issues = getTripBriefIssues(brief);
  const invalidFields = new Set(issues.map((issue) => issue.field));

  const resolved: Record<MissingTripField, boolean> = {
    dates:
      brief.arrivalDate !== null &&
      brief.departureDate !== null &&
      getTripLengthNights(brief) !== null &&
      !invalidFields.has("arrivalDate") &&
      !invalidFields.has("departureDate"),
    origin:
      brief.origin !== null &&
      brief.origin.trim().length > 0 &&
      !invalidFields.has("origin"),
    travelers:
      brief.travelers !== null &&
      brief.travelers.adults !== null &&
      brief.travelers.children !== null &&
      !invalidFields.has("travelers") &&
      !invalidFields.has("travelers.adults"),
    childAges:
      brief.travelers === null ||
      brief.travelers.children === null ||
      brief.travelers.children.length === 0 ||
      brief.travelers.children.every(
        (child, index) =>
          child !== null &&
          isValidChildAge(child) &&
          !invalidFields.has(`travelers.children.${index}`),
      ),
    budgetAmount:
      brief.budget.amount !== null &&
      !invalidFields.has("budget.amount"),
    budgetCurrency:
      brief.budget.currency !== null &&
      !invalidFields.has("budget.currency"),
    budgetBasis:
      brief.budget.basis !== null &&
      !invalidFields.has("budget.basis"),
    budgetCoverage: COVERAGE_FIELDS.every(
      (field) => brief.budget.coverage[field] !== null,
    ),
  };

  return REQUIRED_FIELD_ORDER.filter((field) => !resolved[field]);
}

export function getNextClarification(
  brief: TripBrief,
): Clarification | null {
  const field = getMissingRequiredFields(brief)[0];
  return field ? { field, question: CLARIFICATION_QUESTIONS[field] } : null;
}

export function createTripIntakeState(
  brief: TripBrief = createEmptyTripBrief(),
): TripIntakeState {
  return { brief, confirmed: false };
}

export function editTripBrief(
  _state: TripIntakeState,
  brief: TripBrief,
): TripIntakeState {
  return { brief, confirmed: false };
}

export type ConfirmTripBriefResult =
  | { ok: true; state: TripIntakeState }
  | { ok: false; clarification: Clarification };

export function confirmTripBrief(
  state: TripIntakeState,
): ConfirmTripBriefResult {
  const clarification = getNextClarification(state.brief);
  if (clarification) {
    return { ok: false, clarification };
  }
  return { ok: true, state: { ...state, confirmed: true } };
}

function readNullableString(
  value: unknown,
  field: string,
  issues: TripBriefIssue[],
): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    issues.push({ field, message: "Expected text or null." });
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readDate(
  value: unknown,
  field: string,
  issues: TripBriefIssue[],
): DateOnly | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string" || !isValidDateOnly(value)) {
    issues.push({ field, message: "Expected a valid YYYY-MM-DD date." });
    return null;
  }
  return value;
}

function readNullablePositiveInteger(
  value: unknown,
  field: string,
  issues: TripBriefIssue[],
): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    issues.push({ field, message: "Expected a positive whole number or null." });
    return null;
  }
  return value;
}

function readTravelers(
  value: unknown,
  issues: TripBriefIssue[],
): Travelers | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!isRecord(value)) {
    issues.push({ field: "travelers", message: "Expected a traveler object." });
    return null;
  }

  const adultsValue = value.adults;
  let adults: number | null = null;
  if (adultsValue !== undefined && adultsValue !== null) {
    if (
      typeof adultsValue !== "number" ||
      !Number.isInteger(adultsValue) ||
      adultsValue < 0
    ) {
      issues.push({
        field: "travelers.adults",
        message: "Adult count must be a non-negative whole number.",
      });
    } else {
      adults = adultsValue;
    }
  }

  const childrenValue = value.children;
  let children: Array<ChildAge | null> | null = null;
  if (Array.isArray(childrenValue)) {
    children = childrenValue.map((child, index) =>
      readChildAge(child, `travelers.children.${index}`, issues),
    );
  } else if (childrenValue !== undefined && childrenValue !== null) {
    issues.push({
      field: "travelers.children",
      message: "Expected a list of child ages or null.",
    });
  }

  return { adults, children };
}

function readChildAge(
  value: unknown,
  field: string,
  issues: TripBriefIssue[],
): ChildAge | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!isRecord(value)) {
    issues.push({ field, message: "Expected an age object or null." });
    return null;
  }
  if (value.kind === "age") {
    if (!isChildYears(value.years)) {
      issues.push({ field, message: "Child age must be between 0 and 17." });
      return null;
    }
    return { kind: "age", years: value.years };
  }
  if (value.kind === "range") {
    if (
      !isChildYears(value.minYears) ||
      !isChildYears(value.maxYears) ||
      (value.minYears as number) > (value.maxYears as number)
    ) {
      issues.push({
        field,
        message: "Child age range must be ordered and between 0 and 17.",
      });
      return null;
    }
    return {
      kind: "range",
      minYears: value.minYears as number,
      maxYears: value.maxYears as number,
    };
  }
  issues.push({
    field,
    message: "Expected an age or age-range value.",
  });
  return null;
}

function readBudget(value: unknown, issues: TripBriefIssue[]): TripBudget {
  if (value !== undefined && value !== null && !isRecord(value)) {
    issues.push({ field: "budget", message: "Expected a budget object." });
    return createEmptyTripBrief().budget;
  }

  const budget = isRecord(value) ? value : {};
  let amount: number | null = null;
  if (budget.amount !== undefined && budget.amount !== null) {
    if (typeof budget.amount !== "number" || !Number.isFinite(budget.amount)) {
      issues.push({
        field: "budget.amount",
        message: "Budget amount must be a finite number or null.",
      });
    } else {
      amount = budget.amount;
    }
  }

  const currency = readNullableString(
    budget.currency,
    "budget.currency",
    issues,
  );
  const basisValue = budget.basis;
  let basis: BudgetBasis | null = null;
  if (basisValue === "party" || basisValue === "per_person") {
    basis = basisValue;
  } else if (basisValue !== undefined && basisValue !== null) {
    issues.push({
      field: "budget.basis",
      message: "Expected party, per_person, or null.",
    });
  }

  const coverageValue = budget.coverage;
  if (
    coverageValue !== undefined &&
    coverageValue !== null &&
    !isRecord(coverageValue)
  ) {
    issues.push({
      field: "budget.coverage",
      message: "Expected a budget coverage object.",
    });
  }
  const coverageRecord = isRecord(coverageValue) ? coverageValue : {};
  const coverage: BudgetCoverage = {
    transportation: readNullableBoolean(
      coverageRecord.transportation,
      "budget.coverage.transportation",
      issues,
    ),
    lodging: readNullableBoolean(
      coverageRecord.lodging,
      "budget.coverage.lodging",
      issues,
    ),
    food: readNullableBoolean(
      coverageRecord.food,
      "budget.coverage.food",
      issues,
    ),
    activities: readNullableBoolean(
      coverageRecord.activities,
      "budget.coverage.activities",
      issues,
    ),
  };

  return { amount, currency, basis, coverage };
}

function readNullableBoolean(
  value: unknown,
  field: string,
  issues: TripBriefIssue[],
): boolean | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "boolean") {
    issues.push({ field, message: "Expected true, false, or null." });
    return null;
  }
  return value;
}

function readNullableStringArray(
  value: unknown,
  field: string,
  issues: TripBriefIssue[],
): string[] | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    issues.push({ field, message: "Expected a list of text values or null." });
    return null;
  }
  return value.map((item: string) => item.trim()).filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) {
    return false;
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= daysInMonth;
}

function isChildYears(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < 18
  );
}

function isValidChildAge(child: ChildAge): boolean {
  if (child.kind === "age") {
    return isChildYears(child.years);
  }
  return (
    isChildYears(child.minYears) &&
    isChildYears(child.maxYears) &&
    child.minYears <= child.maxYears
  );
}

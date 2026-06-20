export const CUISINES = [
  "American",
  "American Southern",
  "American Cajun / Creole",
  "American Soul Food",
  "Californian",
  "New American",
  "Tex-Mex",
  "Mediterranean",
  "Italian",
  "Sicilian",
  "French",
  "Spanish",
  "Portuguese",
  "Greek",
  "Turkish",
  "Levantine",
  "Moroccan",
  "Mexican",
  "Central American",
  "South American",
  "Brazilian",
  "Peruvian",
  "Argentinian",
  "Japanese",
  "Sushi / Sashimi",
  "Ramen / Izakaya",
  "Chinese",
  "Cantonese",
  "Sichuan",
  "Taiwanese",
  "Filipino",
  "Indonesian",
  "Malaysian",
  "Singaporean",
  "Thai",
  "Laotian",
  "Indian",
  "North Indian",
  "South Indian",
  "Pakistani",
  "Bangladeshi",
  "Nepalese",
  "Sri Lankan",
  "Middle Eastern",
  "Korean",
  "Caribbean",
  "Jamaican",
  "Cuban",
  "Haitian",
  "Vietnamese",
  "African",
  "West African",
  "East African",
  "North African",
  "Ethiopian",
  "Russian",
  "Eastern European",
  "German",
  "Scandinavian",
  "Jewish / Israeli",
  "Plant-Based / Vegan",
  "Seafood-Focused",
  "Comfort Food",
] as const;

export type PersonQuestionnaire = {
  personName: string;
  portionSize: string;
  tryAnything: boolean;
  cuisineRatings: Record<string, number>;
  spiceLevel: number;
  allergies: string[];
  otherAllergies: string;
  favoriteFoods: string;
  avoidFoods: string;
};

export type QuestionnaireData = {
  household: PersonQuestionnaire[];
};

export const DEFAULT_HIGH_RATING = 4;

export const PORTION_SIZE_OPTIONS = ["Kid-sized", "Small", "Standard", "Large", "Extra large"] as const;

export const PORTION_SIZE_TO_SERVINGS: Record<(typeof PORTION_SIZE_OPTIONS)[number], number> = {
  "Kid-sized": 0.25,
  Small: 0.5,
  Standard: 1,
  Large: 1.5,
  "Extra large": 2,
};

export function getPortionSizeServings(portionSize: string): number {
  return PORTION_SIZE_TO_SERVINGS[portionSize as keyof typeof PORTION_SIZE_TO_SERVINGS] ?? 1;
}

export function formatServingFraction(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value - Math.round(value)) < 0.001) return String(Math.round(value));
  const rounded = Math.round(value * 4) / 4;
  return rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export const DEFAULT_CUISINE_RATINGS = Object.fromEntries(
  CUISINES.map((cuisine) => [cuisine, DEFAULT_HIGH_RATING])
) as Record<string, number>;

export function createDefaultPerson(personName = ""): PersonQuestionnaire {
  return {
    personName,
    portionSize: "Standard",
    tryAnything: true,
    cuisineRatings: { ...DEFAULT_CUISINE_RATINGS },
    spiceLevel: 0,
    allergies: [],
    otherAllergies: "",
    favoriteFoods: "",
    avoidFoods: "",
  };
}

export function createDefaultQuestionnaire(): QuestionnaireData {
  return { household: [createDefaultPerson()] };
}

function normalizeCuisineRatings(input: unknown): Record<string, number> {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return Object.fromEntries(
    CUISINES.map((cuisine) => {
      const value = Number(raw[cuisine]);
      if (Number.isInteger(value) && value >= 1 && value <= 5) {
        return [cuisine, value];
      }
      return [cuisine, DEFAULT_HIGH_RATING];
    })
  ) as Record<string, number>;
}

function normalizePerson(input: unknown): PersonQuestionnaire {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const portionSize = String(raw.portionSize ?? "Standard").trim();

  return {
    personName: String(raw.personName ?? "").trim(),
    portionSize: PORTION_SIZE_OPTIONS.includes(portionSize as (typeof PORTION_SIZE_OPTIONS)[number])
      ? portionSize
      : "Standard",
    tryAnything: Boolean(raw.tryAnything),
    cuisineRatings: normalizeCuisineRatings(raw.cuisineRatings),
    spiceLevel: Number(raw.spiceLevel) || 0,
    allergies: Array.isArray(raw.allergies)
      ? raw.allergies.map((a) => String(a).trim()).filter(Boolean)
      : [],
    otherAllergies: String(raw.otherAllergies ?? "").trim(),
    favoriteFoods: String(raw.favoriteFoods ?? "").trim(),
    avoidFoods: String(raw.avoidFoods ?? "").trim(),
  };
}

export function parseQuestionnaireData(raw: string | null): QuestionnaireData {
  if (!raw) {
    return createDefaultQuestionnaire();
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (Array.isArray(parsed.household)) {
      const household = parsed.household.map((member) => normalizePerson(member));
      return {
        household: household.length > 0 ? household : [createDefaultPerson()],
      };
    }

    // Backward compatibility with prior single-person format.
    return {
      household: [
        normalizePerson({
          personName: "",
          tryAnything: parsed.tryAnything,
          cuisineRatings: parsed.cuisineRatings,
          spiceLevel: parsed.spiceLevel,
          allergies: parsed.allergies,
          otherAllergies: parsed.otherAllergies,
          favoriteFoods: parsed.favoriteFoods,
          avoidFoods: parsed.avoidFoods,
        }),
      ],
    };
  } catch {
    return createDefaultQuestionnaire();
  }
}

export function isQuestionnaireComplete(data: QuestionnaireData | null | undefined): boolean {
  if (!data || !Array.isArray(data.household) || data.household.length === 0) {
    return false;
  }

  return data.household.every((member) => {
    if (!member.personName.trim()) {
      return false;
    }

    if (!PORTION_SIZE_OPTIONS.includes(member.portionSize as (typeof PORTION_SIZE_OPTIONS)[number])) {
      return false;
    }

    if (!Number.isInteger(member.spiceLevel) || member.spiceLevel < 1 || member.spiceLevel > 5) {
      return false;
    }

    return CUISINES.every((cuisine) => {
      const rating = member.cuisineRatings[cuisine];
      return Number.isInteger(rating) && rating >= 1 && rating <= 5;
    });
  });
}

export function isQuestionnaireCompleteRaw(raw: string | null): boolean {
  return isQuestionnaireComplete(parseQuestionnaireData(raw));
}

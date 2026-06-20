type IngredientLike = { name: string };

export const ALLERGY_TAGS = [
  "gluten",
  "dairy",
  "eggs",
  "soy",
  "peanuts",
  "tree nuts",
  "fish",
  "shellfish",
  "sesame",
] as const;

type AllergyTag = (typeof ALLERGY_TAGS)[number];

const ALLERGY_RULES = [
  { tag: "gluten", patterns: [/\bflour\b/i, /\bwheat\b/i, /\bbarley\b/i, /\brye\b/i, /\bsemolina\b/i, /\bbread crumbs?\b/i, /\bpanko\b/i, /\bpasta\b/i] },
  { tag: "dairy", patterns: [/\bbutter\b/i, /\bmilk\b/i, /\bcream\b/i, /\bcheese\b/i, /\byogurt\b/i, /\bbuttermilk\b/i, /\bparmesan\b/i, /\bmozzarella\b/i] },
  { tag: "eggs", patterns: [/\begg(s)?\b/i, /\bmayonnaise\b/i, /\baioli\b/i] },
  { tag: "soy", patterns: [/\bsoy\b/i, /\bsoy sauce\b/i, /\btamari\b/i, /\bmiso\b/i, /\btofu\b/i, /\bedamame\b/i] },
  { tag: "peanuts", patterns: [/\bpeanut(s)?\b/i, /\bgroundnut(s)?\b/i] },
  { tag: "tree nuts", patterns: [/\balmond(s)?\b/i, /\bwalnut(s)?\b/i, /\bpecan(s)?\b/i, /\bcashew(s)?\b/i, /\bpistachio(s)?\b/i, /\bhazelnut(s)?\b/i, /\bmacadamia\b/i, /\bpine nut(s)?\b/i] },
  { tag: "fish", patterns: [/\bfish\b/i, /\bsalmon\b/i, /\btuna\b/i, /\bcod\b/i, /\banchovy\b/i, /\bsardine\b/i] },
  { tag: "shellfish", patterns: [/\bshrimp\b/i, /\bprawn(s)?\b/i, /\bcrab\b/i, /\blobster\b/i, /\bclam(s)?\b/i, /\bmussel(s)?\b/i, /\boyster(s)?\b/i, /\bscallop(s)?\b/i] },
  { tag: "sesame", patterns: [/\bsesame\b/i, /\btahini\b/i, /\bhalva\b/i] },
] as const;

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

const ALLERGY_MATCHERS: Array<{ tag: AllergyTag; patterns: RegExp[] }> = [
  { tag: "gluten", patterns: [/\bgluten\b/i, /\bflour\b/i, /\bwheat\b/i, /\bbarley\b/i, /\brye\b/i, /\bsemolina\b/i, /\bbread crumbs?\b/i, /\bpanko\b/i, /\bpasta\b/i] },
  { tag: "dairy", patterns: [/\bdairy\b/i, /\bbutter\b/i, /\bmilk\b/i, /\bcream\b/i, /\bcheese\b/i, /\byogurt\b/i, /\bbuttermilk\b/i, /\bparmesan\b/i, /\bmozzarella\b/i] },
  { tag: "eggs", patterns: [/\begg(s)?\b/i, /\beggs\b/i, /\bmayonnaise\b/i, /\baioli\b/i] },
  { tag: "soy", patterns: [/\bsoy\b/i, /\bsoy sauce\b/i, /\btamari\b/i, /\bmiso\b/i, /\btofu\b/i, /\bedamame\b/i] },
  { tag: "peanuts", patterns: [/\bpeanut(s)?\b/i, /\bgroundnut(s)?\b/i] },
  { tag: "tree nuts", patterns: [/\btree nuts?\b/i, /\balmond(s)?\b/i, /\bwalnut(s)?\b/i, /\bpecan(s)?\b/i, /\bcashew(s)?\b/i, /\bpistachio(s)?\b/i, /\bhazelnut(s)?\b/i, /\bmacadamia\b/i, /\bpine nut(s)?\b/i] },
  { tag: "fish", patterns: [/\bfish\b/i, /\bsalmon\b/i, /\btuna\b/i, /\bcod\b/i, /\banchovy\b/i, /\bsardine\b/i] },
  { tag: "shellfish", patterns: [/\bshellfish\b/i, /\bshrimp\b/i, /\bprawn(s)?\b/i, /\bcrab\b/i, /\blobster\b/i, /\bclam(s)?\b/i, /\bmussel(s)?\b/i, /\boyster(s)?\b/i, /\bscallop(s)?\b/i] },
  { tag: "sesame", patterns: [/\bsesame\b/i, /\btahini\b/i, /\bhalva\b/i] },
];

export function getAutoAllergyTags(ingredients: IngredientLike[]): string[] {
  const haystack = ingredients.map((ingredient) => ingredient.name).join(" | ");
  const found = new Set<string>();

  for (const rule of ALLERGY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      found.add(rule.tag);
    }
  }

  return Array.from(found);
}

export function mergeRecipeTags(manualTags: string | null | undefined, autoTags: string[]): string | null {
  const merged = new Set<string>();

  for (const tag of String(manualTags ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)) {
    merged.add(normalizeTag(tag));
  }

  for (const tag of autoTags) {
    merged.add(normalizeTag(tag));
  }

  const values = Array.from(merged).filter(Boolean);
  return values.length > 0 ? values.join(", ") : null;
}

export function getAllergyTagsFromText(value: string | null | undefined): string[] {
  const text = String(value ?? "").trim();
  if (!text) return [];

  const found = new Set<string>();
  for (const rule of ALLERGY_MATCHERS) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      found.add(rule.tag);
    }
  }

  return Array.from(found);
}
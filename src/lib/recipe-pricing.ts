type IngredientInput = {
  name: string;
  quantity: string | null;
  unit: string | null;
};

type IngredientPrice = {
  ingredientKey: string;
  packagePrice: number;
  packageAmount: number;
  packageUnit: string;
};

type UnitFamily = "weight" | "volume" | "count";

const WEIGHT_TO_GRAMS = {
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
} as const;

const TSP_TO_ML = 4.92892159375;

const VOLUME_TO_ML = {
  ml: 1,
  l: 1000,
  tsp: TSP_TO_ML,
  pinch: TSP_TO_ML / 8,
  tbsp: TSP_TO_ML * 3,
  cup: TSP_TO_ML * 48,
  fl_oz: TSP_TO_ML * 6,
  pint: TSP_TO_ML * 96,
  quart: TSP_TO_ML * 192,
  gallon: TSP_TO_ML * 768,
} as const;

const UNIT_ALIASES: Record<string, { canonical: string; family: UnitFamily; toBase: number }> = {
  g: { canonical: "g", family: "weight", toBase: WEIGHT_TO_GRAMS.g },
  gram: { canonical: "g", family: "weight", toBase: WEIGHT_TO_GRAMS.g },
  grams: { canonical: "g", family: "weight", toBase: WEIGHT_TO_GRAMS.g },
  kg: { canonical: "kg", family: "weight", toBase: WEIGHT_TO_GRAMS.kg },
  kilogram: { canonical: "kg", family: "weight", toBase: WEIGHT_TO_GRAMS.kg },
  kilograms: { canonical: "kg", family: "weight", toBase: WEIGHT_TO_GRAMS.kg },
  lb: { canonical: "lb", family: "weight", toBase: WEIGHT_TO_GRAMS.lb },
  lbs: { canonical: "lb", family: "weight", toBase: WEIGHT_TO_GRAMS.lb },
  pound: { canonical: "lb", family: "weight", toBase: WEIGHT_TO_GRAMS.lb },
  pounds: { canonical: "lb", family: "weight", toBase: WEIGHT_TO_GRAMS.lb },
  oz: { canonical: "oz", family: "weight", toBase: WEIGHT_TO_GRAMS.oz },
  ounce: { canonical: "oz", family: "weight", toBase: WEIGHT_TO_GRAMS.oz },
  ounces: { canonical: "oz", family: "weight", toBase: WEIGHT_TO_GRAMS.oz },

  ml: { canonical: "ml", family: "volume", toBase: VOLUME_TO_ML.ml },
  milliliter: { canonical: "ml", family: "volume", toBase: VOLUME_TO_ML.ml },
  milliliters: { canonical: "ml", family: "volume", toBase: VOLUME_TO_ML.ml },
  l: { canonical: "l", family: "volume", toBase: VOLUME_TO_ML.l },
  liter: { canonical: "l", family: "volume", toBase: VOLUME_TO_ML.l },
  liters: { canonical: "l", family: "volume", toBase: VOLUME_TO_ML.l },
  tsp: { canonical: "tsp", family: "volume", toBase: VOLUME_TO_ML.tsp },
  tsps: { canonical: "tsp", family: "volume", toBase: VOLUME_TO_ML.tsp },
  teaspoon: { canonical: "tsp", family: "volume", toBase: VOLUME_TO_ML.tsp },
  teaspoons: { canonical: "tsp", family: "volume", toBase: VOLUME_TO_ML.tsp },
  t: { canonical: "tsp", family: "volume", toBase: VOLUME_TO_ML.tsp },
  tbsp: { canonical: "tbsp", family: "volume", toBase: VOLUME_TO_ML.tbsp },
  tbs: { canonical: "tbsp", family: "volume", toBase: VOLUME_TO_ML.tbsp },
  tbl: { canonical: "tbsp", family: "volume", toBase: VOLUME_TO_ML.tbsp },
  tablespoon: { canonical: "tbsp", family: "volume", toBase: VOLUME_TO_ML.tbsp },
  tablespoons: { canonical: "tbsp", family: "volume", toBase: VOLUME_TO_ML.tbsp },
  cup: { canonical: "cup", family: "volume", toBase: VOLUME_TO_ML.cup },
  cups: { canonical: "cup", family: "volume", toBase: VOLUME_TO_ML.cup },
  c: { canonical: "cup", family: "volume", toBase: VOLUME_TO_ML.cup },
  pint: { canonical: "pint", family: "volume", toBase: VOLUME_TO_ML.pint },
  pints: { canonical: "pint", family: "volume", toBase: VOLUME_TO_ML.pint },
  pt: { canonical: "pint", family: "volume", toBase: VOLUME_TO_ML.pint },
  quart: { canonical: "quart", family: "volume", toBase: VOLUME_TO_ML.quart },
  quarts: { canonical: "quart", family: "volume", toBase: VOLUME_TO_ML.quart },
  qt: { canonical: "quart", family: "volume", toBase: VOLUME_TO_ML.quart },
  gallon: { canonical: "gallon", family: "volume", toBase: VOLUME_TO_ML.gallon },
  gallons: { canonical: "gallon", family: "volume", toBase: VOLUME_TO_ML.gallon },
  gal: { canonical: "gallon", family: "volume", toBase: VOLUME_TO_ML.gallon },
  fl_oz: { canonical: "fl_oz", family: "volume", toBase: VOLUME_TO_ML.fl_oz },
  floz: { canonical: "fl_oz", family: "volume", toBase: VOLUME_TO_ML.fl_oz },
  "fl oz": { canonical: "fl_oz", family: "volume", toBase: VOLUME_TO_ML.fl_oz },
  "fluid ounce": { canonical: "fl_oz", family: "volume", toBase: VOLUME_TO_ML.fl_oz },
  "fluid ounces": { canonical: "fl_oz", family: "volume", toBase: VOLUME_TO_ML.fl_oz },

  each: { canonical: "each", family: "count", toBase: 1 },
  ea: { canonical: "each", family: "count", toBase: 1 },
  unit: { canonical: "each", family: "count", toBase: 1 },
  units: { canonical: "each", family: "count", toBase: 1 },
  whole: { canonical: "each", family: "count", toBase: 1 },
  wholes: { canonical: "each", family: "count", toBase: 1 },
  head: { canonical: "each", family: "count", toBase: 1 },
  heads: { canonical: "each", family: "count", toBase: 1 },
  stalk: { canonical: "each", family: "count", toBase: 1 },
  stalks: { canonical: "each", family: "count", toBase: 1 },
  fillet: { canonical: "each", family: "count", toBase: 1 },
  fillets: { canonical: "each", family: "count", toBase: 1 },
  slice: { canonical: "each", family: "count", toBase: 1 },
  slices: { canonical: "each", family: "count", toBase: 1 },
  leaf: { canonical: "each", family: "count", toBase: 1 },
  leaves: { canonical: "each", family: "count", toBase: 1 },
  pinch: { canonical: "pinch", family: "volume", toBase: VOLUME_TO_ML.pinch },
  pinches: { canonical: "pinch", family: "volume", toBase: VOLUME_TO_ML.pinch },
  dash: { canonical: "each", family: "count", toBase: 1 },
  dashes: { canonical: "each", family: "count", toBase: 1 },
  fresh: { canonical: "each", family: "count", toBase: 1 },
  piece: { canonical: "each", family: "count", toBase: 1 },
  pieces: { canonical: "each", family: "count", toBase: 1 },
  clove: { canonical: "clove", family: "count", toBase: 1 },
  cloves: { canonical: "clove", family: "count", toBase: 1 },
  bag: { canonical: "bag", family: "count", toBase: 1 },
  bags: { canonical: "bag", family: "count", toBase: 1 },
  can: { canonical: "can", family: "count", toBase: 1 },
  cans: { canonical: "can", family: "count", toBase: 1 },
  bunch: { canonical: "bunch", family: "count", toBase: 30 },
  bunches: { canonical: "bunch", family: "count", toBase: 30 },
};

const INGREDIENT_DENSITY_G_PER_ML: Record<string, number> = {
  honey: 1.42,
  "maple syrup": 1.33,
  molasses: 1.45,
  "olive oil": 0.91,
  "vegetable oil": 0.92,
  "sunflower oil": 0.92,
  butter: 0.96,
  "soy sauce": 1.16,
  "fish sauce": 1.2,
  vinegar: 1.01,
  milk: 1.03,
  cream: 0.99,
  yogurt: 1.03,
  water: 1,
};

const DEFAULT_DENSITY_G_PER_ML = 1;

export function normalizeIngredientKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function singularizeToken(token: string): string {
  if (token.length <= 3 || token.endsWith("ss")) return token;
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith("oes") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function ingredientKeyCandidates(name: string): string[] {
  const normalized = normalizeIngredientKey(name);
  if (!normalized) return [];

  const singularized = normalized
    .split(" ")
    .map(singularizeToken)
    .join(" ");

  return singularized !== normalized ? [normalized, singularized] : [normalized];
}

export function parseQuantity(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;

  const mixedMatch = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const num = Number(mixedMatch[2]);
    const den = Number(mixedMatch[3]);
    if (den !== 0) return whole + num / den;
  }

  const fractionMatch = text.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = Number(fractionMatch[1]);
    const den = Number(fractionMatch[2]);
    if (den !== 0) return num / den;
  }

  const numMatch = text.match(/\d+(?:\.\d+)?/);
  if (!numMatch) return null;
  const value = Number(numMatch[0]);
  return Number.isFinite(value) ? value : null;
}

export function normalizeUnit(raw: string | null | undefined): { canonical: string; family: UnitFamily; toBase: number } | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase().replace(/\./g, "").replace(/[_-]/g, " ").replace(/\s+/g, " ");
  const compact = cleaned.replace(/\s+/g, "");
  const singular = cleaned.endsWith("s") ? cleaned.slice(0, -1) : cleaned;
  return UNIT_ALIASES[cleaned] ?? UNIT_ALIASES[compact] ?? UNIT_ALIASES[singular] ?? null;
}

function getDensityGPerMl(ingredientName: string): number | null {
  const key = normalizeIngredientKey(ingredientName);
  if (INGREDIENT_DENSITY_G_PER_ML[key]) return INGREDIENT_DENSITY_G_PER_ML[key];
  for (const [known, density] of Object.entries(INGREDIENT_DENSITY_G_PER_ML)) {
    if (key.includes(known)) return density;
  }
  return DEFAULT_DENSITY_G_PER_ML;
}

function convertAmountToUnit(
  amount: number,
  fromUnit: { canonical: string; family: UnitFamily; toBase: number },
  toUnit: { canonical: string; family: UnitFamily; toBase: number },
  ingredientName: string
): number | null {
  if (fromUnit.family === toUnit.family) {
    return (amount * fromUnit.toBase) / toUnit.toBase;
  }

  if (
    (fromUnit.family === "weight" && toUnit.family === "volume") ||
    (fromUnit.family === "volume" && toUnit.family === "weight")
  ) {
    const density = getDensityGPerMl(ingredientName);
    if (!density || density <= 0) return null;

    if (fromUnit.family === "weight") {
      const grams = amount * fromUnit.toBase;
      const ml = grams / density;
      return ml / toUnit.toBase;
    }

    const ml = amount * fromUnit.toBase;
    const grams = ml * density;
    return grams / toUnit.toBase;
  }

  return null;
}

function formatScaledQuantity(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";

  const whole = Math.floor(value);
  const frac = value - whole;
  const denominators = [2, 3, 4, 8, 16];

  let bestNum = 0;
  let bestDen = 1;
  let bestErr = Number.POSITIVE_INFINITY;

  for (const den of denominators) {
    const num = Math.round(frac * den);
    const err = Math.abs(frac - num / den);
    if (err < bestErr) {
      bestErr = err;
      bestNum = num;
      bestDen = den;
    }
  }

  if (bestErr > 0.03) {
    return value.toFixed(2).replace(/\.00$/, "");
  }

  if (bestNum === 0) return String(whole);
  if (bestNum === bestDen) return String(whole + 1);
  if (whole === 0) return `${bestNum}/${bestDen}`;
  return `${whole} ${bestNum}/${bestDen}`;
}

export function calculateRecipeCost(
  ingredients: IngredientInput[],
  prices: IngredientPrice[],
  servings = 1
): {
  estimatedCost: number | null;
  unresolved: string[];
  ingredientSummaries: string[];
} {
  let estimatedCost = 0;
  const blockingUnresolved: string[] = [];
  const unresolved: string[] = [];
  const ingredientSummaries: string[] = [];
  const servingScale = Math.max(1, servings) / Math.max(1, servings || 1);

  const priceMap = new Map(prices.map((item) => [normalizeIngredientKey(item.ingredientKey), item]));

  for (const ingredient of ingredients) {
    const pricing = ingredientKeyCandidates(ingredient.name)
      .map((candidate) => priceMap.get(candidate))
      .find((item): item is IngredientPrice => Boolean(item));

    if (!pricing) {
      unresolved.push(`${ingredient.name} (no base price)`);
      continue;
    }

    const packagePrice = Number(pricing.packagePrice);
    const packageAmount = parseQuantity(String(pricing.packageAmount));
    const packageUnit = normalizeUnit(pricing.packageUnit);
    const reqAmount = parseQuantity(ingredient.quantity);
    const reqUnit = normalizeUnit(ingredient.unit) ?? packageUnit;

    if (!Number.isFinite(packagePrice) || packagePrice < 0) {
      blockingUnresolved.push(`${ingredient.name} (invalid package price)`);
      continue;
    }

    if (!packageAmount || packageAmount <= 0) {
      blockingUnresolved.push(`${ingredient.name} (invalid package amount)`);
      continue;
    }

    if (!packageUnit || !reqUnit) {
      blockingUnresolved.push(`${ingredient.name} (unit mismatch: ${pricing.packageUnit} vs ${ingredient.unit ?? "none"})`);
      continue;
    }

    if (!reqAmount || reqAmount <= 0) {
      unresolved.push(`${ingredient.name} (missing/invalid recipe quantity)`);
      continue;
    }

    const scaledReqAmount = reqAmount * servingScale;
    const requiredInPackageUnits = convertAmountToUnit(scaledReqAmount, reqUnit, packageUnit, ingredient.name);

    if (!requiredInPackageUnits || requiredInPackageUnits <= 0) {
      // Last-resort fallback for any unit mismatch: proportion by entered amounts.
      estimatedCost += packagePrice * (scaledReqAmount / packageAmount);
      unresolved.push(`${ingredient.name} (estimated via amount ratio fallback: ${pricing.packageUnit} vs ${ingredient.unit ?? "none"})`);
      ingredientSummaries.push(`${ingredient.name}: ${formatScaledQuantity(scaledReqAmount)} ${ingredient.unit ?? ""}`.trim());
      continue;
    }

    if (packageAmount <= 0) {
      blockingUnresolved.push(`${ingredient.name} (invalid package size)`);
      continue;
    }

    estimatedCost += packagePrice * (requiredInPackageUnits / packageAmount);
    ingredientSummaries.push(`${ingredient.name}: ${formatScaledQuantity(scaledReqAmount)} ${ingredient.unit ?? ""}`.trim());
  }

  return {
    estimatedCost: blockingUnresolved.length === 0 ? estimatedCost : null,
    unresolved: [...blockingUnresolved, ...unresolved],
    ingredientSummaries,
  };
}
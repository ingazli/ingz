"use client";

import { useMemo, useState } from "react";

type ClientOption = {
  id: string;
  name: string;
  email: string;
};

type QuoteItem = {
  id: string;
  client: ClientOption;
  mealsCount: number;
  groceryCost: number;
  laborHours: number;
  laborRate: number;
  profitPercent: number;
  breakEvenCost: number;
  totalQuote: number;
  costPerMeal: number;
  quotePerMeal: number;
  note: string | null;
  createdAt: string;
};

type MenuItemCostInput = {
  id: string;
  name: string;
  baseServings: number;
  ingredientRequirements: Array<{
    name: string;
    quantity: string | null;
    unit: string | null;
  }>;
};

type IngredientPriceItem = {
  ingredientKey: string;
  ingredientName: string;
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

const PACKAGE_UNIT_OPTIONS = ["g", "kg", "oz", "lb", "ml", "l", "cup", "tbsp", "tsp", "pint", "quart", "gallon", "fl_oz", "each", "clove", "can", "bag", "bunch"];

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

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function normalizeIngredientKey(name: string): string {
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

function normalizeUnit(raw: string | null | undefined): { canonical: string; family: UnitFamily; toBase: number } | null {
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

function parseQuantity(raw: string | null | undefined): number | null {
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

function unitLabel(unit: string): string {
  const normalized = normalizeUnit(unit);
  return normalized?.canonical ?? unit;
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

export default function QuoteMakerPanel({
  clients,
  initialQuotes,
  recipeCatalog,
  initialIngredientPrices,
}: {
  clients: ClientOption[];
  initialQuotes: QuoteItem[];
  recipeCatalog: MenuItemCostInput[];
  initialIngredientPrices: IngredientPriceItem[];
}) {
  const [quotes, setQuotes] = useState<QuoteItem[]>(initialQuotes);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [mealsCount, setMealsCount] = useState("10");
  const [groceryCost, setGroceryCost] = useState("0");
  const [laborHours, setLaborHours] = useState("0");
  const [laborRate, setLaborRate] = useState("0");
  const [profitPercent, setProfitPercent] = useState("20");
  const [note, setNote] = useState("");
  const [useIngredientEstimate, setUseIngredientEstimate] = useState(true);
  const [priceByIngredient, setPriceByIngredient] = useState<Record<string, { packagePrice: string; packageAmount: string; packageUnit: string }>>(
    initialIngredientPrices.reduce((acc, row) => {
      const value = {
        packagePrice: String(row.packagePrice),
        packageAmount: String(row.packageAmount),
        packageUnit: row.packageUnit,
      };

      for (const candidate of ingredientKeyCandidates(row.ingredientKey)) {
        acc[candidate] = value;
      }
      for (const candidate of ingredientKeyCandidates(row.ingredientName)) {
        acc[candidate] = value;
      }

      return acc;
    }, {} as Record<string, { packagePrice: string; packageAmount: string; packageUnit: string }>)
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [ingredientSaveStatus, setIngredientSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [ingredientSaveError, setIngredientSaveError] = useState<string>("");
  const [expandedMenuItemId, setExpandedMenuItemId] = useState<string | null>(null);
  const [servingsByRecipe, setServingsByRecipe] = useState<Record<string, string>>(
    Object.fromEntries(recipeCatalog.map((recipe) => [recipe.id, String(recipe.baseServings || 1)]))
  );

  const ingredientRows = useMemo(() => {
    if (!recipeCatalog.length) return [] as Array<{ key: string; name: string; usageCount: number; sampleUnit: string | null }>;

    const counts = new Map<string, { name: string; usageCount: number; sampleUnit: string | null }>();
    for (const item of recipeCatalog) {
      const seenForItem = new Set<string>();
      for (const req of item.ingredientRequirements) {
        const key = normalizeIngredientKey(req.name);
        if (seenForItem.has(key)) continue;
        seenForItem.add(key);

        const existing = counts.get(key);
        if (existing) {
          existing.usageCount += 1;
          if (!existing.sampleUnit && req.unit) existing.sampleUnit = req.unit;
        } else {
          counts.set(key, { name: req.name, usageCount: 1, sampleUnit: req.unit ?? null });
        }
      }
    }

    return Array.from(counts.entries())
      .map(([key, value]) => ({ key, name: value.name, usageCount: value.usageCount, sampleUnit: value.sampleUnit }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [recipeCatalog]);

  async function saveIngredientPrices() {
    setIngredientSaveStatus("saving");
    setIngredientSaveError("");

    const items = ingredientRows
      .map((row) => {
        const pricing = priceByIngredient[row.key];
        if (!pricing) return null;
        const packagePrice = Number(pricing.packagePrice);
        const packageAmount = Number(pricing.packageAmount);
        if (!Number.isFinite(packagePrice) || packagePrice < 0) return null;
        if (!Number.isFinite(packageAmount) || packageAmount <= 0) return null;

        return {
          ingredientKey: row.key,
          ingredientName: row.name,
          packagePrice,
          packageAmount,
          packageUnit: pricing.packageUnit,
        };
      })
      .filter(Boolean) as IngredientPriceItem[];

    if (items.length === 0) {
      const errorMsg = "Please enter valid prices for at least one ingredient.";
      console.warn(errorMsg);
      setIngredientSaveError(errorMsg);
      setIngredientSaveStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/chef/ingredient-prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ items }),
      });

      const raw = await res.text();
      let data: Record<string, unknown> | null = null;
      if (raw.trim()) {
        try {
          data = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          data = null;
        }
      }

      if (!res.ok) {
        const apiError = typeof data?.error === "string" ? data.error : "";
        const apiDetails = typeof data?.details === "string" ? data.details : "";
        const fallback = raw.trim() || res.statusText || "Unknown server error";
        const errorMsg = apiError
          ? apiDetails
            ? `${apiError}: ${apiDetails}`
            : apiError
          : `Server error (${res.status}): ${fallback}`;
        console.error("Failed to save ingredient prices", {
          status: res.status,
          statusText: res.statusText,
          payload: data ?? raw,
        });
        setIngredientSaveError(errorMsg);
        setIngredientSaveStatus("error");
        return;
      }

      console.log("Ingredient prices saved successfully:", data ?? raw);
      setIngredientSaveStatus("saved");
      setIngredientSaveError("");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error";
      console.error("Error saving ingredient prices:", error);
      setIngredientSaveError(errorMsg);
      setIngredientSaveStatus("error");
    }
  }

  const menuItemCosts = useMemo(() => {
    if (!recipeCatalog.length)
      return [] as Array<{
        id: string;
        recipeName: string;
        baseServings: number;
        desiredServings: number;
        estimatedCost: number | null;
        unresolved: string[];
        scaledIngredientSummaries: string[];
        ingredientBreakdown: Array<{
          name: string;
          quantity: string;
          unit: string;
          cost: number | null;
          note: string | null;
        }>;
      }>;

    return recipeCatalog.map((item) => {
      let estimatedCost = 0;
      const blockingUnresolved: string[] = [];
      const unresolved: string[] = [];
      const scaledIngredientSummaries: string[] = [];
      const ingredientBreakdown: Array<{
        name: string;
        quantity: string;
        unit: string;
        cost: number | null;
        note: string | null;
      }> = [];
      const baseServings = item.baseServings > 0 ? item.baseServings : 1;
      const desiredServings = Math.max(1, Number(servingsByRecipe[item.id]) || baseServings);
      const servingScale = desiredServings / baseServings;

      for (const req of item.ingredientRequirements) {
        const key = ingredientKeyCandidates(req.name).find((candidate) => Boolean(priceByIngredient[candidate]));
        const pricing = key ? priceByIngredient[key] : undefined;
        const reqAmount = parseQuantity(req.quantity);
        const scaledQuantityText = reqAmount ? formatScaledQuantity(reqAmount * servingScale) : req.quantity ?? "0";
        if (!pricing) {
          unresolved.push(`${req.name} (no base price)`);
          ingredientBreakdown.push({
            name: req.name,
            quantity: scaledQuantityText,
            unit: req.unit ?? "",
            cost: null,
            note: "No base price entered",
          });
          continue;
        }

        const packagePrice = Number(pricing.packagePrice);
        const packageAmount = parseQuantity(pricing.packageAmount);
        const packageUnit = normalizeUnit(pricing.packageUnit);
        const reqUnit = normalizeUnit(req.unit) ?? packageUnit;

        if (!Number.isFinite(packagePrice) || packagePrice < 0) {
          blockingUnresolved.push(`${req.name} (invalid package price)`);
          ingredientBreakdown.push({
            name: req.name,
            quantity: scaledQuantityText,
            unit: req.unit ?? "",
            cost: null,
            note: "Invalid package price",
          });
          continue;
        }

        if (!packageAmount || packageAmount <= 0) {
          blockingUnresolved.push(`${req.name} (invalid package amount)`);
          ingredientBreakdown.push({
            name: req.name,
            quantity: scaledQuantityText,
            unit: req.unit ?? "",
            cost: null,
            note: "Invalid package size",
          });
          continue;
        }

        if (!packageUnit || !reqUnit) {
          blockingUnresolved.push(`${req.name} (unit mismatch: ${pricing.packageUnit} vs ${req.unit ?? "none"})`);
          ingredientBreakdown.push({
            name: req.name,
            quantity: scaledQuantityText,
            unit: req.unit ?? "",
            cost: null,
            note: `Unit mismatch: ${pricing.packageUnit} vs ${req.unit ?? "none"}`,
          });
          continue;
        }

        if (!reqAmount || reqAmount <= 0) {
          unresolved.push(`${req.name} (missing/invalid recipe quantity)`);
          ingredientBreakdown.push({
            name: req.name,
            quantity: "0",
            unit: req.unit ?? "",
            cost: null,
            note: "Missing or invalid recipe quantity",
          });
          continue;
        }

        const scaledReqAmount = reqAmount * servingScale;
        const requiredInPackageUnits = convertAmountToUnit(scaledReqAmount, reqUnit, packageUnit, req.name);
        const ingredientCost = packagePrice * (requiredInPackageUnits && requiredInPackageUnits > 0 ? requiredInPackageUnits / packageAmount : scaledReqAmount / packageAmount);

        if (!requiredInPackageUnits || requiredInPackageUnits <= 0) {
          // Last-resort fallback for any unit mismatch: proportion by entered amounts.
          estimatedCost += ingredientCost;
          unresolved.push(`${req.name} (estimated via amount ratio fallback: ${pricing.packageUnit} vs ${req.unit ?? "none"})`);
          ingredientBreakdown.push({
            name: req.name,
            quantity: formatScaledQuantity(scaledReqAmount),
            unit: req.unit ?? "",
            cost: ingredientCost,
            note: `Estimated via amount ratio fallback`,
          });
          scaledIngredientSummaries.push(`${req.name}: ${formatScaledQuantity(scaledReqAmount)} ${req.unit ?? ""}`.trim());
          continue;
        }

        if (packageAmount <= 0) {
          blockingUnresolved.push(`${req.name} (invalid package size)`);
          continue;
        }

        estimatedCost += ingredientCost;
        ingredientBreakdown.push({
          name: req.name,
          quantity: formatScaledQuantity(scaledReqAmount),
          unit: req.unit ?? "",
          cost: ingredientCost,
          note: null,
        });
        scaledIngredientSummaries.push(`${req.name}: ${formatScaledQuantity(scaledReqAmount)} ${req.unit ?? ""}`.trim());
      }

      return {
        id: item.id,
        recipeName: item.name,
        baseServings,
        desiredServings,
        estimatedCost: blockingUnresolved.length === 0 ? estimatedCost : null,
        unresolved: [...blockingUnresolved, ...unresolved],
        scaledIngredientSummaries,
        ingredientBreakdown,
      };
    });
  }, [recipeCatalog, priceByIngredient, servingsByRecipe]);

  const estimatedIngredientTotal = useMemo(
    () => menuItemCosts.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0),
    [menuItemCosts]
  );

  const unresolvedRecipeCount = useMemo(
    () => menuItemCosts.filter((item) => item.estimatedCost === null).length,
    [menuItemCosts]
  );

  const averageRecipeCost = useMemo(() => {
    if (menuItemCosts.length === 0 || unresolvedRecipeCount > 0) return 0;
    const total = menuItemCosts.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0);
    return total / menuItemCosts.length;
  }, [menuItemCosts, unresolvedRecipeCount]);

  const preview = useMemo(() => {
    const meals = Math.max(1, Number(mealsCount) || 1);
    const manualGroceries = Math.max(0, Number(groceryCost) || 0);
    const groceries =
      useIngredientEstimate && unresolvedRecipeCount === 0
        ? averageRecipeCost * meals
        : manualGroceries;
    const hours = Math.max(0, Number(laborHours) || 0);
    const rate = Math.max(0, Number(laborRate) || 0);
    const profit = Math.max(0, Number(profitPercent) || 0);

    const laborCost = hours * rate;
    const breakEvenCost = groceries + laborCost;
    const totalQuote = breakEvenCost * (1 + profit / 100);
    const costPerMeal = breakEvenCost / meals;
    const quotePerMeal = totalQuote / meals;

    return {
      groceries,
      laborCost,
      breakEvenCost,
      totalQuote,
      costPerMeal,
      quotePerMeal,
    };
  }, [
    mealsCount,
    groceryCost,
    laborHours,
    laborRate,
    profitPercent,
    useIngredientEstimate,
    averageRecipeCost,
    unresolvedRecipeCount,
  ]);

  async function createQuote(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const payload = {
      clientId,
      mealsCount: Number(mealsCount),
      groceryCost: preview.groceries,
      laborHours: Number(laborHours),
      laborRate: Number(laborRate),
      profitPercent: Number(profitPercent),
      note: note || null,
    };

    const res = await fetch("/api/chef/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    const created = (await res.json()) as QuoteItem;
    setQuotes((prev) => [created, ...prev]);
    setStatus("saved");
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-[#3b2a1a]">Ingredient Base Prices</h2>
        <p className="text-sm text-gray-600">
          Enter base prices for ingredients across your recipe library. Recipe costs are generated from quantities before any menu is built.
        </p>

        {recipeCatalog.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No meal-plan recipes found yet. Add recipes first.
          </p>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-[#3b2a1a] mb-2">Ingredient Price Inputs</h3>
                {ingredientRows.length === 0 ? (
                  <p className="text-xs text-gray-500">No ingredients found in recipe library.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {ingredientRows.map((ingredient) => (
                      <div key={ingredient.key} className="grid grid-cols-12 gap-2 text-xs items-center">
                        <div className="col-span-4 text-gray-700">
                          {ingredient.name}
                          <span className="text-gray-400"> · {ingredient.usageCount} item(s)</span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={priceByIngredient[ingredient.key]?.packagePrice ?? ""}
                          onChange={(e) =>
                            setPriceByIngredient((prev) => ({
                              ...prev,
                              [ingredient.key]: {
                                packagePrice: e.target.value,
                                packageAmount: prev[ingredient.key]?.packageAmount ?? "",
                                packageUnit: prev[ingredient.key]?.packageUnit ?? unitLabel(ingredient.sampleUnit ?? "g"),
                              },
                            }))
                          }
                          className="col-span-2 border border-gray-300 rounded-md px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#c9a97a]"
                          placeholder="$"
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={priceByIngredient[ingredient.key]?.packageAmount ?? ""}
                          onChange={(e) =>
                            setPriceByIngredient((prev) => ({
                              ...prev,
                              [ingredient.key]: {
                                packagePrice: prev[ingredient.key]?.packagePrice ?? "",
                                packageAmount: e.target.value,
                                packageUnit: prev[ingredient.key]?.packageUnit ?? unitLabel(ingredient.sampleUnit ?? "g"),
                              },
                            }))
                          }
                          className="col-span-2 border border-gray-300 rounded-md px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#c9a97a]"
                          placeholder="size"
                        />
                        <select
                          value={priceByIngredient[ingredient.key]?.packageUnit ?? unitLabel(ingredient.sampleUnit ?? "g")}
                          onChange={(e) =>
                            setPriceByIngredient((prev) => ({
                              ...prev,
                              [ingredient.key]: {
                                packagePrice: prev[ingredient.key]?.packagePrice ?? "",
                                packageAmount: prev[ingredient.key]?.packageAmount ?? "",
                                packageUnit: e.target.value,
                              },
                            }))
                          }
                          className="col-span-2 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#c9a97a]"
                        >
                          {PACKAGE_UNIT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <div className="col-span-2 text-[11px] text-gray-400 text-right">example: $6 / 1.6 oz</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-[#3b2a1a] mb-2">Estimated Cost Per Menu Item</h3>
                {menuItemCosts.length === 0 ? (
                  <p className="text-xs text-gray-500">No menu items found.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {menuItemCosts.map((item) => {
                      const isExpanded = expandedMenuItemId === item.id;

                      return (
                      <div key={item.id} className="text-xs border-b border-gray-100 pb-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-gray-700 font-medium">{item.recipeName}</span>
                          <button
                            type="button"
                            onClick={() => setExpandedMenuItemId((current) => (current === item.id ? null : item.id))}
                            className={`rounded-md px-2 py-1 text-right transition-colors ${
                              item.estimatedCost === null
                                ? "text-amber-700 hover:bg-amber-50"
                                : "font-medium text-[#3b2a1a] hover:bg-[#f6efe6]"
                            }`}
                            aria-expanded={isExpanded}
                            aria-controls={`menu-item-cost-${item.id}`}
                          >
                            {item.estimatedCost === null ? "Pending ingredient pricing" : formatMoney(item.estimatedCost)}
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-400">{isExpanded ? "Hide" : "Show"}</span>
                          </button>
                        </div>
                        {item.estimatedCost === null && item.unresolved.length > 0 && (
                          <p className="mt-1 text-[11px] text-amber-700">{item.unresolved[0]}</p>
                        )}

                        <div className="mt-1 flex items-center gap-2">
                          <label className="text-gray-500">Servings</label>
                          <input
                            type="number"
                            min={1}
                            step="1"
                            value={servingsByRecipe[item.id] ?? String(item.baseServings)}
                            onChange={(e) =>
                              setServingsByRecipe((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            className="w-16 border border-gray-300 rounded px-2 py-0.5 text-right focus:outline-none focus:ring-1 focus:ring-[#c9a97a]"
                          />
                          <span className="text-[11px] text-gray-400">base {item.baseServings}</span>
                        </div>

                        {item.scaledIngredientSummaries.length > 0 && (
                          <p className="mt-1 text-[11px] text-gray-500">
                            {item.scaledIngredientSummaries.slice(0, 3).join(" • ")}
                            {item.scaledIngredientSummaries.length > 3 ? " • ..." : ""}
                          </p>
                        )}

                        {isExpanded && (
                          <div id={`menu-item-cost-${item.id}`} className="mt-2 rounded-lg bg-[#faf5ef] border border-[#eadfce] p-3 space-y-2">
                            <p className="text-[11px] font-medium text-[#3b2a1a]">Ingredient cost summary</p>
                            <ul className="space-y-1">
                              {item.ingredientBreakdown.map((ingredient, index) => (
                                <li key={`${item.id}-${ingredient.name}-${index}`} className="flex items-start justify-between gap-3 text-[11px]">
                                  <div className="min-w-0">
                                    <span className="text-gray-700 font-medium">{ingredient.name}</span>{" "}
                                    <span className="text-gray-500">
                                      {ingredient.quantity}
                                      {ingredient.unit ? ` ${ingredient.unit}` : ""}
                                    </span>
                                    {ingredient.note && <div className="text-amber-700">{ingredient.note}</div>}
                                  </div>
                                  <span className="shrink-0 font-medium text-[#3b2a1a]">
                                    {ingredient.cost === null ? "—" : formatMoney(ingredient.cost)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-[#faf5ef] border border-[#eadfce] px-3 py-2 text-sm flex items-center justify-between">
              <span className="text-gray-700">Average recipe ingredient cost (library-wide)</span>
              {unresolvedRecipeCount > 0 ? (
                <span className="font-semibold text-amber-700">Unavailable until all ingredient prices are assigned</span>
              ) : (
                <span className="font-semibold text-[#3b2a1a]">{formatMoney(averageRecipeCost)}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveIngredientPrices}
                disabled={ingredientSaveStatus === "saving"}
                className="bg-[#3b2a1a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2e1f0f] disabled:opacity-60"
              >
                {ingredientSaveStatus === "saving" ? "Saving..." : "Save Ingredient Prices"}
              </button>
              {ingredientSaveStatus === "saved" && (
                <span className="text-xs text-emerald-700">Saved to Supabase.</span>
              )}
              {ingredientSaveStatus === "error" && (
                <span className="text-xs text-red-600">{ingredientSaveError || "Could not save ingredient prices."}</span>
              )}
            </div>
          </>
        )}
      </section>

      <form onSubmit={createQuote} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-[#3b2a1a]">Client Quote</h2>
        <p className="text-sm text-gray-600">
          Build the final quote separately from ingredient inputs. You can use the ingredient estimate automatically or override with a manual grocery total.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Number of Meals</label>
            <input
              type="number"
              min={1}
              value={mealsCount}
              onChange={(e) => setMealsCount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Grocery Cost (total)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={groceryCost}
              onChange={(e) => setGroceryCost(e.target.value)}
              disabled={useIngredientEstimate}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
            <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={useIngredientEstimate}
                onChange={(e) => setUseIngredientEstimate(e.target.checked)}
                disabled={unresolvedRecipeCount > 0}
                className="h-4 w-4 accent-[#3b2a1a]"
              />
              Use estimated recipe average × meals ({formatMoney(averageRecipeCost)} per meal)
            </label>
            {unresolvedRecipeCount > 0 && (
              <p className="text-xs text-amber-700 mt-1">
                Add package price + size for every ingredient before recipe costs can be generated.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Labor Hours</label>
            <input
              type="number"
              step="0.25"
              min={0}
              value={laborHours}
              onChange={(e) => setLaborHours(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Labor Rate (per hour)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={laborRate}
              onChange={(e) => setLaborRate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Profit Target (%)</label>
            <input
              type="number"
              step="0.5"
              min={0}
              value={profitPercent}
              onChange={(e) => setProfitPercent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any assumptions or details for this quote"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
          <div className="rounded-lg bg-[#faf5ef] border border-[#eadfce] px-3 py-2">
            <p className="text-gray-500">Grocery Cost Used</p>
            <p className="font-semibold text-[#3b2a1a]">{formatMoney(preview.groceries)}</p>
          </div>
          <div className="rounded-lg bg-[#faf5ef] border border-[#eadfce] px-3 py-2">
            <p className="text-gray-500">Labor Cost</p>
            <p className="font-semibold text-[#3b2a1a]">{formatMoney(preview.laborCost)}</p>
          </div>
          <div className="rounded-lg bg-[#faf5ef] border border-[#eadfce] px-3 py-2">
            <p className="text-gray-500">Break-Even Total</p>
            <p className="font-semibold text-[#3b2a1a]">{formatMoney(preview.breakEvenCost)}</p>
          </div>
          <div className="rounded-lg bg-[#f0f9f2] border border-[#d8eadb] px-3 py-2">
            <p className="text-gray-500">Quote Total</p>
            <p className="font-semibold text-emerald-800">{formatMoney(preview.totalQuote)}</p>
          </div>
          <div className="rounded-lg bg-[#f0f9f2] border border-[#d8eadb] px-3 py-2">
            <p className="text-gray-500">Quote Per Meal</p>
            <p className="font-semibold text-emerald-800">{formatMoney(preview.quotePerMeal)}</p>
          </div>
        </div>

        {status === "error" && <p className="text-sm text-red-600">Could not save quote. Please check values and try again.</p>}
        {status === "saved" && <p className="text-sm text-emerald-700">Quote saved.</p>}

        <button
          type="submit"
          disabled={!clientId || status === "saving" || (useIngredientEstimate && unresolvedRecipeCount > 0)}
          className="bg-[#3b2a1a] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#2e1f0f] disabled:opacity-60"
        >
          {status === "saving" ? "Saving..." : "Save Quote"}
        </button>
      </form>

      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-[#3b2a1a] mb-3">Recent Quotes</h2>
        {quotes.length === 0 ? (
          <p className="text-sm text-gray-500">No quotes yet.</p>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <article key={quote.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#3b2a1a]">{quote.client.name}</p>
                    <p className="text-xs text-gray-500">{quote.client.email}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(quote.createdAt).toLocaleString()}</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-3 text-xs text-gray-600">
                  <p>Meals: <span className="font-medium text-gray-800">{quote.mealsCount}</span></p>
                  <p>Break-even: <span className="font-medium text-gray-800">{formatMoney(quote.breakEvenCost)}</span></p>
                  <p>Total quote: <span className="font-medium text-gray-800">{formatMoney(quote.totalQuote)}</span></p>
                  <p>Per meal: <span className="font-medium text-gray-800">{formatMoney(quote.quotePerMeal)}</span></p>
                </div>
                {quote.note && <p className="text-xs text-gray-600 mt-2">{quote.note}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

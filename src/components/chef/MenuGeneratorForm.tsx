"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfWeek, addDays } from "date-fns";
import { calculateRecipeCost } from "@/lib/recipe-pricing";
import { getAllergyTagsFromText, getAutoAllergyTags } from "@/lib/allergy-tags";
import {
  formatServingFraction,
  getPortionSizeServings,
  parseQuestionnaireData,
} from "@/lib/client-questionnaire";

type Client = { id: string; name: string; email: string; allergies: string | null; preferences: string | null; questionnaireData: string | null };
type Ingredient = { id: string; name: string; quantity: string | null; unit: string | null };
type Recipe = {
  id: string;
  name: string;
  mealType: string;
  tags: string | null;
  servings: number | null;
  ingredients: Ingredient[];
};
type IngredientPrice = {
  ingredientKey: string;
  packagePrice: number;
  packageAmount: number;
  packageUnit: string;
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_THEME_CLASSES = [
  "from-rose-200 via-orange-100 to-amber-100 border-rose-300",
  "from-amber-200 via-yellow-100 to-lime-100 border-amber-300",
  "from-lime-200 via-emerald-100 to-teal-100 border-lime-300",
  "from-sky-200 via-cyan-100 to-blue-100 border-sky-300",
  "from-indigo-200 via-violet-100 to-blue-100 border-indigo-300",
  "from-fuchsia-200 via-pink-100 to-rose-100 border-fuchsia-300",
  "from-stone-200 via-zinc-100 to-slate-100 border-stone-300",
] as const;

const MEAL_TYPE_LABEL: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
  SIDE_DISH: "Side Dish",
  SALAD: "Salad",
  SOUP: "Soup",
  PASTA: "Pasta",
  BOWL: "Bowl",
  SANDWICH: "Sandwich",
  TACO: "Taco",
  CURRY: "Curry",
  CASSEROLE: "Casserole",
  STIR_FRY: "Stir Fry",
  ROAST: "Roast",
  SEAFOOD: "Seafood",
  DESSERT: "Dessert",
  DRINK_ALCOHOLIC: "Drink (Alcoholic)",
  DRINK_NON_ALCOHOLIC: "Drink (Non-Alcoholic)",
};

const MEAL_TYPE_OPTIONS = Object.keys(MEAL_TYPE_LABEL);

function getSelectableMealTypesForSlot(mealType: string): string[] {
  if (mealType === "LUNCH" || mealType === "DINNER") {
    return ["LUNCH", "DINNER"];
  }

  return [mealType];
}

function getGroupMealTypes(groupKey: string): string[] {
  return getSelectableMealTypesForSlot(groupKey);
}

function isRecipeAllowedForClient(recipe: Recipe, blockedAllergyTags: Set<string>): boolean {
  if (blockedAllergyTags.size === 0) return true;

  const recipeTags = getAutoAllergyTags(recipe.ingredients);
  return recipeTags.every((tag) => !blockedAllergyTags.has(tag));
}

function getHouseholdServings(questionnaireData: string | null): number {
  const parsed = parseQuestionnaireData(questionnaireData);
  return parsed.household.reduce(
    (total, member) => total + getPortionSizeServings(member.portionSize),
    0
  );
}

function getRecipeSlotCoverage(recipeServings: number, householdServings: number): number {
  const normalizedRecipeServings = Number.isFinite(recipeServings) && recipeServings > 0 ? recipeServings : 1;
  const normalizedHouseholdServings = Number.isFinite(householdServings) && householdServings > 0 ? householdServings : 1;
  return Math.max(1, Math.ceil(normalizedRecipeServings / normalizedHouseholdServings));
}

/** Normalize ingredient names so singular/plural variants map together (e.g. peach/peaches). */
function normalizeIngredientName(name: string): string {
  const cleaned = name.toLowerCase().trim();
  if (cleaned.endsWith("ies") && cleaned.length > 3) return `${cleaned.slice(0, -3)}y`;
  if (cleaned.endsWith("es") && cleaned.length > 4) return cleaned.slice(0, -2);
  if (cleaned.endsWith("s") && cleaned.length > 3) return cleaned.slice(0, -1);
  return cleaned;
}

/** Returns a score for how well `recipe` fits with the already-selected set (shared ingredients). */
function ingredientScore(recipe: Recipe, selected: Recipe[]): number {
  if (selected.length === 0) return 1;
  const selectedIngredients = new Set(
    selected.flatMap((r) => r.ingredients.map((i) => normalizeIngredientName(i.name)))
  );
  const shared = recipe.ingredients.filter((i) =>
    selectedIngredients.has(normalizeIngredientName(i.name))
  ).length;
  return shared;
}

/** Greedy algorithm: builds a set of `count` recipes that maximize shared ingredients. */
function generateSmartSelection(
  pool: Recipe[],
  count: number,
  groupKey: string,
  getServings: (recipe: Recipe) => number,
  blockedAllergyTags: Set<string>,
  householdServings: number
): Recipe[] {
  const allowedTypes = new Set(getGroupMealTypes(groupKey));
  const candidates = pool.filter((r) => allowedTypes.has(r.mealType) && isRecipeAllowedForClient(r, blockedAllergyTags));
  if (candidates.length === 0) return [];

  const selected: Recipe[] = [];
  const selectedIds = new Set<string>();

  while (selected.length < count) {
    const remainingSlots = count - selected.length;
    const unused = candidates.filter((r) => !selectedIds.has(r.id));

    const candidatePool = unused.length > 0 ? unused : candidates;
    const nextRecipe = [...candidatePool].sort((a, b) => {
      const aScore = ingredientScore(a, selected) * 100 + getServings(a);
      const bScore = ingredientScore(b, selected) * 100 + getServings(b);
      return bScore - aScore;
    })[0];

    if (!nextRecipe) break;
    selectedIds.add(nextRecipe.id);

    const capacity = getRecipeSlotCoverage(getServings(nextRecipe), householdServings);
    const fillCount = Math.min(capacity, remainingSlots);
    for (let i = 0; i < fillCount; i += 1) {
      selected.push(nextRecipe);
    }
  }

  return selected;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function getDayThemeClass(day: number): string {
  return DAY_THEME_CLASSES[day] ?? DAY_THEME_CLASSES[0];
}

export default function MenuGeneratorForm({
  clients,
  recipes,
  ingredientPrices,
}: {
  clients: Client[];
  recipes: Recipe[];
  ingredientPrices: IngredientPrice[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [weekStart, setWeekStart] = useState(() => {
    const mon = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(mon, "yyyy-MM-dd");
  });
  const [menuTitle, setMenuTitle] = useState("");

  // Slot: dayOfWeek (0=Mon..6=Sun) × mealType × household member index → recipeId
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeDays, setActiveDays] = useState([0, 1, 2, 3, 4]); // Mon-Fri default
  const [selectedMealTypesByDay, setSelectedMealTypesByDay] = useState<Record<number, string[]>>(
    () =>
      Object.fromEntries(
        DAY_NAMES.map((_, day) => [day, ["LUNCH", "DINNER"]])
      ) as Record<number, string[]>
  );
  const [servingsByRecipe, setServingsByRecipe] = useState<Record<string, string>>({});

  function getServingsForRecipe(recipe: Recipe): number {
    const override = servingsByRecipe[recipe.id];
    const parsed = override !== undefined ? Number(override) : Number(recipe.servings ?? 1);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  }

  function slotKey(day: number, mealType: string, memberIndex: number) {
    return `${day}::${mealType}::${memberIndex}`;
  }

  function getMealTypesForDay(day: number) {
    return selectedMealTypesByDay[day] ?? [];
  }

  function generateMenu() {
    setSlots({});
    setGenerated(true);
  }

  function setSlot(day: number, mealType: string, memberIndex: number, recipeId: string) {
    setSlots((prev) => ({ ...prev, [slotKey(day, mealType, memberIndex)]: recipeId }));
  }

  function clearSlot(day: number, mealType: string, memberIndex: number) {
    setSlots((prev) => {
      const next = { ...prev };
      delete next[slotKey(day, mealType, memberIndex)];
      return next;
    });
  }

  function toggleDay(day: number) {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function toggleMealTypeForDay(day: number, mealType: string) {
    setSelectedMealTypesByDay((prev) => {
      const current = prev[day] ?? [];
      const nextMealTypes = current.includes(mealType)
        ? current.filter((type) => type !== mealType)
        : [...current, mealType];

      return {
        ...prev,
        [day]: nextMealTypes,
      };
    });
  }

  const displayMealTypes = useMemo(
    () =>
      MEAL_TYPE_OPTIONS.filter((mealType) =>
        activeDays.some((day) => getMealTypesForDay(day).includes(mealType))
      ),
    [activeDays, selectedMealTypesByDay]
  );

  const selectedMealTypeCount = useMemo(
    () => activeDays.reduce((count, day) => count + getMealTypesForDay(day).length, 0),
    [activeDays, selectedMealTypesByDay]
  );

  function renderDayMealTypeSelector(day: number) {
    const active = getMealTypesForDay(day);
    return (
      <div key={day} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#3b2a1a]">{DAY_NAMES[day]}</div>
            <div className="text-xs text-gray-500">Choose the meal types available on this day.</div>
          </div>
          <div className="text-xs text-gray-400">{active.length} selected</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPE_OPTIONS.map((mealType) => {
            const enabled = active.includes(mealType);
            return (
              <button
                key={`${day}-${mealType}`}
                type="button"
                onClick={() => toggleMealTypeForDay(day, mealType)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  enabled
                    ? "border-[#3b2a1a] bg-[#3b2a1a] text-white"
                    : "border-gray-300 text-gray-600 hover:border-[#c9a97a]"
                }`}
              >
                {MEAL_TYPE_LABEL[mealType] ?? mealType}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  async function saveMenu() {
    if (!clientId) return;
    setSaving(true);

    const items = Object.entries(slots)
      .filter(([, recipeId]) => recipeId)
      .map(([key, recipeId]) => {
        const [day, mealType] = key.split("::");
        return { dayOfWeek: parseInt(day), mealType, recipeId };
      });

    const res = await fetch("/api/chef/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, weekStart, title: menuTitle || null, items }),
    });

    setSaving(false);
    if (res.ok) {
      router.push("/chef/menus");
      router.refresh();
    }
  }

  const recipeMap = Object.fromEntries(recipes.map((r) => [r.id, r]));
  const selectedClient = clients.find((c) => c.id === clientId);
  const blockedAllergyTags = useMemo(() => {
    const parsed = parseQuestionnaireData(selectedClient?.questionnaireData ?? null);
    const householdTags = parsed.household.flatMap((member) => [
      ...getAllergyTagsFromText(member.allergies.join(", ")),
      ...getAllergyTagsFromText(member.otherAllergies),
    ]);
    const profileTags = [
      ...getAllergyTagsFromText(selectedClient?.allergies ?? null),
      ...getAllergyTagsFromText(selectedClient?.preferences ?? null),
    ];

    return new Set([...householdTags, ...profileTags]);
  }, [selectedClient?.questionnaireData, selectedClient?.allergies, selectedClient?.preferences]);
  const householdServings = useMemo(
    () => getHouseholdServings(selectedClient?.questionnaireData ?? null),
    [selectedClient?.questionnaireData]
  );
  const householdSummary = useMemo(() => {
    const parsed = parseQuestionnaireData(selectedClient?.questionnaireData ?? null);
    const members = parsed.household.map((member) => ({
      name: member.personName || "Unnamed person",
      portionSize: member.portionSize,
      servings: getPortionSizeServings(member.portionSize),
    }));

    return {
      members,
      total: members.reduce((sum, member) => sum + member.servings, 0),
    };
  }, [selectedClient?.questionnaireData]);
  const householdMembers = householdSummary.members.length > 0
    ? householdSummary.members
    : [{ name: "Household", portionSize: "Standard", servings: 1 }];
  const generatedRowsByDay = useMemo(
    () =>
      activeDays.map((day) => ({
        day,
        mealTypes: displayMealTypes.filter((mealType) => getMealTypesForDay(day).includes(mealType)),
      })),
    [activeDays, displayMealTypes, selectedMealTypesByDay]
  );
  const availableRecipes = useMemo(() => {
    const selectedMealTypes = new Set(
      activeDays.flatMap((day) => getMealTypesForDay(day))
    );

    return recipes.filter(
      (recipe) =>
        selectedMealTypes.has(recipe.mealType) &&
        isRecipeAllowedForClient(recipe, blockedAllergyTags)
    );
  }, [recipes, activeDays, selectedMealTypesByDay, blockedAllergyTags]);
  const recipeUsageStats = useMemo(() => {
    const stats: Record<string, { assignedMeals: number; usedServings: number; remainingServings: number }> = {};

    for (const recipe of availableRecipes) {
      let assignedMeals = 0;
      let usedServings = 0;

      for (const [key, recipeId] of Object.entries(slots)) {
        if (recipeId !== recipe.id) continue;

        const [, , memberIndexRaw] = key.split("::");
        const memberIndex = Number.parseInt(memberIndexRaw, 10);
        const memberServings = householdMembers[memberIndex]?.servings ?? 1;

        assignedMeals += 1;
        usedServings += memberServings;
      }

      const remainingServings = getServingsForRecipe(recipe) - usedServings;

      stats[recipe.id] = {
        assignedMeals,
        usedServings,
        remainingServings,
      };
    }

    return stats;
  }, [availableRecipes, slots, householdMembers, servingsByRecipe]);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Config panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-[#3b2a1a]">Menu Settings</h2>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week Starting *</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Menu Title (optional)</label>
            <input
              value={menuTitle}
              onChange={(e) => setMenuTitle(e.target.value)}
              placeholder="e.g. Mediterranean Week"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>
        </div>

        {/* Client info */}
        {selectedClient && (selectedClient.allergies || selectedClient.preferences || householdSummary.members.length > 0) && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm">
            {selectedClient.allergies && (
              <p><span className="font-medium text-amber-800">Allergies:</span> <span className="text-amber-700">{selectedClient.allergies}</span></p>
            )}
            {selectedClient.preferences && (
              <p className="mt-0.5"><span className="font-medium text-amber-800">Preferences:</span> <span className="text-amber-700">{selectedClient.preferences}</span></p>
            )}
            {householdSummary.members.length > 0 && (
              <div className="mt-2 border-t border-amber-100 pt-2 text-xs text-amber-800">
                <p className="font-medium">Household servings total: {formatServingFraction(householdSummary.total)} servings</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {householdSummary.members.map((member, index) => (
                    <span key={`${member.name}-${index}`} className="rounded-full bg-white/80 px-2 py-1 border border-amber-100">
                      {member.name}: {member.portionSize} = {formatServingFraction(member.servings)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Days to include:</label>
          <div className="flex flex-wrap gap-2">
            {DAY_NAMES.map((name, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  activeDays.includes(i)
                    ? "bg-[#3b2a1a] text-white border-[#3b2a1a]"
                    : "border-gray-300 text-gray-600 hover:border-[#c9a97a]"
                }`}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Meal groups */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meal types by day:</label>
          <div className="grid gap-3">
            {activeDays.map((day) => renderDayMealTypeSelector(day))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Lunch and dinner can be selected on the same day, and salad, soup, pasta, and the other categories are now separate slot types.
          </p>
        </div>

        <button
          type="button"
          onClick={generateMenu}
          disabled={activeDays.length === 0 || selectedMealTypeCount === 0 || recipes.length === 0}
          className="bg-[#c9a97a] text-[#3b2a1a] px-6 py-2.5 rounded-lg font-semibold hover:bg-[#b8956b] transition-colors disabled:opacity-50"
        >
          Build Menu Planner
        </button>
        <p className="text-xs text-gray-500">
          This creates an empty planning grid and lists only recipes that match the selected client&apos;s dietary restrictions.
        </p>
        {blockedAllergyTags.size > 0 && (
          <p className="text-xs text-red-600">
            Allergy filter active: recipes tagged {Array.from(blockedAllergyTags).join(", ")} will be excluded for this client.
          </p>
        )}
        {recipes.length === 0 && (
          <p className="text-sm text-red-500">Add recipes first before generating a menu.</p>
        )}
      </div>

      {/* Generated grid */}
      {generated && (
        <div className="rounded-xl border border-[#e7dccd] bg-[linear-gradient(180deg,#fff8f1_0%,#fffdf9_100%)] p-6 shadow-[0_18px_50px_-30px_rgba(88,54,24,0.45)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#3b2a1a]">Review &amp; Adjust Menu</h2>
            <button
              type="button"
              onClick={generateMenu}
              className="text-sm text-[#7c5c3a] hover:underline"
            >
              Regenerate
            </button>
          </div>

          <div className="mb-5 rounded-xl border border-[#eadfce] bg-white/70 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-medium text-[#3b2a1a]">Available Recipes</p>
                <p className="text-xs text-gray-500">
                  Only recipes matching this client&apos;s restrictions are shown here.
                </p>
              </div>
              <p className="text-xs text-gray-500">{availableRecipes.length} available</p>
            </div>
            <p className="mb-3 text-[11px] text-gray-500">
              Each household member can have a different recipe. Remaining servings update as you fill individual cells.
            </p>

            {availableRecipes.length === 0 ? (
              <p className="text-sm text-amber-700">
                No recipes currently match the selected meal types and allergy restrictions.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="min-w-[12rem] rounded-xl border border-[#e8ddd0] bg-[#fff8f1] px-3 py-2 shadow-sm"
                  >
                    {(() => {
                      const usage = recipeUsageStats[recipe.id] ?? {
                        assignedMeals: 0,
                        usedServings: 0,
                        remainingServings: getServingsForRecipe(recipe),
                      };
                      const isOverAssigned = usage.remainingServings < 0;
                      const isFullyUsed = usage.remainingServings === 0;

                      return (
                        <>
                    <p className="text-sm font-medium text-[#3b2a1a]">{recipe.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#7c5c3a] border border-[#eadfce]">
                        {MEAL_TYPE_LABEL[recipe.mealType] ?? recipe.mealType}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-600 border border-gray-200">
                        Makes {formatServingFraction(getServingsForRecipe(recipe))}
                      </span>
                      {usage.assignedMeals > 0 && (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-600 border border-gray-200">
                          Used in {usage.assignedMeals} assignment{usage.assignedMeals === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-2 text-[11px] font-medium ${
                        isOverAssigned
                          ? "text-red-600"
                          : isFullyUsed
                            ? "text-amber-700"
                            : "text-emerald-700"
                      }`}
                    >
                      {isOverAssigned
                        ? `${formatServingFraction(Math.abs(usage.remainingServings))} servings over capacity`
                        : `${formatServingFraction(usage.remainingServings)} servings left`}
                    </p>
                    {usage.usedServings > 0 && (
                      <p className="mt-1 text-[11px] text-gray-500">
                        {formatServingFraction(usage.usedServings)} servings allocated so far
                      </p>
                    )}
                    {recipe.tags && (
                      <p className="mt-2 text-[11px] text-gray-500">{recipe.tags}</p>
                    )}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm border-separate border-spacing-y-3">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium w-44">
                    Day
                  </th>
                  {householdMembers.map((member, index) => (
                    <th key={`${member.name}-${index}`} className="text-left py-2 px-3 text-gray-500 font-medium min-w-[12rem]">
                      <div>{member.name}</div>
                      <div className="text-[11px] font-normal text-gray-400">
                        {member.portionSize} · {formatServingFraction(member.servings)} serving{member.servings === 1 ? "" : "s"}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generatedRowsByDay.map(({ day, mealTypes }) => {
                  const dayDate = addDays(new Date(weekStart + "T00:00:00"), day);
                  const dayThemeClass = getDayThemeClass(day);
                  return (
                    mealTypes.length > 0 && mealTypes.map((mealType, mealIndex) => {
                      return (
                        <tr key={`${day}-${mealType}`}>
                          {mealIndex === 0 && (
                            <td
                              rowSpan={mealTypes.length}
                              className={`rounded-l-2xl border border-r-0 bg-gradient-to-r ${dayThemeClass} px-4 py-3 text-gray-800 font-medium align-top shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]`}
                            >
                              <div>{DAY_NAMES[day]}</div>
                              <div className="text-xs text-gray-500 font-normal">{format(dayDate, "MMM d")}</div>
                              <div className="mt-3 space-y-2">
                                {mealTypes.map((dayMealType) => {
                                  const dayAssignments = householdMembers
                                    .map((member, memberIndex) => {
                                      const dayRecipeId = slots[slotKey(day, dayMealType, memberIndex)];
                                      const dayRecipe = dayRecipeId ? recipeMap[dayRecipeId] : null;

                                      return dayRecipe
                                        ? `${member.name}: ${dayRecipe.name}`
                                        : null;
                                    })
                                    .filter(Boolean);
                                  return (
                                    <div key={`${day}-${dayMealType}-summary`} className="rounded-lg bg-white/60 backdrop-blur-[1px] border border-white/70 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                                      <div className="text-[11px] font-medium text-[#3b2a1a]">
                                        {MEAL_TYPE_LABEL[dayMealType] ?? dayMealType}
                                      </div>
                                      <div className="mt-0.5 text-[11px] text-gray-600">
                                        {dayAssignments.length > 0 ? dayAssignments.join(" • ") : "No dishes assigned"}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          )}
                          {householdMembers.map((member, index) => (
                            (() => {
                              const rid = slots[slotKey(day, mealType, index)];
                              const recipe = rid ? recipeMap[rid] : null;
                              const recipeUsage = recipe ? recipeUsageStats[recipe.id] : null;

                              return (
                                <td
                                  key={`${day}-${mealType}-${member.name}-${index}`}
                                  className={`border-y ${index === householdMembers.length - 1 ? "border-r rounded-r-2xl" : "border-r"} border-l-0 bg-gradient-to-r ${dayThemeClass} px-3 py-3 align-top shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]`}
                                >
                                  <div className="rounded-xl bg-white/65 backdrop-blur-[1px] border border-white/75 px-3 py-2 min-h-[4.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs font-medium text-[#3b2a1a]">{MEAL_TYPE_LABEL[mealType] ?? mealType}</p>
                                    </div>
                                    <div className="mt-2 flex items-center gap-1">
                                      <select
                                        value={rid ?? ""}
                                        onChange={(e) =>
                                          e.target.value
                                            ? setSlot(day, mealType, index, e.target.value)
                                            : clearSlot(day, mealType, index)
                                        }
                                        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#c9a97a] bg-white"
                                      >
                                        <option value="">(none)</option>
                                        {recipes
                                          .filter(
                                            (r) =>
                                              getSelectableMealTypesForSlot(mealType).includes(r.mealType) &&
                                              isRecipeAllowedForClient(r, blockedAllergyTags)
                                          )
                                          .map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                          ))}
                                      </select>
                                    </div>
                                    <p className="mt-1 text-[11px] text-gray-600">{recipe ? recipe.name : "No dish assigned"}</p>
                                    <p className="mt-1 text-[11px] text-gray-500">
                                      {member.name}: {formatServingFraction(member.servings)} serving{member.servings === 1 ? "" : "s"}
                                    </p>
                                    {recipeUsage && (
                                      <p className={`mt-1 text-[11px] ${recipeUsage.remainingServings < 0 ? "text-red-600" : "text-gray-500"}`}>
                                        {recipeUsage.remainingServings < 0
                                          ? `${formatServingFraction(Math.abs(recipeUsage.remainingServings))} servings over`
                                          : `${formatServingFraction(recipeUsage.remainingServings)} servings left`}
                                      </p>
                                    )}
                                    {recipe && !getSelectableMealTypesForSlot(mealType).includes(recipe.mealType) && (
                                      <p className="text-[11px] text-amber-600 mt-1">⚠ outside this slot type</p>
                                    )}
                                  </div>
                                </td>
                              );
                            })()
                          ))}
                        </tr>
                      );
                    })
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={saveMenu}
              disabled={saving || Object.keys(slots).length === 0}
              className="bg-[#3b2a1a] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#2e1f0f] transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save &amp; Send to Client"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

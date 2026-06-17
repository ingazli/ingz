"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfWeek, addDays } from "date-fns";

type Client = { id: string; name: string; email: string; allergies: string | null; preferences: string | null };
type Ingredient = { id: string; name: string };
type Recipe = { id: string; name: string; mealType: string; tags: string | null; ingredients: Ingredient[] };

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MENU_GROUPS = [
  {
    key: "BREAKFAST",
    label: "Breakfast",
    includes: ["BREAKFAST"],
    description: "Morning dishes",
  },
  {
    key: "LUNCH",
    label: "Lunch",
    includes: ["LUNCH", "SALAD", "SOUP", "PASTA", "BOWL", "SANDWICH", "TACO"],
    description: "Salads, soups, pastas, bowls, sandwiches, and tacos",
  },
  {
    key: "DINNER",
    label: "Dinner",
    includes: [
      "DINNER",
      "SIDE_DISH",
      "CURRY",
      "CASSEROLE",
      "STIR_FRY",
      "ROAST",
      "SEAFOOD",
      "DESSERT",
      "DRINK_ALCOHOLIC",
      "DRINK_NON_ALCOHOLIC",
    ],
    description: "Entrées, sides, desserts, and drinks",
  },
  {
    key: "SNACK",
    label: "Snack",
    includes: ["SNACK"],
    description: "Lighter bites",
  },
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

function getGroupMealTypes(groupKey: string): string[] {
  return Array.from(MENU_GROUPS.find((group) => group.key === groupKey)?.includes ?? [groupKey]);
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
  groupKey: string
): Recipe[] {
  const allowedTypes = new Set(getGroupMealTypes(groupKey));
  const candidates = pool.filter((r) => allowedTypes.has(r.mealType));
  if (candidates.length === 0) return [];

  const selected: Recipe[] = [];
  const remaining = [...candidates];

  // Start with a random seed
  const seed = remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0];
  selected.push(seed);

  while (selected.length < count && remaining.length > 0) {
    // Sort by ingredient overlap score descending, then pick the best
    remaining.sort((a, b) => ingredientScore(b, selected) - ingredientScore(a, selected));
    selected.push(remaining.shift()!);
  }

  return selected;
}

export default function MenuGeneratorForm({ clients, recipes }: { clients: Client[]; recipes: Recipe[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [weekStart, setWeekStart] = useState(() => {
    const mon = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(mon, "yyyy-MM-dd");
  });
  const [menuTitle, setMenuTitle] = useState("");

  // Slot: dayOfWeek (0=Mon..6=Sun) × mealType → recipeId
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeDays, setActiveDays] = useState([0, 1, 2, 3, 4]); // Mon-Fri default
  const [activeMealTypes, setActiveMealTypes] = useState(["LUNCH", "DINNER"]);

  function slotKey(day: number, mealType: string) {
    return `${day}-${mealType}`;
  }

  function generateMenu() {
    const newSlots: Record<string, string> = {};
    for (const mt of activeMealTypes) {
      const count = activeDays.length;
      const selection = generateSmartSelection(recipes, count, mt);
      activeDays.forEach((day, idx) => {
        const recipe = selection[idx % selection.length];
        if (recipe) newSlots[slotKey(day, mt)] = recipe.id;
      });
    }
    setSlots(newSlots);
    setGenerated(true);
  }

  function setSlot(day: number, mealType: string, recipeId: string) {
    setSlots((prev) => ({ ...prev, [slotKey(day, mealType)]: recipeId }));
  }

  function clearSlot(day: number, mealType: string) {
    setSlots((prev) => {
      const next = { ...prev };
      delete next[slotKey(day, mealType)];
      return next;
    });
  }

  function toggleDay(day: number) {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function toggleMealType(mt: string) {
    setActiveMealTypes((prev) =>
      prev.includes(mt) ? prev.filter((m) => m !== mt) : [...prev, mt]
    );
  }

  function renderMealTypeGroup(groupKey: string) {
    const group = MENU_GROUPS.find((item) => item.key === groupKey);
    if (!group) return null;

    const active = activeMealTypes.includes(groupKey);
    return (
      <button
        key={groupKey}
        type="button"
        onClick={() => toggleMealType(groupKey)}
        className={`text-left rounded-xl border p-4 transition-colors ${
          active
            ? "bg-[#3b2a1a] text-white border-[#3b2a1a]"
            : "bg-white border-gray-200 text-gray-700 hover:border-[#c9a97a]"
        }`}
      >
        <div className="font-semibold text-sm">{group.label}</div>
        <div className={`mt-1 text-xs ${active ? "text-white/75" : "text-gray-500"}`}>
          {group.description}
        </div>
      </button>
    );
  }

  async function saveMenu() {
    if (!clientId) return;
    setSaving(true);

    const items = Object.entries(slots)
      .filter(([, recipeId]) => recipeId)
      .map(([key, recipeId]) => {
        const [day, mealType] = key.split("-");
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
        {selectedClient && (selectedClient.allergies || selectedClient.preferences) && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm">
            {selectedClient.allergies && (
              <p><span className="font-medium text-amber-800">Allergies:</span> <span className="text-amber-700">{selectedClient.allergies}</span></p>
            )}
            {selectedClient.preferences && (
              <p className="mt-0.5"><span className="font-medium text-amber-800">Preferences:</span> <span className="text-amber-700">{selectedClient.preferences}</span></p>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Meal groups to include:</label>
          <div className="grid gap-3 sm:grid-cols-2">
            {MENU_GROUPS.map((group) => renderMealTypeGroup(group.key))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Lunch and dinner act as headers, and recipes tagged Salad, Pasta, Soup, and similar categories are included inside those groups.
          </p>
        </div>

        <button
          type="button"
          onClick={generateMenu}
          disabled={activeDays.length === 0 || activeMealTypes.length === 0 || recipes.length === 0}
          className="bg-[#c9a97a] text-[#3b2a1a] px-6 py-2.5 rounded-lg font-semibold hover:bg-[#b8956b] transition-colors disabled:opacity-50"
        >
          ✦ Auto-Generate Menu
        </button>
        {recipes.length === 0 && (
          <p className="text-sm text-red-500">Add recipes first before generating a menu.</p>
        )}
      </div>

      {/* Generated grid */}
      {generated && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
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

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium w-24" rowSpan={2}>
                    Day
                  </th>
                  {activeMealTypes.map((mt) => (
                    <th key={mt} className="text-left py-2 px-3 text-gray-500 font-medium">
                      {MEAL_TYPE_LABEL[mt] ?? mt}
                    </th>
                  ))}
                </tr>
                <tr>
                  {activeMealTypes.map((mt) => (
                    <th key={`${mt}-sub`} className="text-left pb-2 px-3 text-xs text-gray-400 font-normal">
                      {getGroupMealTypes(mt)
                        .filter((type) => type !== mt)
                        .map((type) => MEAL_TYPE_LABEL[type] ?? type)
                        .join(", ") || "Included recipes"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeDays.map((day) => {
                  const dayDate = addDays(new Date(weekStart + "T00:00:00"), day);
                  return (
                    <tr key={day} className="border-t border-gray-100">
                      <td className="py-2 pr-4 text-gray-600 font-medium">
                        <div>{DAY_NAMES[day].slice(0, 3)}</div>
                        <div className="text-xs text-gray-400 font-normal">{format(dayDate, "MMM d")}</div>
                      </td>
                      {activeMealTypes.map((mt) => {
                        const rid = slots[slotKey(day, mt)];
                        const recipe = rid ? recipeMap[rid] : null;
                        return (
                          <td key={mt} className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <select
                                value={rid ?? ""}
                                onChange={(e) =>
                                  e.target.value
                                    ? setSlot(day, mt, e.target.value)
                                    : clearSlot(day, mt)
                                }
                                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#c9a97a] max-w-[180px]"
                              >
                                <option value="">(none)</option>
                                {recipes
                                  .filter((r) => getGroupMealTypes(mt).includes(r.mealType))
                                  .map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                  ))}
                              </select>
                            </div>
                            {recipe && !getGroupMealTypes(mt).includes(recipe.mealType) && (
                              <p className="text-xs text-amber-600 mt-0.5">⚠ outside this header</p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
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

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Ingredient = { id?: string; name: string; quantity: string | null; unit: string | null };
type Recipe = {
  id: string;
  name: string;
  tags: string | null;
  cookbookName: string | null;
  recipeLink: string | null;
  pageNumber: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  mealType: string;
  ingredients: Ingredient[];
};

const MEAL_TYPES = [
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK",
  "SIDE_DISH",
  "SALAD",
  "SOUP",
  "PASTA",
  "BOWL",
  "SANDWICH",
  "TACO",
  "CURRY",
  "CASSEROLE",
  "STIR_FRY",
  "ROAST",
  "SEAFOOD",
  "DESSERT",
  "DRINK_ALCOHOLIC",
  "DRINK_NON_ALCOHOLIC",
];

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

export default function RecipeForm({
  recipe,
  cookbookNames,
}: {
  recipe?: Recipe;
  cookbookNames?: string[];
}) {
  const cookbookOptions = cookbookNames ?? [];
  const router = useRouter();
  const isEdit = !!recipe;

  const [name, setName] = useState(recipe?.name ?? "");
  const [tags, setTags] = useState(recipe?.tags ?? "");
  const [cookbookName, setCookbookName] = useState(recipe?.cookbookName ?? "");
  const [recipeLink, setRecipeLink] = useState(recipe?.recipeLink ?? "");
  const [pageNumber, setPageNumber] = useState(recipe?.pageNumber ?? "");
  const [prepTime, setPrepTime] = useState(recipe?.prepTime?.toString() ?? "");
  const [cookTime, setCookTime] = useState(recipe?.cookTime?.toString() ?? "");
  const [servings, setServings] = useState(recipe?.servings?.toString() ?? "");
  const [mealType, setMealType] = useState(recipe?.mealType ?? "DINNER");
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients?.map((i) => ({ ...i, quantity: i.quantity ?? "", unit: i.unit ?? "" })) ??
      [{ name: "", quantity: "", unit: "" }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addIngredient() {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
  }

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const body = {
      name,
      tags: tags || null,
      cookbookName: cookbookName || null,
      recipeLink: recipeLink || null,
      pageNumber: pageNumber || null,
      prepTime: prepTime ? parseInt(prepTime) : null,
      cookTime: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : null,
      mealType,
      ingredients: ingredients.filter((i) => i.name.trim()),
    };

    const url = isEdit ? `/api/chef/recipes/${recipe!.id}` : "/api/chef/recipes";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Failed to save recipe. Please try again.");
      return;
    }

    router.push("/chef/recipes");
    router.refresh();
  }

  async function handleDelete() {
    if (!isEdit || !confirm("Delete this recipe?")) return;
    await fetch(`/api/chef/recipes/${recipe!.id}`, { method: "DELETE" });
    router.push("/chef/recipes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-[#3b2a1a]">Recipe Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            placeholder="e.g. Lemon Herb Chicken"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            placeholder="vegetarian, gluten free, dairy free"
          />
          <p className="text-xs text-gray-400 mt-1">
            Comma-separated tags for planning and filtering.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cookbook Name</label>
            <input
              list="cookbook-name-options"
              value={cookbookName}
              onChange={(e) => setCookbookName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
              placeholder="e.g. Half Baked Harvest"
            />
            <datalist id="cookbook-name-options">
              {cookbookOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Link</label>
            <input
              type="url"
              value={recipeLink}
              onChange={(e) => setRecipeLink(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Page Number</label>
            <input
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
              placeholder="e.g. 47"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            >
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>{MEAL_TYPE_LABEL[t] ?? t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prep (min)</label>
            <input
              type="number"
              min="0"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cook (min)</label>
            <input
              type="number"
              min="0"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
            <input
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
            />
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="font-semibold text-[#3b2a1a]">Ingredients</h2>
        {ingredients.map((ing, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              value={ing.quantity ?? ""}
              onChange={(e) => updateIngredient(idx, "quantity", e.target.value)}
              placeholder="Qty"
              className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a97a]"
            />
            <input
              value={ing.unit ?? ""}
              onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
              placeholder="Unit"
              className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a97a]"
            />
            <input
              value={ing.name}
              onChange={(e) => updateIngredient(idx, "name", e.target.value)}
              placeholder="Ingredient name"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a97a]"
            />
            <button
              type="button"
              onClick={() => removeIngredient(idx)}
              className="text-gray-400 hover:text-red-500 px-1 text-lg"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addIngredient}
          className="text-sm text-[#7c5c3a] hover:underline"
        >
          + Add ingredient
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#3b2a1a] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#2e1f0f] transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Recipe"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto px-6 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm"
          >
            Delete Recipe
          </button>
        )}
      </div>
    </form>
  );
}

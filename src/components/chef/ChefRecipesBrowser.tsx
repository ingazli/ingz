"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ALLERGY_TAGS } from "@/lib/allergy-tags";

type RecipeListItem = {
  id: string;
  name: string;
  category: "MEAL_PLAN" | "ADD_ON";
  addOnType: string | null;
  mealType: string;
  tags: string | null;
  cookbookName: string | null;
  pageNumber: string | null;
  recipeLink: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  ingredients: { id: string; name: string; quantity: string | null; unit: string | null }[];
  _count: { menuItems: number; feedbacks: number };
};

type RecipeBrowserProps = {
  recipes: RecipeListItem[];
  ratingMap: Record<string, number | null | undefined>;
  recipeCostMap: Record<string, { estimatedCost: number | null }>;
};

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

const ADD_ON_TYPE_LABEL: Record<string, string> = {
  JAM: "Jam",
  PICKLE: "Pickle",
  SAUCE: "Sauce",
  SPREAD: "Spread",
  CONDIMENT: "Condiment",
  FERMENT: "Ferment",
  DRINK: "Drink",
  DESSERT_SNACK: "Dessert / Snack",
  PANTRY_STAPLE: "Pantry Staple",
  OTHER: "Other",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function isAllergyTag(tag: string) {
  return ALLERGY_TAGS.includes(tag.trim().toLowerCase() as (typeof ALLERGY_TAGS)[number]);
}

export default function ChefRecipesBrowser({ recipes, ratingMap, recipeCostMap }: RecipeBrowserProps) {
  const [search, setSearch] = useState("");

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);
    if (!normalizedSearch) return recipes;
    return recipes.filter((recipe) => recipe.name.toLowerCase().includes(normalizedSearch));
  }, [recipes, search]);

  const cookbookGroups = useMemo(() => {
    const groups = new Map<string, { cookbookName: string; recipes: RecipeListItem[] }>();

    for (const recipe of filteredRecipes) {
      const cookbookName = recipe.cookbookName?.trim() || "No Cookbook";
      const existing = groups.get(cookbookName);
      if (existing) {
        existing.recipes.push(recipe);
      } else {
        groups.set(cookbookName, { cookbookName, recipes: [recipe] });
      }
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.cookbookName === "No Cookbook") return 1;
      if (b.cookbookName === "No Cookbook") return -1;
      return a.cookbookName.localeCompare(b.cookbookName);
    });
  }, [filteredRecipes]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="recipe-search">
          Search recipes by name
        </label>
        <input
          id="recipe-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c9a97a]"
          placeholder="Type a recipe name..."
        />
        <p className="mt-2 text-xs text-gray-500">
          Showing {filteredRecipes.length} of {recipes.length} recipes.
        </p>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-600">
          No recipes match that name.
        </div>
      ) : (
        <div className="space-y-3">
          {cookbookGroups.map((group) => (
            <details key={group.cookbookName} className="bg-white rounded-xl border border-gray-200 p-4" open={search.trim().length > 0}>
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#3b2a1a]">{group.cookbookName}</h3>
                  <p className="text-xs text-gray-500">{group.recipes.length} recipe{group.recipes.length === 1 ? "" : "s"}</p>
                </div>
                <span className="text-xs text-gray-400">Dropdown</span>
              </summary>

              <div className="mt-4 grid gap-3">
                {group.recipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/chef/recipes/${recipe.id}`}
                    className="block rounded-xl border border-gray-200 p-4 hover:border-[#c9a97a] hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-sm font-semibold text-[#3b2a1a]">{recipe.name}</h3>
                          <span className="text-xs bg-[#faf5ef] text-[#7c5c3a] px-2 py-0.5 rounded-full border border-[#e8ddd0]">
                            {recipe.category === "ADD_ON"
                              ? ADD_ON_TYPE_LABEL[recipe.addOnType ?? "OTHER"] ?? recipe.addOnType ?? "Other"
                              : MEAL_TYPE_LABEL[recipe.mealType] ?? recipe.mealType}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              recipe.category === "ADD_ON"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-[#f4ede4] text-[#6f4f2d] border-[#e8ddd0]"
                            }`}
                          >
                            {recipe.category === "ADD_ON" ? "Client Add-On" : "Meal Plan"}
                          </span>
                          {ratingMap[recipe.id] && <span className="text-xs text-amber-600">★ {ratingMap[recipe.id]!.toFixed(1)}</span>}
                        </div>

                        {recipe.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {recipe.tags
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean)
                              .map((tag) => (
                                <span
                                  key={`${recipe.id}-${tag}`}
                                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                    isAllergyTag(tag)
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-[#f6f1ea] text-[#7c5c3a] border-[#eadfce]"
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                          {recipe.prepTime && <span>Prep {recipe.prepTime} min</span>}
                          {recipe.cookTime && <span>Cook {recipe.cookTime} min</span>}
                          {recipe.servings && <span>Serves {recipe.servings}</span>}
                          <span>{recipe.ingredients.length} ingredients</span>
                          <span>{recipe._count.menuItems} menus used</span>
                          {recipe.pageNumber && <span>Page: {recipe.pageNumber}</span>}
                        </div>

                        {recipe.recipeLink && (
                          <p className="text-xs mt-1 text-[#7c5c3a] underline underline-offset-2">{recipe.recipeLink}</p>
                        )}

                        {recipe.category === "MEAL_PLAN" && recipeCostMap[recipe.id]?.estimatedCost !== null && (
                          <p className="text-xs mt-2 font-medium text-[#3b2a1a]">
                            Generated recipe price: {formatCurrency(recipeCostMap[recipe.id].estimatedCost ?? 0)}
                          </p>
                        )}
                        {recipe.category === "MEAL_PLAN" && recipeCostMap[recipe.id]?.estimatedCost === null && recipe.ingredients.length > 0 && (
                          <p className="text-xs mt-2 text-amber-700">
                            Add base prices for all ingredients to generate this recipe price.
                          </p>
                        )}
                      </div>
                      <div className="text-gray-300 shrink-0 text-lg">›</div>
                    </div>
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
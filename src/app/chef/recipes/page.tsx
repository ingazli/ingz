import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRecipeCost } from "@/lib/recipe-pricing";
import ChefRecipesBrowser from "@/components/chef/ChefRecipesBrowser";
import { getAutoAllergyTags, mergeRecipeTags } from "@/lib/allergy-tags";

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

type IngredientPriceRow = {
  ingredientKey: string;
  packagePrice: number;
  packageAmount: number;
  packageUnit: string;
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

export default async function ChefRecipesPage() {
  const session = await getServerSession(authOptions);
  const chefId = session?.user?.id;

  const recipesRaw = await prisma.recipe.findMany({
    include: { ingredients: true, _count: { select: { menuItems: true, feedbacks: true } } },
    orderBy: { createdAt: "desc" },
  });

  const ingredientPrices = chefId
    ? await prisma.chefIngredientPrice.findMany({
        where: { chefId },
        select: { ingredientKey: true, packagePrice: true, packageAmount: true, packageUnit: true },
      })
    : [];

  const ingredientPriceRows: IngredientPriceRow[] = ingredientPrices.map((price) => ({
    ingredientKey: price.ingredientKey,
    packagePrice: price.packagePrice,
    packageAmount: price.packageAmount,
    packageUnit: price.packageUnit,
  }));

  const recipes: RecipeListItem[] = recipesRaw.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    category: (recipe as { category?: "MEAL_PLAN" | "ADD_ON" }).category ?? "MEAL_PLAN",
    addOnType: (recipe as { addOnType?: string | null }).addOnType ?? null,
    mealType: recipe.mealType,
    tags: mergeRecipeTags((recipe as { tags?: string | null }).tags ?? null, getAutoAllergyTags(recipe.ingredients)),
    cookbookName: (recipe as { cookbookName?: string | null }).cookbookName ?? null,
    pageNumber: (recipe as { pageNumber?: string | null }).pageNumber ?? null,
    recipeLink: (recipe as { recipeLink?: string | null }).recipeLink ?? null,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    ingredients: recipe.ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    })),
    _count: recipe._count,
  }));

  const avgRatings = await prisma.mealFeedback.groupBy({
    by: ["recipeId"],
    _avg: { rating: true },
  });
  const ratingMap = Object.fromEntries(avgRatings.map((r) => [r.recipeId, r._avg.rating]));
  const addOnCount = recipes.filter((recipe) => recipe.category === "ADD_ON").length;
  const mealPlanCount = recipes.length - addOnCount;

  const recipeCostMap = Object.fromEntries(
    recipes.map((recipe) => {
      const pricing = calculateRecipeCost(recipe.ingredients, ingredientPriceRows, recipe.servings ?? 1);
      return [recipe.id, { estimatedCost: pricing.estimatedCost }];
    })
  ) as Record<string, { estimatedCost: number | null }>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#3b2a1a]">Recipes</h1>
          <p className="text-gray-500 text-sm">
            {recipes.length} items in your library ({mealPlanCount} meal plan, {addOnCount} add-on)
          </p>
        </div>
        <Link
          href="/chef/recipes/new"
          className="bg-[#3b2a1a] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#2e1f0f] transition-colors text-sm"
        >
          + New Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-600">No recipes yet. Add your first one!</p>
          <Link href="/chef/recipes/new" className="text-[#7c5c3a] font-medium hover:underline text-sm mt-2 inline-block">
            Add Recipe →
          </Link>
        </div>
      ) : (
        <ChefRecipesBrowser recipes={recipes} ratingMap={ratingMap} recipeCostMap={recipeCostMap} />
      )}
    </div>
  );
}

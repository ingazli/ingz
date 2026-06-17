import { prisma } from "@/lib/prisma";
import Link from "next/link";

type RecipeListItem = {
  id: string;
  name: string;
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

export default async function ChefRecipesPage() {
  const recipesRaw = await prisma.recipe.findMany({
    include: { ingredients: true, _count: { select: { menuItems: true, feedbacks: true } } },
    orderBy: { createdAt: "desc" },
  });
  const recipes: RecipeListItem[] = recipesRaw.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    mealType: recipe.mealType,
    tags: (recipe as { tags?: string | null }).tags ?? null,
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#3b2a1a]">Recipes</h1>
          <p className="text-gray-500 text-sm">{recipes.length} recipes in your library</p>
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
        <div className="grid gap-4">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/chef/recipes/${recipe.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-[#c9a97a] hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-[#3b2a1a]">{recipe.name}</h3>
                    <span className="text-xs bg-[#faf5ef] text-[#7c5c3a] px-2 py-0.5 rounded-full border border-[#e8ddd0]">
                      {MEAL_TYPE_LABEL[recipe.mealType] ?? recipe.mealType}
                    </span>
                    {ratingMap[recipe.id] && (
                      <span className="text-xs text-amber-600">
                        ★ {ratingMap[recipe.id]!.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {recipe.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recipe.tags
                        .split(",")
                        .map((t: string) => t.trim())
                        .filter(Boolean)
                        .map((tag: string) => (
                          <span
                            key={`${recipe.id}-${tag}`}
                            className="text-[11px] bg-[#f6f1ea] text-[#7c5c3a] border border-[#eadfce] px-2 py-0.5 rounded-full"
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
                    {recipe.cookbookName && <span>Book: {recipe.cookbookName}</span>}
                    {recipe.pageNumber && <span>Page: {recipe.pageNumber}</span>}
                  </div>
                  {recipe.recipeLink && (
                    <p className="text-xs mt-1 text-[#7c5c3a] underline underline-offset-2">
                      {recipe.recipeLink}
                    </p>
                  )}
                </div>
                <div className="text-gray-300 shrink-0 text-lg">›</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
